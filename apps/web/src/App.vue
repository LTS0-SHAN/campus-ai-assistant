<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import MessageItem from "./components/MessageItem.vue";
import { useChatStore } from "./stores/chat";

const chatStore = useChatStore();
const input = ref("");
const messageList = ref<HTMLElement | null>(null);

async function submit() {
  const content = input.value.trim();

  if (!content || chatStore.isSending) {
    return;
  }

  input.value = "";
  await chatStore.sendMessage(content);
}

// 消息增加后，自动滚动到最新消息。
watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();

    const element = messageList.value;
    element?.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  },
);
</script>

<template>
  <main class="page">
    <!-- 春日签名元素：轻轻飘落的樱花瓣。 -->
    <span v-for="n in 5" :key="n" class="petal" aria-hidden="true"></span>

    <section class="chat">
      <header>
        <div>
          <h1>校园 AI 助手</h1>
          <p>春风有信，一问即答</p>
        </div>
        <span>春日</span>
      </header>

      <div ref="messageList" class="messages">
        <p v-if="chatStore.messages.length === 0" class="welcome">
          你好呀，我是校园 AI 助手。春风正好，想问我什么？
        </p>

        <MessageItem v-for="message in chatStore.messages" :key="message.id" :message="message" />

        <p v-if="chatStore.isSending" class="status">校园 AI 助手正在回复……</p>
      </div>

      <p v-if="chatStore.errorMessage" class="error">
        {{ chatStore.errorMessage }}
      </p>

      <form class="composer" @submit.prevent="submit">
        <input
          v-model="input"
          type="text"
          maxlength="1000"
          autocomplete="off"
          placeholder="请输入问题"
          aria-label="聊天内容"
        />

        <button type="submit" :disabled="chatStore.isSending || !input.trim()">
          {{ chatStore.isSending ? "发送中" : "发送" }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

/* 春日色调：晨雾绿为底，点缀新芽绿与樱花粉。 */
.page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 18%, rgb(223 182 176 / 38%), transparent 40%),
    radial-gradient(circle at 88% 82%, rgb(183 210 180 / 48%), transparent 42%),
    linear-gradient(160deg, #f4f9f0 0%, #eaf3e6 55%, #fdf7f2 100%);
}

/* 飘落的樱花花瓣，点到为止。 */
.petal {
  position: fixed;
  top: -6vh;
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, #f4d3c7, #e8b9ad);
  border-radius: 100% 0 100% 0;
  opacity: 0.55;
  pointer-events: none;
  animation: fall linear infinite;
}

.petal:nth-child(1) {
  left: 12%;
  animation-duration: 18s;
}

.petal:nth-child(2) {
  left: 32%;
  width: 11px;
  height: 11px;
  animation-duration: 24s;
  animation-delay: 4s;
}

.petal:nth-child(3) {
  left: 58%;
  width: 18px;
  height: 18px;
  animation-duration: 20s;
  animation-delay: 8s;
}

.petal:nth-child(4) {
  left: 78%;
  width: 12px;
  height: 12px;
  animation-duration: 22s;
  animation-delay: 2s;
}

.petal:nth-child(5) {
  left: 90%;
  animation-duration: 26s;
  animation-delay: 10s;
}

@keyframes fall {
  0% {
    transform: translateY(-6vh) rotate(0deg);
  }
  100% {
    transform: translateY(112vh) rotate(360deg);
  }
}

.chat {
  width: min(880px, 100%);
  height: min(760px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(109 155 127 / 18%);
  border-radius: 26px;
  background: #fdfcf9;
  box-shadow:
    0 24px 70px rgb(86 122 96 / 16%),
    0 2px 8px rgb(86 122 96 / 6%);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px;
  color: #3e5148;
  background: linear-gradient(120deg, #ddebd6 0%, #cde0c4 55%, #f6e4dd 120%);
  border-bottom: 1px solid rgb(109 155 127 / 15%);
}

header h1,
header p {
  margin: 0;
}

/* 标题用宋体，营造春日的雅致感。 */
header h1 {
  font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

header p {
  margin-top: 6px;
  color: #5b735f;
  font-size: 13px;
}

header span {
  padding: 5px 12px;
  border-radius: 20px;
  background: rgb(255 255 255 / 55%);
  color: #6d9b7f;
  font-size: 12px;
}

/* 只让消息区滚动，输入区始终保留在底部。 */
.messages {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 24px;
}

.welcome,
.status {
  margin: auto;
  color: #7a8a7d;
  text-align: center;
}

.status {
  margin: 0;
}

.error {
  margin: 0;
  padding: 8px 24px;
  color: #b3544b;
  background: #fdeeee;
}

.composer {
  display: flex;
  gap: 12px;
  padding: 18px 24px;
  border-top: 1px solid #e3ede0;
  background: #ffffff;
}

.composer input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid #cfe0cc;
  border-radius: 14px;
  outline: none;
  background: #fbfdf8;
  color: #3e5148;
}

.composer input:focus {
  border-color: #6d9b7f;
  box-shadow: 0 0 0 3px rgb(109 155 127 / 14%);
}

.composer button {
  padding: 0 22px;
  border: 0;
  border-radius: 14px;
  color: #ffffff;
  background: linear-gradient(135deg, #7fa98a, #5e8b6d);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.composer button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(94 139 109 / 30%);
}

.composer button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .petal {
    display: none;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 0;
  }

  .chat {
    height: 100vh;
    border-radius: 0;
  }
}
</style>
