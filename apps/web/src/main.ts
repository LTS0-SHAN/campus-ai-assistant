import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";

const app = createApp(App);

// 这里只注册 Pinia，聊天状态由学生实现。
app.use(createPinia());

app.mount("#app");
