import "dotenv/config"; // 把.env文件里的键值对读进process.env。

import type { ChatMessage, ChatRequest, ChatResponse } from "@campus-ai/shared-types";
import express from "express";

import { chatWithConfiguredModel } from "./services/llm.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

// 解析JSON请求体，限制大小可以避免客户端提交过多数据。
app.use(express.json({ limit: "1mb" }));

// 健康检查用于确认Express和Vite代理已经连通。
app.get("/api/health", (_request, response) => {
  response.json({ message: "server is ready" });
});

/** TypeScript类型不能验证外部JSON，因此路由仍需做运行时检查。 */
function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "system" || message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

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

app.post("/api/chat", async (request, response) => {
  const requestBody = request.body as Partial<ChatRequest>;
  if (!Array.isArray(requestBody.messages) || !requestBody.messages.every(isChatMessage)) {
    response.status(400).json(createErrorResponse("消息格式不正确"));
    return;
  }

  const messages = requestBody.messages;
  const latestMessage = messages.at(-1);
  const userQuestion =
    latestMessage?.role === "user" && typeof latestMessage.content === "string"
      ? latestMessage.content.trim()
      : "";

  if (!userQuestion) {
    response.status(400).json(createErrorResponse("请输入问题后再发送。"));
    return;
  }

  try {
    // Express只负责HTTP，具体调用哪个模型由services/llm.ts决定。
    const assistantContent = await chatWithConfiguredModel(messages);

    const successResponse: ChatResponse = {
      code: 0,
      message: "ok",
      data: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
      },
    };

    response.json(successResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "大模型服务异常";

    // 502表示Express正常，但它调用的上游模型服务失败。
    response.status(502).json(createErrorResponse(errorMessage));
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
