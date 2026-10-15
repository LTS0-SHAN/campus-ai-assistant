import type { ApiResponse, ChatMessage, ChatStreamEvent } from "@campus-ai/shared-types";
import { once } from "node:events";
import { Router } from "express";

import { buildChatMessages } from "../prompts/build-messages.js";
import { streamConfiguredModel } from "../services/llm-stream.js";

export const chatStreamRouter = Router();

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "content" in value &&
    typeof value.content === "string" &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant")
  );
}

function encodeEvent(event: ChatStreamEvent): string {
  // 固定协议：单行 data + JSON + 两个换行。
  return `data: ${JSON.stringify(event)}\n\n`;
}

chatStreamRouter.post("/api/chat/stream", async (request, response) => {
  const body: unknown = request.body;
  const messages: unknown =
    body && typeof body === "object" && "messages" in body ? body.messages : undefined;

  if (
    !Array.isArray(messages) ||
    !messages.every(isChatMessage) ||
    messages.at(-1)?.role !== "user" ||
    !messages.at(-1)?.content.trim()
  ) {
    const result: ApiResponse<null> = { code: 1, message: "请提交有效的聊天消息", data: null };
    response.status(400).json(result);
    return;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 300_000);

  // 浏览器提前断开时，取消后端到模型的请求。
  const onClose = () => {
    if (!response.writableEnded) controller.abort();
  };
  response.on("close", onClose);

  try {
    const modelMessages = buildChatMessages(messages);

    for await (const event of streamConfiguredModel(modelMessages, controller.signal)) {
      controller.signal.throwIfAborted();

      // 等收到第一条事件再提交响应头，之前仍可返回 HTTP 错误。
      if (!response.headersSent) {
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
      }

      if (event.type === "done") {
        response.end(encodeEvent(event));
        return;
      }

      // 写缓冲区满时等待 drain；断开或超时也能解除等待。
      if (!response.write(encodeEvent(event))) {
        await once(response, "drain", { signal: controller.signal });
      }
    }

    throw new Error("模型没有发送结束事件");
  } catch (error: unknown) {
    if (response.destroyed || response.writableEnded) return;

    const message = timedOut
      ? "模型响应超时，请稍后重试"
      : error instanceof Error
        ? error.message
        : "模型服务异常";

    if (response.headersSent) {
      response.end(encodeEvent({ type: "error", message }));
    } else {
      const result: ApiResponse<null> = { code: 1, message, data: null };
      response.status(timedOut ? 504 : 502).json(result);
    }
  } finally {
    clearTimeout(timer);
    response.off("close", onClose);
    controller.abort();
  }
});
