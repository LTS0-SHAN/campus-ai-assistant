/** 学生任务：在这里定义前后端共享的 TypeScript 类型。 */
/**
 * 聊天消息角色。
 *
 * system：系统提示词或AI角色设定
 * user：用户消息
 * assistant：AI回复
 */
export type Role = "system" | "user" | "assistant";

/**
 * 项目中统一使用的聊天消息结构。interface 是定义“对象长什么样”的契约（合同）。
 * 它规定对象必须有哪些属性、属性的类型是什么，以及哪些属性是可选的。
 */
export interface ChatMessage {
  /** 消息唯一编号 */
  id: string;
  /** 消息发送者 */
  role: Role;
  /** 消息文本内容 */
  content: string;
}

/**
 * 前后端统一的JSON响应结构。
 *
 * T由具体接口决定，例如：
 * ApiResponse<ChatMessage>
 * ApiResponse<ChatMessage[]>
 */
export interface ApiResponse<T> {
  /** 业务状态码，0表示成功 */
  code: number;

  /** 状态说明 */
  message: string;

  /** 接口返回的具体业务数据 */
  data: T;
}

/**
 * 前端发送给后端的聊天请求。
 */
export interface ChatRequest {
  messages: ChatMessage[];
}

/**
 * 后端返回给前端的聊天响应。
 */
export type ChatResponse = ApiResponse<ChatMessage>;

/**
 * 创建新消息时，id由程序生成，因此调用者不需要提供id。
 */
export type NewChatMessage = Omit<ChatMessage, "id">;

/**
 * 修改消息时，目前只允许修改content。
 * Partial表示content可以不提供。
 */
export type UpdateChatMessage = Partial<Pick<ChatMessage, "content">>;
