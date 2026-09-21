import { defineStore } from "pinia";
import type { ChatMessage, ApiResponse } from "@campus-ai/shared-types";

interface ChatState {
  messages: ChatMessage[];
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({ messages: [] }),
  actions: {
    async sendMessage(content: string) {
      this.messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json: ApiResponse<ChatMessage> = await res.json();
      this.messages.push(json.data);
    },
  },
});
