<script setup lang="ts">
import type { ChatMessage } from "@campus-ai/shared-types";

defineProps<{
  message: ChatMessage;
}>();

// 角色名称映射：把角色翻译成页面上显示的中文。
const roleName: Record<ChatMessage["role"], string> = {
  user: "用户",
  assistant: "助手",
  system: "系统",
};
</script>

<template>
  <div class="chat-message">
    <strong>{{ roleName[message.role] }}</strong>
    <p>{{ message.content }}</p>
  </div>
</template>

<style scoped>
.chat-message {
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f4f7fb;
}

.chat-message p {
  margin: 4px 0 0;
}
</style>
