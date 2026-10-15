import type { ChatMessage, NewChatMessage } from "@campus-ai/shared-types";
import { defineStore } from "pinia";
import { ref } from "vue";

import { requestChat } from "../api/chat";

function createMessage(message: NewChatMessage): ChatMessage {
  return {
    id: crypto.randomUUID(),
    ...message,
  };
}

export const useChatStore = defineStore("chat", () => {
  // 关键知识点1：Store中的响应式状态只定义一次。
  const messages = ref<ChatMessage[]>([]);
  const isSending = ref(false);
  const errorMessage = ref<string | null>(null);

  async function sendMessage(content: string): Promise<void> {
    const text = content.trim();
    // 关键知识点2：阻止空消息和重复提交。
    if (!text || isSending.value) {
      return;
    }

    const userMessage = createMessage({
      role: "user",
      content: text,
    });
    messages.value.push(userMessage);
    isSending.value = true;
    errorMessage.value = null;
    try {
      // 关键知识点3：发送聊天记录快照，为以后多轮对话保留结构。
      const result = await requestChat({
        messages: [...messages.value],
      });
      messages.value.push(result.data);
    } catch (error: unknown) {
      // 关键知识点4：unknown经过类型守卫后才能安全读取message。
      errorMessage.value = error instanceof Error ? error.message : "发送失败，请稍后重试";
    } finally {
      // 无论成功或失败，都必须恢复发送状态。
      isSending.value = false;
    }
  }
  // 关键知识点5：只有返回的内容才能被Vue组件使用。
  return {
    messages,
    isSending,
    errorMessage,
    sendMessage,
  };
});
