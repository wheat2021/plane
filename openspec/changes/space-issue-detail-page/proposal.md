## Why

Space 服务目前只支持以项目为单位的公开发布（publish），用户分享的最小单元是整个看板或列表。当需要将单条 Issue 的详情发送给无项目权限的外部用户时，只能发送包含所有 Issue 的项目链接，无法做到精确到单条 Issue 的分享。

## What Changes

- **新增独立 Issue 详情路由**：在 Space 服务添加 `/issues/:anchor/issue/:issueId` 路由，以全屏方式展示单条 Issue 的完整信息
- **新建独立详情页组件**：复用已有 `FullScreenPeekView` 组件，以独立页面而非 Dialog overlay 方式渲染
- **新增分享入口**：在 Peek Overview Header 中添加"复制链接"按钮，生成指向独立 Issue 详情页的直链
- **SSR Meta 支持**：独立 Issue 详情页支持 OpenGraph/Twitter Card meta 标签，便于社交媒体预览

## Capabilities

### New Capabilities

- `space-issue-detail-page`：Space 服务中可独立访问的 Issue 全屏详情页，通过 project anchor + issue UUID 构成 URL，无需登录即可查看（沿用已发布项目的 AllowAny 权限），收到链接的用户仅能看到该 Issue 详情，无法浏览其他 Issue

### Modified Capabilities

<!-- 无现有 spec 需要修改 -->

## Impact

**前端（apps/space/）**

- `app/routes.ts`：新增一条 issue 详情路由
- `app/issues/[anchor]/issue/[issueId]/page.tsx`：新建独立详情页（SSR loader + meta + 客户端渲染）
- `core/components/issues/peek-overview/`：Header 新增分享按钮，FullScreenPeekView 支持 standalone 模式（隐藏 close 按钮）

**后端（apps/api/）**

- 无需改动：`IssueRetrievePublicEndpoint`（`AllowAny`）已存在且满足需求
- 可选：新增 issue meta 端点用于 SSR OG 标签（参考已有 `ProjectMetaDataEndpoint` 模式）

**上游同步风险**

- `apps/space/app/routes.ts`：上游可能新增路由，低风险（追加操作）
- `apps/space/core/components/issues/peek-overview/header.tsx`：上游可能修改 header，中等风险（需关注合并冲突）
