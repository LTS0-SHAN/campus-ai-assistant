<script setup lang="ts">
import type { ChatMessage } from "@campus-ai/shared-types";
import { computed } from "vue";

const props = defineProps<{ message: ChatMessage }>();

const roleNames: Record<ChatMessage["role"], string> = {
  system: "系统",
  user: "我",
  assistant: "校园 AI 助手",
};

const downloadPaths = new Set([
  "/download/anquan-zherenshu.docx",
  "/download/fensanshixi-shenqingbiao.docx",
  "/download/shixi-baogao.docx",
  "/download/xuanti-laiyuanbiao.doc",
]);

// 只把白名单里的下载路径渲染成链接，其余内容仍然按纯文本显示。
const parts = computed(() =>
  props.message.content.split(/(\[[^\]]+\]\(\/download\/[^)]+\))/g).map((text) => {
    const match = /^\[([^\]]+)\]\((\/download\/[^)]+)\)$/.exec(text);
    const label = match?.[1];
    const href = match?.[2];
    return label && href && downloadPaths.has(href) ? { text: label, href } : { text, href: "" };
  }),
);
</script>

<template>
  <article :class="['message', message.role]">
    <span class="role">{{ roleNames[message.role] }}</span>

    <p v-if="message.content" class="bubble">
      <template v-for="(part, index) in parts" :key="index">
        <a v-if="part.href" :href="part.href" download class="download-card">{{ part.text }}</a>
        <span v-else>{{ part.text }}</span>
      </template>
    </p>
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

/* 单条消息不参与伸缩，气泡长内容换行不溢出。 */
.message {
  flex-shrink: 0;
}

.bubble {
  overflow-wrap: anywhere;
}

.download-card {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #cfe0cc;
  border-radius: 10px;
  color: #4c7a5c;
  background: #f4f9f0;
  text-decoration: none;
}
</style>
