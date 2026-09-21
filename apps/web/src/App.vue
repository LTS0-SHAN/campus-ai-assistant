<script setup lang="ts">
import { ref } from "vue";
import { useChatStore } from "./stores/chat";
import ChatMessageItem from "./components/ChatMessageItem.vue";

const chat = useChatStore();
const input = ref("");

function send() {
  if (!input.value.trim()) return;
  chat.sendMessage(input.value);
  input.value = "";
}
</script>

<template>
  <div style="max-width: 600px; margin: 40px auto; font-family: sans-serif">
    <h2>校园AI问答助手</h2>
    <ChatMessageItem v-for="m in chat.messages" :key="m.id" :message="m" />
    <input v-model="input" @keyup.enter="send" placeholder="输入问题..." style="width: 80%" />
    <button @click="send">发送</button>
  </div>
</template>
