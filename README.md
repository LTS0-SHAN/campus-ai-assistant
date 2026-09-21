# 校园AI问答助手 —— 第1讲项目骨架

对应《AI大前端项目开发》第1讲讲义第三部分。当前后端接口为 mock 占位数据，
第2讲将替换为真实大模型API调用。

## 知识点 → 文件对照

| 知识点 | 位置 |
|---|---|
| pnpm / workspace / Monorepo | `pnpm-workspace.yaml`、`package.json`（根） |
| shared-types 共享类型 | `packages/shared-types/src/index.ts` |
| ESLint | `.eslintrc.cjs` |
| Prettier | `.prettierrc` |
| Husky（Git Hooks） | `.husky/pre-commit`、`.husky/commit-msg` |
| commitlint | `commitlint.config.js` |
| Express + mock接口 | `apps/server/src/routes/chat.ts` |
| Vue3 组件类型化 | `apps/web/src/components/ChatMessageItem.vue` |
| Pinia 状态管理 | `apps/web/src/stores/chat.ts` |
| tsconfig 继承 | `tsconfig.base.json` → 各子包 `tsconfig.json` |

## 快速开始

```bash
pnpm install
cp .env.example apps/server/.env
pnpm dev:server   # 终端1：http://localhost:3000
pnpm dev:web      # 终端2：http://localhost:5173
pnpm typecheck    # 校验前后端类型
```

## 提交规范

```bash
git add .
git commit -m "feat: 初始化项目骨架"   # 需符合 Conventional Commits，否则被 commitlint 拦截
```
