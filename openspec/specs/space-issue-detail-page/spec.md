## ADDED Requirements

### Requirement: 独立 Issue 详情页路由

Space 服务 SHALL 提供路由 `/issues/:anchor/issue/:issueId`，以独立全屏页面的形式展示单条 Issue 的完整详情，无需底层 list/kanban 视图。

#### Scenario: 有效链接直接访问

- **WHEN** 用户访问 `/issues/:anchor/issue/:issueId`，且 anchor 对应的项目已发布，issueId 属于该项目
- **THEN** 页面以全屏布局展示该 Issue 的标题、描述、Activity、属性面板（state、priority、assignees、labels、due date 等）

#### Scenario: anchor 不存在或项目未发布

- **WHEN** 用户访问的 anchor 不存在或对应项目未发布
- **THEN** 页面显示 404 错误视图

#### Scenario: issueId 不属于该项目

- **WHEN** anchor 有效但 issueId 不属于该已发布项目
- **THEN** 页面显示 404 错误视图

#### Scenario: 页面 SSR meta 标签

- **WHEN** 浏览器或爬虫请求 `/issues/:anchor/issue/:issueId`
- **THEN** 页面 `<title>` 为 Issue 标识符（如 `DEV-42`）加标题，`og:title` / `og:description` 包含 Issue 摘要信息

---

### Requirement: 独立详情页无项目导航

独立 Issue 详情页 SHALL 不展示项目看板导航栏（无布局切换、无过滤器），页面仅包含 Issue 详情内容及轻量顶部 header。

#### Scenario: 页面布局无看板导航

- **WHEN** 用户访问独立 Issue 详情页
- **THEN** 页面不显示 IssuesNavbarRoot（无 list/kanban/calendar 布局切换按钮，无 filter 按钮），不显示其他 Issue 列表

#### Scenario: 顶部 header 包含返回链接（可选）

- **WHEN** 用户在独立详情页顶部 header 中点击"返回看板"
- **THEN** 跳转到对应项目的 `/issues/:anchor` 页面

---

### Requirement: Issue 分享链接复制功能

Space 服务的 Peek Overview Header SHALL 提供"复制分享链接"按钮，点击后将该 Issue 的独立详情页 URL 复制到剪贴板。

#### Scenario: 在 peek overlay 中复制链接

- **WHEN** 用户在 `/issues/:anchor` 页面打开某条 Issue 的 peek overlay，并点击 header 中的复制链接按钮
- **THEN** 剪贴板中写入 `/issues/:anchor/issue/:issueId` 的完整 URL，界面展示成功提示（toast）

#### Scenario: 在独立详情页中复制链接

- **WHEN** 用户在独立 Issue 详情页 (`/issues/:anchor/issue/:issueId`) 的 header 中点击复制链接按钮
- **THEN** 剪贴板中写入当前页面 URL，界面展示成功提示（toast）

---

### Requirement: 独立详情页支持 reactions / votes / comments

独立 Issue 详情页 SHALL 支持与 peek overlay 相同的 reactions、votes 及 comments 交互功能。

#### Scenario: 未登录用户查看 comments

- **WHEN** 未登录用户访问独立 Issue 详情页
- **THEN** 页面显示现有 comments 列表（与 peek overlay 行为一致）

#### Scenario: 已登录用户添加 comment

- **WHEN** 已登录用户在独立 Issue 详情页的评论区提交评论
- **THEN** 评论成功提交，列表实时更新（与 peek overlay 行为一致）

---

### Requirement: 后端 Issue Meta 端点

后端 SHALL 提供轻量级 Issue Meta 端点 `GET /api/public/anchor/:anchor/issues/:issue_id/meta/`，用于 SSR 生成 OG 标签，返回 Issue 的标题、描述摘要和项目标识符，不包含完整 annotations 数据。

#### Scenario: 请求合法 Issue 的 meta

- **WHEN** SSR loader 请求 `GET /api/public/anchor/:anchor/issues/:issue_id/meta/`，anchor 和 issue_id 均有效
- **THEN** 响应返回 `{ "name": "...", "description": "...", "identifier": "DEV-42" }`，HTTP 200

#### Scenario: anchor 或 issue_id 无效

- **WHEN** SSR loader 请求的 anchor 不存在或 issue_id 不属于该项目
- **THEN** 响应返回 HTTP 404
