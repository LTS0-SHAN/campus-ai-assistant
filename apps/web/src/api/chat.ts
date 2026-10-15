import type { ChatRequest, ChatResponse } from "@campus-ai/shared-types";

export async function requestChat(data: ChatRequest): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = (await response.json()) as ChatResponse;

  if (!response.ok || result.code !== 0) {
    throw new Error(result.message);
  }
  return result;
}
