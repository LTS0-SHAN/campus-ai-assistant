import type { ChatMessage } from "@campus-ai/shared-types";

import { chatWithBailianOpenAI } from "./bailian.js";
import { chatWithOllama } from "./ollama.js";

/**
 * 大模型统一入口：路由不需要关心当前使用本地模型还是在线模型。
 */
export async function chatWithConfiguredModel(messages: ChatMessage[]): Promise<string> {
  const provider = (process.env.LLM_PROVIDER ?? "ollama").toLowerCase();

  if (provider === "ollama") {
    return chatWithOllama(messages);
  }

  if (provider === "bailian") {
    return chatWithBailianOpenAI(messages);
  }

  throw new Error("LLM_PROVIDER只能填写ollama或bailian");
}
