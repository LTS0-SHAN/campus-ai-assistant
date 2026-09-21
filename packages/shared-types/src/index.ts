// 前后端共享类型：一处定义，全栈复用

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

// 统一接口响应封装（泛型）
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
