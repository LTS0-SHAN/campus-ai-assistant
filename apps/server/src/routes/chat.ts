import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { ApiResponse, ChatMessage } from "@campus-ai/shared-types";

const router = Router();

// mock接口：先返回占位数据，验证前后端类型链路能跑通
// 第2讲会把这里替换成真正的大模型API调用
router.post("/api/chat", (req, res) => {
  const reply: ChatMessage = {
    id: randomUUID(),
    role: "assistant",
    content: "你好，我是校园AI问答助手（占位回复）",
    createdAt: new Date().toISOString(),
  };
  const body: ApiResponse<ChatMessage> = { code: 0, message: "ok", data: reply };
  res.json(body);
});

export default router;
