import type { ChatMessage } from "@campus-ai/shared-types";
import OpenAI from "openai";

// 方案一：Node.js原生fetch实现。完整保留，用于与OpenAI SDK方案对照。
/** 阿里百炼OpenAI兼容接口中，本实验需要使用的响应字段。 */
interface BailianChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  message?: string;
}

/**
 * 调用阿里百炼在线模型并返回生成的文本。
 */
export async function chatWithBailian(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = (
    process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
  const model = process.env.DASHSCOPE_MODEL ?? "qwen3.7-plus";
  // 关键知识点：在线模型的Key只能从后端环境变量读取，不能发给浏览器。
  if (!apiKey) {
    throw new Error("未配置阿里百炼DASHSCOPE_API_KEY");
  }
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // 本机使用的OpenCode Go服务要求携带会话标识，百炼会忽略这个头。
        "x-opencode-session": "campus-ai-assistant",
      },
      body: JSON.stringify({
        model,
        // 关键知识点：百炼兼容OpenAI的role和content消息格式。
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream: false,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("阿里百炼响应超时", { cause: error });
    }
    throw new Error("无法连接阿里百炼，请检查网络", { cause: error });
  }

  const result = (await response.json()) as BailianChatResponse;
  if (!response.ok) {
    throw new Error(
      result.error?.message ?? result.message ?? `阿里百炼请求失败：${response.status}`,
    );
  }
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("阿里百炼没有返回有效内容");
  }
  return content;
}

// 方案二：OpenAI SDK实现。本实验当前通过llm.ts调用此函数。
/**
 * 通过OpenAI兼容SDK调用阿里百炼，并返回模型生成的文本。
 */
export async function chatWithBailianOpenAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseURL =
    process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = process.env.DASHSCOPE_MODEL ?? "glm-5.1";

  // 关键知识点1：真实Key只能从后端.env读取，不能硬编码或发送到前端。
  if (!apiKey) {
    throw new Error("未配置阿里百炼DASHSCOPE_API_KEY");
  }

  // 关键知识点2：百炼兼容OpenAI协议，只需替换Key、Base URL和模型名称。
  const client = new OpenAI({
    apiKey,
    baseURL,
    timeout: 120_000,
    // 本机使用的OpenCode Go服务要求携带会话标识，百炼会忽略这个头。
    defaultHeaders: { "x-opencode-session": "campus-ai-assistant" },
  });

  try {
    const completion = await client.chat.completions.create({
      model,
      // 关键知识点3：传入全部messages，模型才能理解本轮对话的上下文。
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: false,
      temperature: 0.7,
    });

    // 关键知识点4：OpenAI兼容响应的正文位于choices[0].message.content。
    const content = completion.choices[0]?.message.content?.trim();

    if (!content) {
      throw new Error("阿里百炼没有返回有效内容");
    }

    return content;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    throw new Error(`阿里百炼调用失败：${message}`, { cause: error });
  }
}
