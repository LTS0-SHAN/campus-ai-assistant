import type { ChatMessage, ModelStreamEvent } from "@campus-ai/shared-types";
import OpenAI from "openai";

// 每次 yield 一个事件；调用者通过 for await 持续接收。
export async function* streamConfiguredModel(
  messages: ChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<ModelStreamEvent> {
  const provider = process.env.LLM_PROVIDER ?? "ollama";

  if (provider === "ollama") {
    yield* streamOllama(messages, signal);
  } else if (provider === "bailian") {
    yield* streamBailian(messages, signal);
  } else {
    throw new Error(`不支持的模型提供商：${provider}`);
  }
}

async function* streamOllama(
  messages: ChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<ModelStreamEvent> {
  const baseURL = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");

  let response: Response;
  try {
    response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? "qwen3:0.6b",
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream: true,
        think: false,
        options: { temperature: 0.5 },
      }),
      signal,
    });
  } catch (error: unknown) {
    // 用户主动停止时保持原样抛出，由路由层处理。
    if (signal.aborted) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Ollama响应超时", { cause: error });
    }
    throw new Error("无法连接Ollama，请确认Ollama已经启动", { cause: error });
  }

  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(`Ollama 调用失败（HTTP ${response.status}），请检查服务与模型名称`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      // 一个汉字可能跨两个网络块，必须连续解码。
      buffer += decoder.decode(value, { stream: !done });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      if (done && buffer.trim()) lines.push(buffer);

      for (const line of lines) {
        if (!line.trim()) continue;

        const chunk = JSON.parse(line) as {
          message?: { content?: unknown };
          done?: boolean;
          done_reason?: unknown;
          error?: unknown;
        } | null;

        if (chunk?.error) throw new Error("Ollama 在生成过程中返回错误");

        const text = chunk?.message?.content;
        // 不 trim 增量文本，否则会丢失空格和换行。
        if (typeof text === "string" && text) yield { type: "delta", text };

        if (chunk?.done === true) {
          yield {
            type: "done",
            finishReason: typeof chunk.done_reason === "string" ? chunk.done_reason : "unknown",
          };
          return;
        }
      }

      if (done) throw new Error("Ollama 连接提前结束，回答未完成");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function* streamBailian(
  messages: ChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<ModelStreamEvent> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("请配置后端 DASHSCOPE_API_KEY");

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
    timeout: 300_000,
    maxRetries: 0, // 本实验由用户主动重试，避免隐式重复请求。
  });

  try {
    const stream = await client.chat.completions.create(
      {
        model: process.env.DASHSCOPE_MODEL ?? "glm-5.1",
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: 0.7,
        stream: true,
      },
      { signal }, // 取消信号必须传给真正的模型请求。
    );

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      const text = choice?.delta.content;
      if (text) yield { type: "delta", text };

      if (choice?.finish_reason) {
        yield { type: "done", finishReason: choice.finish_reason };
        return;
      }
    }

    throw new Error("在线模型连接提前结束，回答未完成");
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`在线模型调用失败（HTTP ${error.status ?? "未知"}），请检查后端配置`, {
        cause: error,
      });
    }
    throw error;
  }
}
