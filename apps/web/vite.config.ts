import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: { "/api": "http://localhost:3000" }, // 转发到后端，绕开浏览器跨域限制
  },
});
