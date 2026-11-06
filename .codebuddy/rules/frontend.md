---
enabled: true
alwaysApply: false
paths:
  - packages/frontend/**/*.{ts,tsx,css}
  - src/app/**/*.{ts,tsx}
  - src/components/**/*.{ts,tsx}
  - src/lib/**/*.{ts,tsx}
  - tests/e2e/**/*.ts
---

# 前端项目规则（packages/frontend）

仅适用于 `packages/frontend/`。与根 `AGENTS.md`、`.github/CONTRIBUTING.md`、
根 `CODEBUDDY.md` 一起阅读；冲突时以 `AGENTS.md` 为准。
本规则为条件规则：CLI 下需操作匹配文件才加载，IDE 中可用 `@frontend` 手动引用。

## 必读与技术边界

- 动手前读 `packages/frontend/AGENTS.md`：Next.js 16 有破坏性变更，必须先查
  `node_modules/next/dist/docs/` 对应指南并留意弃用提示。该文件由 `next dev`
  自动生成，不要删除或改写规则块，也不要把它夹带进聚焦型 PR。
- 技术栈固定：Next.js 16 App Router、React 19、TypeScript（`strict: true`、
  路径别名 `@/* -> src/*`）、Tailwind CSS 4、Radix、`@sentry/nextjs`。
- 项目**没有**：`tailwind.config.*`、zod、SWR / React Query、i18n 框架、
  单元测试与 `test` 脚本、`sitemap.ts` / `robots.ts`。不要假设它们存在；
  新增前端依赖先讨论。
- `next.config.ts` 的 `output: 'standalone'` 让 `next start` 无法用于本地验证，
  E2E 用 `next dev`。`/api/*`、`/mcp`、`/health`、`/auth/*` 等由 `rewrites()`
  代理到 `BACKEND_INTERNAL_URL`（默认 `http://localhost:4000`）。
- `content/guides/` 的 MDX 不属于本前端，不要在这里加消费代码。

## 目录与文件放置

- `src/app/`：扁平 App Router 路由，无 `(group)` 分组；动态段如 `connectors/[id]/`。
  `page.tsx` / `layout.tsx` / `error.tsx` / `not-found.tsx` 用 `export default`。
- `src/components/`：扁平 `*.tsx`，仅 `ui/` 与 `tool-editor/` 两个子目录。
  组件统一**命名导出**（`export function` / `export const`），`forwardRef` 组件配
  `displayName`；不要写 `export default`。
- `src/lib/`：请求客户端 `api.ts`、鉴权 `auth-context.tsx`、主题 `theme-context.tsx`、
  hook `use-*.ts`、工具 `utils.ts` / `origin.ts` / `network-error.ts`。
  新 hook 沿用 `use-xxx.ts` 命名，不要新建 `hooks/` 目录。
- 接口类型就近定义：`api.ts` 内集中写 `interface/type`，组件特有类型放组件文件内；
  不新建 `types.ts`。
- `public/logos/connectors/` 放连接器 logo；`tests/e2e/` 放 Playwright spec。

## 组件与状态

- 现状：34 个页面中 33 个是 `'use client'`；token 存于 `localStorage`，页面用
  `useEffect` + `useState` 调 `api.*`。新增页面沿用这一模式，不要在不改鉴权方案的前提下
  把现有页面机械改造成服务端组件。
- `CONTRIBUTING.md` 的「优先服务端组件」是方向性偏好：仅 `layout.tsx`、
  `not-found.tsx`、只导出 `metadata` 的小 layout 等无交互文件保持服务端组件。
- `providers.tsx` 层级为 `ThemeProvider > AuthProvider > ToastProvider >
  OnboardingRedirect`；全局能力加到 `Providers`，不要在每个页面重复挂载。
- 错误边界沿用 `error.tsx`（段级）与 `global-error.tsx`（根级）；网络错误走
  `lib/network-error.ts` 的 `isNetworkError` / `reloadWhenOnline`。

## API 与鉴权

- 所有后端调用走 `src/lib/api.ts` 中按领域分组的对象（`auth`、`connectors`、
  `organizations`、`server` 等）；新增接口在对应命名空间扩展，类型写在同文件。
- `API_BASE = process.env.NEXT_PUBLIC_API_URL || ''`，默认同源相对路径，靠 rewrite
  转发。**不要**在页面里硬编码 `http://localhost:4000`；确实需要绝对地址
  （展示/复制 MCP URL）时用 `lib/origin.ts` 的 `getApiOrigin()`。
- 失败抛 `ApiError(message, status, body)`；401 会派发 `AUTH_EXPIRED_EVENT`，
  `auth-context.tsx` 监听后登出。仅当 401 是预期结果（如自删账号校验密码）才用
  `skipAutoLogout`，并自行处理错误。
- 用 `useAuth()` 取 `token` / `user` / `orgs` / `deploymentMode` 等；切换组织后
  组织范围内的数据必须重新拉取，不要在前端缓存跨组织数据。
- `useEdition()` 的 `edition` 在 Cloud、加载中、未登录时为 `null`，必须判空；
  许可变更后调 `notifyEditionChanged()` 触发刷新。功能要同时说明 Cloud 与自托管下的
  表现；文档不含 Cloud 运维操作。
- 错误提示统一用 `useToast().show({ title, description, tone: 'success'|'error'|'info' })`。

## 样式

- Tailwind 4 由 `src/app/globals.css` 的 `@import "tailwindcss"` 引入，无 config；
  主题令牌是 `:root` / `.dark` 下的 CSS 变量（`--bg`、`--surface`、`--brand`、
  `--text-2`、`--danger` …），颜色写成 `bg-[var(--brand)]` 这类任意值，不要新建配色。
- 暗色模式是 `<html>` 上的 `.dark` class（`@custom-variant dark`）；切换用
  `lib/theme-context.tsx` 的 `useTheme` / `setTheme`，不要自行写媒体查询覆盖。
- 类名合并一律用 `@/lib/utils` 的 `cn()`；基础组件变体用 `cva`（见
  `components/ui/button.tsx` 的 `buttonVariants`）；不要直接用 `clsx` / `twMerge`。
- 优先复用 `components/ui/` 的基础组件与 `AppShell`，不要复制一份。

## 安全红线

- `NEXT_PUBLIC_*` 会进入浏览器产物：`JWT_SECRET`、`ENCRYPTION_KEY`、连接器凭据等
  密钥绝不能出现在前端代码、环境变量默认值或日志里；会话只沿用既有 `amcp_token` 约定。
- 不把用户可控内容塞进 `dangerouslySetInnerHTML`；依赖 React 自动转义，富文本需
  经可信 sanitizer 处理后再渲染。
- 重定向目标（如 `/login?redirect=`）只允许站内路径或固定白名单，禁止接受任意
  外部 URL；不回显任意 `Origin`。
- 表单前端做基本校验，但以后端 DTO + `class-validator` 为准，不信任前端校验结果；
  错误用通用文案提示，不向用户暴露堆栈或密钥。
- 不记录 token / 凭据 / 个人信息；不新增会放宽 CSP、关闭沙箱或把
  `allowedDevOrigins` 放开到任意来源的配置。

## 检查与测试

在 `packages/frontend` 下执行：

```bash
npm run lint
npx tsc --noEmit -p tsconfig.json
npx playwright install --with-deps chromium
npm run test:e2e
```

- 根目录 `npm test` 会失败（前端无 `test` 脚本）；不要补占位脚本来绕过。
- E2E 只做 UI 冒烟：用 `page.route(/\/api\//, ...)` mock 接口，
  `page.addInitScript` 写 `localStorage.amcp_token` / `amcp_user` 或
  `page.context().addCookies` 注入 `amcp_token`，不依赖运行中的后端。
  断言用 `getByRole` / `getByText` / `toBeVisible` 等可访问性定位。
- Playwright 自己启动 `next dev --port 3100`；跑 E2E 前先停掉常规开发服务器，
  避免 `.next` 目录锁冲突。
- `next dev` 会重新生成 `packages/frontend/AGENTS.md` / `CLAUDE.md` 并更新
  `next-env.d.ts`，聚焦型 PR 不要夹带这些附带改动。
- 基线失败与新增回归分开记录；失败的运行不能报成通过。
