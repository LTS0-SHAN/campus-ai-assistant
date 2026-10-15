import type { ChatRequest } from "@campus-ai/shared-types";

export async function requestChatStream(
  request: ChatRequest,
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.any([signal, AbortSignal.timeout(310_000)]),
  });

  if (!response.ok) {
    const error: unknown = await response.json().catch(() => null);
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : `请求失败：HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!response.body || !response.headers.get("Content-Type")?.includes("text/event-stream")) {
    await response.body?.cancel();
    throw new Error("服务器没有返回有效的事件流");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let boundary: number;
      // 一次 read 可能不足一条事件，也可能包含多条事件。
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (!frame.startsWith("data: ")) throw new Error("事件格式错误");

        const event: unknown = JSON.parse(frame.slice(6));
        if (!event || typeof event !== "object" || !("type" in event)) {
          throw new Error("事件数据错误");
        }

        signal.throwIfAborted();

        if (event.type === "delta" && "text" in event && typeof event.text === "string") {
          onDelta(event.text);
        } else if (
          event.type === "done" &&
          "finishReason" in event &&
          typeof event.finishReason === "string"
        ) {
          return event.finishReason;
        } else if (
          event.type === "error" &&
          "message" in event &&
          typeof event.message === "string"
        ) {
          throw new Error(event.message);
        } else {
          throw new Error("收到未知的流式事件");
        }
      }

      if (done) throw new Error("连接已中断，未收到回答结束标志");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
