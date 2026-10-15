import type { ChatMessage } from "@campus-ai/shared-types";

/** Ollama非流式聊天接口的必要响应字段。 */
interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  error?: string;
}

/**
 * 调用本机Ollama并返回模型生成的文本。
 */
export async function chatWithOllama(messages: ChatMessage[]): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? "qwen3:1.7b";

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        // 关键知识点：Ollama只需要role和content，不需要前端消息id。
        messages: messages.map(({ role, content }) => ({ role, content })),
        // 第4讲再实现流式响应，本讲先一次性返回完整结果。
        stream: false,
        // 关闭思考内容，只向页面返回最终回答。
        think: false,
        options: {
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(300_000),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Ollama响应超时", { cause: error });
    }
    throw new Error("无法连接Ollama，请确认Ollama已经启动", {
      cause: error,
    });
  }
  const result = (await response.json()) as OllamaChatResponse;
  if (!response.ok) {
    throw new Error(result.error ?? `Ollama请求失败：${response.status}`);
  }
  const content = result.message?.content?.trim();
  if (!content) {
    throw new Error("Ollama没有返回有效内容");
  }
  return content;
}
