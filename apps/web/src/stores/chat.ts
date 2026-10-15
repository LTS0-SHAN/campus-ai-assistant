import type { ChatMessage, ChatRequest } from "@campus-ai/shared-types";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";

import { requestChatStream } from "../api/chat-stream";

// notice 只用于界面提示，不发送给模型。
type ViewMessage = ChatMessage & { notice: string };

export const useChatStore = defineStore("chat", () => {
  const messages = ref<ViewMessage[]>([]);
  const isSending = ref(false);
  const errorMessage = ref<string | null>(null);
  const canRetry = ref(false);

  // 页面保留所有消息；模型历史只保留成功完成的对话。
  let completedHistory: ChatMessage[] = [];
  let lastRequest: ChatRequest | null = null;
  let lastReply: ViewMessage | null = null;
  let controller: AbortController | null = null;

  async function generateReply(): Promise<void> {
    if (isSending.value || !lastRequest || !lastReply) return;

    const request = lastRequest;
    const reply = lastReply;
    const requestController = new AbortController();
    controller = requestController;

    isSending.value = true;
    canRetry.value = false;
    errorMessage.value = null;
    reply.content = "";
    reply.notice = "";

    try {
      const finishReason = await requestChatStream(
        request,
        (text) => {
          reply.content += text;
        },
        requestController.signal,
      );

      if (finishReason !== "stop") {
        reply.notice = `生成已结束（${finishReason}），回答可能不完整，可重试。`;
        canRetry.value = true;
        return;
      }

      if (!reply.content.trim()) throw new Error("模型未返回可显示的正文");

      completedHistory = [
        ...request.messages,
        { id: reply.id, role: reply.role, content: reply.content },
      ];
    } catch (error: unknown) {
      if (requestController.signal.aborted) {
        reply.notice = "已停止，回答未完成。";
      } else {
        errorMessage.value =
          error instanceof Error
            ? error.name === "TimeoutError"
              ? "等待超时，请重试"
              : error.message
            : "发送失败，请重试";
        reply.notice = "生成失败，已接收内容可能不完整。";
      }
      canRetry.value = true;
    } finally {
      controller = null;
      isSending.value = false;
    }
  }

  async function sendMessage(content: string): Promise<void> {
    const text = content.trim();
    if (!text || isSending.value) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    messages.value.push({ ...userMessage, notice: "" });

    // 必须先取请求快照，再创建空的助手消息。
    lastRequest = { messages: [...completedHistory, userMessage] };

    // reactive 确保通过 reply.content 追加时，Vue 能更新界面。
    lastReply = reactive<ViewMessage>({
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      notice: "",
    });
    messages.value.push(lastReply);

    await generateReply();
  }

  function stopGenerating(): void {
    // 不在这里解锁；等待请求退出后由 finally 统一恢复状态。
    controller?.abort();
  }

  return {
    messages,
    isSending,
    errorMessage,
    canRetry,
    sendMessage,
    stopGenerating,
    retryMessage: generateReply,
  };
});
