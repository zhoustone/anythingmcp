# AnythingMCP — CodeBuddy 项目上下文

由 `/init` 生成，是供 AI 编码助手快速查阅的索引文件。本文件使用简体中文；
命令、路径、文件名与代码标识符保持英文原文。
权威规则见 [AGENTS.md](AGENTS.md) 和
[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) —— 改动代码前请先阅读两者。
若本文件与 `AGENTS.md` 冲突，以 `AGENTS.md` 为准。进入子目录时还需遵循该目录内的
`AGENTS.md`。

## 项目是什么

自托管的 MCP 网关：无需自己编写 MCP server，即可把 REST/OpenAPI、SOAP/WSDL、
GraphQL、OData 和 SQL 后端转换为供 AI 客户端调用的 MCP 工具。
使用 TypeScript，以 npm workspaces 单仓库（monorepo）组织。除 `ee/` 目录
（适用 AnythingMCP 商业许可证）外，全部代码为 AGPL-3.0-only，详见
[LICENSING.md](LICENSING.md)。

术语要分清：**adapter（适配器）** 是目录中的 JSON 模板；**connector（连接器）**
是根据模板配置出来的实例；**MCP server** 是 AI 客户端连接的端点，只暴露分配给它的
连接器。

## 技术栈

| | |
|---|---|
| 运行环境 | Node.js >= 20.19.0、npm >= 9、Docker + Compose、PostgreSQL |
| 后端 | NestJS 11、Prisma 7、Jest 30、Pino，端口 4000 |
| 前端 | Next.js 16 App Router、React 19、Tailwind CSS 4，端口 3000 |
| 端到端测试 | Playwright / Chromium，自行启动 `next dev`，端口 3100 |

关键端点：MCP `/mcp`、Swagger `/api/docs`、健康检查 `/health`。
没有全局 `setGlobalPrefix`；REST 控制器各自硬编码 `@Controller('api/...')`。

## 仓库结构

```
packages/backend/src/
  mcp-server/      MCP 协议运行时（单数）
  mcp-servers/     MCP server 配置、会话与授权（复数）
  connectors/      用户连接器 CRUD、工具、OAuth 回调
  adapters/        catalog + 各地区 <slug>.json 模板
  auth/ organizations/ users/ roles/ identity-providers/
  common/          Prisma、Redis、日志、部署模式、outbound-http、ssrf
  ee/              商业授权代码 —— 绝不在此新增或修改代码
packages/backend/prisma/   schema.prisma、migrations/、rls/
packages/frontend/src/
  app/             App Router 页面与布局
  components/      应用外壳、ui/、tool-editor/
  lib/             api.ts（fetch 客户端）、auth-context、use-edition、use-*.ts
  proxy.ts         /api、/mcp、/auth 等路径的认证网关
scripts/           适配器、目录与 CI 工具（.mjs，从仓库根目录执行）
docs/              产品与运维文档（Markdown）
content/guides/    按语言 en/、de/、it/ 划分的网站 MDX 指南
deploy/            Cloud 发布、systemd 单元、运维脚本
.github/workflows/ ci.yml、playwright.yml、codeql.yml、trivy.yml 等
```

`src/lib/api.ts` 默认使用同源相对路径 `/api/*`，生产环境由代理转发到后端。
Playwright 冒烟测试会 mock API 调用，不需要运行中的后端。

## 常用命令

除特别说明外，均在仓库根目录执行。

```bash
./setup.sh                                  # 交互式：选择 Local development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
npm ci                                      # 安装两个 workspace 的锁定依赖
npm run dev                                 # 后端 :4000 + 前端 :3000
npm run build                               # 先后端、后前端
```

本地 PostgreSQL 使用 **5433** 端口，`DATABASE_URL` 要与之匹配。Prisma 要求环境变量中
存在 `DATABASE_URL`（`.env` 不提交，`setup.sh` 会把它符号链接到各 workspace）：

```bash
cd packages/backend
set -a; . ../../.env; set +a
npx prisma migrate deploy
npx prisma generate
```

检查项，与 `.github/workflows/ci.yml` 保持一致：

```bash
# 在 packages/backend 下，先执行 prisma generate
npm run lint                                # eslint --fix：之后务必检查 diff
npx tsc --noEmit -p tsconfig.json
npm test                                    # 源码旁的 Jest *.spec.ts

# 在 packages/frontend 下
npm run lint
npx tsc --noEmit -p tsconfig.json
npx playwright install --with-deps chromium
npm run test:e2e                            # 先停掉常规开发服务器
```

**不要**在根目录运行 `npm test`：它会分发到所有 workspace，而前端没有 `test` 脚本。
适配器目录（catalog）测试请用上面的后端命令。基线失败与新增回归要分开记录；
失败的运行绝不能报成通过。

适配器工具（在根目录执行，六步清单见 `AGENTS.md`）：

```bash
npm run adapter:new -- <slug> --region <region> --auth <type>
node scripts/validate-adapters.mjs --warn
node scripts/regenerate-catalog.mjs        # 重写 catalog.ts 的 AUTOGEN 区块
node scripts/adapter-count.mjs --check
```

`packages/backend/src/adapters/catalog.ts` 是生成文件：只能修改
`AUTOGEN-*-BEGIN/END` 区块之外的内容，并且必须提交重新生成后的 diff。新增 adapter
JSON 时还要提供 `<region>/<slug>.live.spec.ts`（静态断言始终执行，实时调用由
`RUN_<SLUG>_LIVE=1` 控制），以及
`packages/frontend/public/logos/connectors/` 下的 logo。

## 架构约定

- `better-sqlite3` 固定为 `12.9.0`：上游从 12.10.0 起不再发布 Node 20（ABI 115）
  预编译包，升级会让 Windows 上的 `npm install` 退回 `node-gyp` 源码编译。不要
  随意升级该依赖。国内网络下可在本地 `.npmrc`（已 gitignore）配置
  `better_sqlite3_binary_host` 与 `disturl` 镜像。
- 所有组织范围内的查询都必须按 `organizationId` 过滤；`schema.prisma` 中的模型使用
  `organization_id`，带级联关系与索引。RLS 是可选、分阶段启用的额外层
  （`ENABLE_RLS`，见 `docs/operations/row-level-security.md`）。
- 访问用户提供的 URL（连接器 base URL、token 端点、spec 导入地址）只能经由
  `common/outbound-http.ts`（`outboundRequest`，或把 `outboundAxiosOptions()` 展开到
  axios 配置中），绝不能直接用裸 `axios`/`fetch`。它负责 SSRF 校验、受保护的 DNS
  解析和逐跳重定向校验。
- 输入用 DTO + `class-validator` 校验；`main.ts` 启用了全局 `ValidationPipe`，带
  `whitelist` 与 `forbidNonWhitelisted`。
- 每个功能模块一个 NestJS module：controller、service、DTO、`.spec.ts`。
- 使用 NestJS `Logger`/Pino，不用 `console.log`；绝不记录密钥、令牌或个人信息。
  密钥来自 `.env`（`JWT_SECRET`、`ENCRYPTION_KEY` 等）；绝不提交真实凭据，也不要
  写进 adapter JSON —— 使用凭据变量引用。
- Next.js 16 有破坏性变更：写前端代码前先读自带的 `node_modules/next/dist/docs/`
  指南（见 `packages/frontend/AGENTS.md`）。优先使用服务端组件，样式用 Tailwind。
- 部署模式：`common/deployment.service.ts` 的 `isCloud()`/`isSelfHosted()`；
  `DEPLOYMENT_MODE=cloud` 为 Cloud，其余值均为自托管。前端使用
  `lib/use-edition.ts`；在 Cloud、加载中和未登录时 `edition` 可能为 null。
  任何功能都要说明在两种模式下的行为；本文档只作说明，不包含 Cloud 运维操作。
- 修改 Prisma schema（需附迁移）、新增连接器类型、改动认证、破坏性 API 或大规模
  重构，都要先开 issue。

## 贡献流程

Fork 后从 `main` 建分支，命名为 `docs/`、`fix/`、`feat/` 或 `refactor/` + 描述。
提交标题用祈使语气、不超过 72 字符并关联 issue；保持 PR 聚焦，填写
`.github/PULL_REQUEST_TEMPLATE.md`。更新面向用户的文档、补充测试，并在 PR 中列出
确切命令、工作目录和真实结果。签署一次性的 [CLA](CLA.md)
（`.github/workflows/cla.yml`）。必须通过后端 catalog 测试与适配器校验。
逐行复核 AI 辅助生成的内容，并用自己的话写明改动理由。

## 规则文件

`AGENTS.md` 是共用的智能体约定，`CLAUDE.md` 引用它；本文件是 CodeBuddy 的入口。
`packages/frontend/AGENTS.md` 由 `next dev` 自动重新生成（聚焦型 PR 不要夹带
Next.js 附带产生的文件改动）。`scripts/demo-video/compositions/AGENTS.md` 属于
无关的视频工具，不必理会。模块化规则放在 `.codebuddy/rules/`；前端专属规则见
`.codebuddy/rules/frontend.md`（条件触发，仅在操作 `packages/frontend/` 下文件时加载）。
