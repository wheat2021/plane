## Context

Space 服务是 Plane 的公开访问门户，允许将项目发布给外部用户访问。当前架构以"项目"为最小分享单元，通过 `anchor`（项目发布标识）控制访问权限，所有 Space API 端点均使用 `AllowAny` 权限。

Issue 详情目前通过 `IssuePeekOverview` 组件以 overlay 形式展示，具有四种 peek 模式（side / modal / full / standalone），其中 `FullScreenPeekView` 组件已包含完整的 Issue 详情布局（标题、描述、Activity、属性面板），但当前只作为 Dialog overlay 渲染在列表/看板视图之上。

本变更的目标是将 `FullScreenPeekView` 提升为可独立访问的页面，无需依赖底层 list/kanban 视图，从而支持将单条 Issue 直链分享给外部用户。

## Goals / Non-Goals

**Goals:**

- 为单条 Issue 提供独立的可分享 URL（`/issues/:anchor/issue/:issueId`）
- 接收链接的用户看不到其他 Issue，仅看到该条 Issue 的完整详情
- 支持 SSR meta 标签（OpenGraph / Twitter Card），便于社交媒体预览
- 在现有 Peek Overview Header 中添加"复制分享链接"按钮
- 零后端改动（复用已有 `IssueRetrievePublicEndpoint`）

**Non-Goals:**

- 不实现 per-issue token（每条 Issue 独立的访问令牌）
- 不支持 Issue 分享链接的有效期/撤销功能
- 不修改项目发布逻辑（anchor 生成/管理）
- 不在独立详情页支持 Issue 编辑（仅展示 + reactions/votes/comments）

## Decisions

### 决策 1：使用 anchor + issue UUID 构成 URL，而非 sequence_id

**选择**：`/issues/:anchor/issue/:issueId`（issueId 为 UUID）

**理由**：

- Space API 现有端点 `IssueRetrievePublicEndpoint` 使用 `<uuid:issue_id>`，无需新增后端端点
- UUID 全局唯一，不存在跨项目冲突问题
- Sequence ID（如 `DEV-42`）需要额外的后端查询端点，增加复杂度

**替代方案考虑**：sequence_id 更人类可读，但需要新增 `GET /anchor/:anchor/issues/by-sequence/:seqId/` 端点。后续可作为扩展独立实现。

---

### 决策 2：独立详情页复用 FullScreenPeekView，而非新建组件

**选择**：直接复用 `FullScreenPeekView`，增加 `standalone` prop

**理由**：

- 组件已经包含 Issue 详情所需的全部子组件（header、details、properties、activity）
- 避免维护两套 UI 逻辑的同步问题
- `standalone` prop 仅控制关闭按钮行为，改动极小

**替代方案考虑**：新建独立组件，完全解耦——但会造成代码重复，维护成本高。

---

### 决策 3：SSR Issue Meta 端点策略

**选择**：新建后端端点 `GET /api/public/anchor/:anchor/issues/:issue_id/meta/`，用于 SSR loader 获取 Issue 标题用于 OG 标签

**理由**：

- 独立详情页需要在 server-side render 时生成正确的 `<title>` 和 `og:title`
- 现有 `IssueRetrievePublicEndpoint` 返回完整 Issue 数据（含 annotations），适合客户端；meta 端点只需返回轻量数据（name, description, identifier）
- 参考已有 `ProjectMetaDataEndpoint` 的模式实现

**替代方案考虑**：在 SSR loader 中直接调用完整 issue endpoint——数据量过大，meta 场景不需要全量数据。

---

### 决策 4：分享入口放在 Peek Overview Header

**选择**：在现有 `PeekOverviewHeader` 中添加 copy-link 图标按钮

**理由**：

- Header 是 peek overlay 的入口，用户习惯从 header 操作
- 图标按钮（`Link2` icon + toast 提示）不占用额外空间
- 独立详情页复用同一 header，分享按钮天然在两处都可见

## 文件变更地图

```
apps/space/
├── app/
│   ├── routes.ts                              ← 新增 issue 详情路由
│   └── issues/[anchor]/issue/[issueId]/
│       └── page.tsx                           ← 新建（SSR loader + meta + 页面）
├── core/components/issues/peek-overview/
│   ├── header.tsx                             ← 新增 copy-link 按钮
│   ├── full-screen-peek-view.tsx              ← 新增 standalone prop
│   └── layout.tsx                             ← handleClose 传入分享页时为 undefined
apps/api/plane/space/
├── views/issue.py                             ← 新增 IssueMetaPublicEndpoint（轻量 meta）
└── urls/issue.py                              ← 新增 meta 路由
```

## Risks / Trade-offs

- **上游冲突风险（中）**：`peek-overview/header.tsx` 若上游有改动，merge 时需手动处理。缓解：改动量最小化（仅追加一个按钮），降低冲突面积。
- **UUID 暴露（低）**：URL 中包含 Issue UUID，对于已发布项目而言这不是安全问题（端点已是 AllowAny），但需确认项目未发布时无法通过 UUID 猜测访问——由 DeployBoard anchor 校验已保证。
- **无 token 隔离**：收到链接的用户如果知道 anchor，仍可访问项目列表。这是设计取舍，与"项目已发布"的前提一致。若需要真正的 Issue 级隔离，需在后续变更中实现 per-issue token。

## Migration Plan

- 纯前端新增路由，无数据库迁移
- 后端新增 meta 端点为只读 GET，无副作用
- 现有 `/issues/:anchor` 路由不受影响，无破坏性变更
- 回滚：删除新增路由和页面文件即可

## Open Questions

- Issue meta 端点是否需要单独实现，还是 SSR loader 可直接使用 settings 端点中已有的项目信息 + 客户端补充 issue title？（可在实现时根据 SSR 框架约束决定）
