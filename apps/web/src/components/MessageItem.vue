<script setup lang="ts">
import type { ChatMessage } from "@campus-ai/shared-types";

defineProps<{
  message: ChatMessage;
}>();

const roleNames: Record<ChatMessage["role"], string> = {
  system: "系统",
  user: "我",
  assistant: "校园 AI 助手",
};
</script>

<template>
  <article :class="['message', message.role]">
    <span class="role">{{ roleNames[message.role] }}</span>

    <!--
      关键知识点：使用文本插值会自动转义HTML，
      不使用v-html，避免不可信内容造成XSS。
    -->
    <p class="bubble">{{ message.content }}</p>
  </article>
</template>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  max-width: 78%;
}

.role {
  margin-bottom: 4px;
  font-size: 12px;
  color: #8aa08f;
}

/* 用户靠右，助手靠左，形成对话气泡。 */
.message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.message.user .bubble {
  color: #ffffff;
  background: linear-gradient(135deg, #7fa98a, #5e8b6d);
  border: none;
  border-bottom-right-radius: 6px;
}

.message.assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.message.assistant .bubble {
  border-bottom-left-radius: 6px;
}

.message.system {
  align-self: center;
  align-items: center;
}

.message.system .bubble {
  padding: 0;
  color: #8aa08f;
  background: transparent;
  border: none;
  box-shadow: none;
}

.bubble {
  margin: 0;
  padding: 10px 16px;
  border: 1px solid #e3ede0;
  border-radius: 18px;
  color: #3e5148;
  background: #ffffff;
  box-shadow: 0 2px 6px rgb(86 122 96 / 6%);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .message {
    max-width: 88%;
  }
}
</style>
