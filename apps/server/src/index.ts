import express from "express";
import type { ChatRequest, ChatResponse } from "@campus-ai/shared-types";

const app = express();
const port = Number(process.env.PORT ?? 3000);

//1解析JSON请求体,设置大小上限可避免客户端提交过大的数据
app.use(express.json({ limit: "1mb" }));

//2健康检查用于确认后端和Vite代理已经连通。
app.get("/api/health", (_request, response) => {
  response.json({ message: "server is ready" });
});

//3学生任务：在这里实现聊天接口。
app.post("/api/chat", (request, response) => {
  const body = request.body as Partial<ChatRequest>;
  const lastMessage = Array.isArray(body.messages)
    ? body.messages[body.messages.length - 1]
    : undefined;

  const question =
    lastMessage?.role === "user" && typeof lastMessage.content === "string"
      ? lastMessage.content.trim()
      : undefined;

  if (!question) {
    const result: ChatResponse = {
      code: 1,
      message: "question is empty",
      data: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "请输入问题后再发送",
      },
    };
    response.status(400).json(result);
    return;
  }
  // 关键知识点：ChatResponse约束后端响应结构。
  const result: ChatResponse = {
    code: 0,
    message: "ok",
    data: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `我收到了你的问题：“${question}”。这是后端返回的模拟回复。`,
    },
  };
  response.json(result);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
