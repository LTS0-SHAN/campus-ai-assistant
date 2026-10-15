<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import MessageItem from "./components/MessageItem.vue";
import { useChatStore } from "./stores/chat";

const chatStore = useChatStore();
const inputText = ref("");
const messageArea = ref<HTMLElement | null>(null);

async function submitMessage() {
  const content = inputText.value.trim();

  if (!content || chatStore.isSending) {
    return;
  }

  inputText.value = "";
  await chatStore.sendMessage(content);
}

// 消息增加后，只让消息区域滚动到底部，输入框始终留在页面上。
watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();

    const element = messageArea.value;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  },
);
</script>

<template>
  <div class="chat">
    <header>
      <h1>校园AI助手</h1>
    </header>

    <section ref="messageArea" class="message">
      <MessageItem v-for="message in chatStore.messages" :key="message.id" :message="message" />
      <p v-if="chatStore.isSending">正在回复...</p>
    </section>

    <p v-if="chatStore.errorMessage" class="error">
      {{ chatStore.errorMessage }}
    </p>

    <form @submit.prevent="submitMessage">
      <input v-model="inputText" type="text" placeholder="请输入问题" />
      <button type="submit" :disabled="chatStore.isSending">发送</button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  max-width: 640px;
  margin: 32px auto;
  padding: 0 16px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.message {
  min-height: 240px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #dbe4ef;
  border-radius: 8px;
}

.error {
  color: #c0392b;
}

form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

form input {
  flex: 1;
  padding: 8px 10px;
}

form button {
  padding: 8px 18px;
}
</style>
