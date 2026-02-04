# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 分支策略

本仓库是从上游 Plane 仓库 fork 而来，采用以下分支管理策略：

- **`itemtype`** 分支：本地开发分支，包含自定义功能（如工作项类型下拉框、Docker 优化等）
- **`preview`** 分支：上游主分支，用于同步上游更新
- **不创建 PR**：`itemtype` 分支不会合并到主分支，保持独立以便从上游同步
- 提交代码时直接推送到 `itemtype` 分支：`git push origin itemtype`

## Project Overview

Plane is an open-source project management platform (issues, cycles, modules, views, pages, analytics). It's a monorepo with a Django REST backend and React Router frontend apps.

## Commands

```bash
# Development
pnpm dev                    # Start all dev servers (web:3000, admin:3001, space:3002)
docker compose -f compose.dev.yml up  # Start backend services (Redis, PostgreSQL, RabbitMQ, MinIO, API)

# Production Deployment
docker compose -f compose.prod.yml up  # Start all services including frontend apps

# Build & Checks
pnpm build                  # Build all packages and apps
pnpm check                  # Run format, lint, and type checks
pnpm check:lint             # ESLint only
pnpm check:types            # TypeScript type checking
pnpm fix                    # Auto-fix lint and format issues

# Target specific package
pnpm --filter=@plane/ui run build
pnpm --filter=@plane/ui storybook    # Storybook on port 6006
pnpm --filter=@plane/codemods run test

# Python API (from apps/api/)
ruff check .                # Lint Python code
ruff format .               # Format Python code
```

## Architecture

```
apps/
├── web/          # Main dashboard (React Router, port 3000)
├── admin/        # Admin panel (React Router, port 3001)
├── space/        # Public shared items (React Router + SSR, port 3002)
├── live/         # Real-time collaboration service
├── api/          # Django REST backend (port 8000)
│   └── plane/
│       ├── api/           # REST endpoints (serializers, views, URLs)
│       ├── db/            # Database models (120+ models)
│       ├── bgtasks/       # Celery background tasks
│       └── authentication/# Auth middleware
└── proxy/        # Nginx reverse proxy

packages/
├── ui/           # Component library (Storybook, Tailwind, Headless UI)
├── types/        # Centralized TypeScript types
├── services/     # API client layer (Axios-based)
├── shared-state/ # MobX state management stores
├── hooks/        # React hooks
├── editor/       # Rich text editor (TipTap)
├── i18n/         # Internationalization (i18next)
└── utils/        # Utility functions
```

## Code Style

**TypeScript (Frontend)**

- Strict mode, no `any` types
- Use `import type` for type-only imports
- Use `workspace:*` for internal packages, `catalog:` for external deps
- camelCase for variables/functions, PascalCase for components/types
- MobX for state management with reactive patterns

**Python (Backend)**

- Ruff for linting and formatting (line-length: 120)
- Google-style docstrings
- Max complexity: 10 (McCabe)

## Local Development Setup

1. Run `./setup.sh` (installs deps, creates .env)
2. `docker compose -f compose.dev.yml up` (starts backend services)
3. `pnpm dev` (starts frontend apps)
4. Register as instance admin at http://localhost:3001/god-mode/
5. Access app at http://localhost:3000

## Docker Compose 文件说明

- **`compose.dev.yml`** - 开发环境配置，仅启动后端基础设施服务（PostgreSQL, Redis, RabbitMQ, MinIO, API）
- **`compose.prod.yml`** - 生产环境配置，启动所有服务包括前端应用（web, admin, space）

## Key Patterns

- **State Management**: MobX stores in `@plane/shared-state`, reactive patterns
- **API Layer**: Service classes in `@plane/services` wrap API calls
- **Components**: Build in `@plane/ui` with Storybook for isolated development
- **Translations**: i18next with nested JSON structure, IntlMessageFormat for variables/pluralization

## Docker 构建流量优化

本项目 Dockerfile 已优化分层和缓存策略，最大限度减少重复下载。

### 缓存机制说明

**Docker 层缓存**：Dockerfile 按依赖变化频率分层

```
基础镜像 (很少变) → 系统包 (很少变) → Python/Node 依赖 (偶尔变) → 代码 (经常变)
```

只要前面的层没变化，就会使用缓存，不会重新下载。

**BuildKit 缓存挂载**：pip/pnpm 下载缓存跨构建复用

```dockerfile
# pip 缓存 - 即使 requirements 变化，只下载新增/更新的包
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# pnpm 缓存 - 前端依赖同理
RUN --mount=type=cache,target=/pnpm/store pnpm install
```

### 正确的构建方式

```bash
# ✅ 开发环境构建（会使用缓存）
docker compose -f compose.dev.yml up --build

# ✅ 生产环境构建
docker compose -f compose.prod.yml up --build

# ✅ 只重建特定服务
docker compose -f compose.dev.yml build api
docker compose -f compose.prod.yml build web

# ❌ 避免使用 --no-cache（会重新下载所有依赖）
docker compose build --no-cache  # 不要这样做
```

### 流量消耗场景

| 场景                  | 预估流量                    |
| --------------------- | --------------------------- |
| 首次构建              | ~800MB（基础镜像+所有依赖） |
| 代码变更后构建        | ~0MB（全部命中缓存）        |
| requirements.txt 变更 | 仅下载新增/更新的包         |
| 基础镜像更新          | ~50-100MB                   |

### 可选：国内镜像加速

如需使用国内镜像（提升速度，不减少流量）：

```bash
# pip 镜像
export PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/
export PIP_TRUSTED_HOST=mirrors.aliyun.com
docker compose -f compose.dev.yml up --build

# npm 镜像（编辑 .npmrc 取消注释）
# registry = https://registry.npmmirror.com
```

### Dockerfile 优化说明（2026-02-03）

所有 Dockerfile 已按照最佳实践优化：

**API (Dockerfile.api)**:

- 按变化频率分层：运行时依赖 → requirements 文件 → 安装依赖 → 源代码
- 合并 RUN 命令减少层数
- 使用 BuildKit 缓存挂载加速 pip 下载

**前端应用 (Web/Admin/Space)**:

- 三阶段构建：prune → install & build → serve
- turbo 全局安装独立缓存层
- pnpm fetch 和 install 分离，充分利用缓存挂载
- 优化注释和阶段说明

<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 3, 2026

| ID    | Time     | T   | Title                                                          | Read |
| ----- | -------- | --- | -------------------------------------------------------------- | ---- |
| #1368 | 10:49 PM | ✅  | Added Dockerfile Optimization Summary to Documentation         | ~386 |
| #1367 | "        | ✅  | Updated Docker Build Command Examples in Documentation         | ~298 |
| #1366 | "        | ✅  | Added Docker Compose File Explanation Section to Documentation | ~345 |
| #1365 | 10:48 PM | ✅  | Updated CLAUDE.md Commands to Reflect New Compose File Names   | ~292 |
| #1364 | "        | ✅  | Updated Project Documentation with Docker Optimization Notes   | ~403 |

</claude-mem-context>
