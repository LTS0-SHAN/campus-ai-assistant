<script setup lang="ts">
import type { ChatMessage } from "@campus-ai/shared-types";
defineProps<{ message: ChatMessage }>();
</script>

<template>
  <div :class="['msg', message.role]">{{ message.content }}</div>
</template>

<style scoped>
.msg {
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 8px;
}
.user {
  background: #dbeafe;
  text-align: right;
}
.assistant {
  background: #eff6ff;
}
</style>
