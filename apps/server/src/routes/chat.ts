import { Router } from "express";
import type { ChatRequest, ChatResponse } from "@campus-ai/shared-types";
import { chatWithConfiguredModel } from "../services/llm.js";
import { buildChatMessages } from "../prompts/build-messages.js";

const router = Router();

function createErrorResponse(message: string): ChatResponse {
  return {
    code: 1,
    message,
    data: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: message,
    },
  };
}

//3学生任务：在这里实现聊天接口。
router.post("/api/chat", async (request, response) => {
  const body = request.body as Partial<ChatRequest>;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastMessage = messages.at(-1);

  const question =
    lastMessage?.role === "user" && typeof lastMessage.content === "string"
      ? lastMessage.content.trim()
      : undefined;

  if (!question) {
    response.status(400).json(createErrorResponse("请输入问题后再发送"));
    return;
  }
  // 关键知识点：ChatResponse约束后端响应结构。
  try {
    const modelMessages = buildChatMessages(messages);
    const assistantResponse = await chatWithConfiguredModel(modelMessages);
    const successResponse: ChatResponse = {
      code: 0,
      message: "ok",
      data: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantResponse,
      },
    };
    response.json(successResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "大模型服务异常";
    response.status(502).json(createErrorResponse(errorMessage));
  }
});

export default router;
