## 1. 提交变更文档

- [ ] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）到 git

## 2. 后端：新增 Issue Meta 端点

- [ ] 2.1 在 `apps/api/plane/space/views/issue.py` 中新增 `IssueMetaPublicEndpoint`，返回轻量数据（name, description, identifier，如 `DEV-42`），`AllowAny` 权限，通过 `DeployBoard` anchor 校验项目归属
- [ ] 2.2 在 `apps/api/plane/space/urls/issue.py` 中注册路由 `anchor/<str:anchor>/issues/<uuid:issue_id>/meta/`

## 3. 前端：FullScreenPeekView 支持 standalone 模式

- [ ] 3.1 在 `FullScreenPeekView` 组件（`apps/space/core/components/issues/peek-overview/full-screen-peek-view.tsx`）添加可选 prop `standalone?: boolean`，当为 `true` 时隐藏关闭按钮

## 4. 前端：Peek Overview Header 添加分享按钮 [UPSTREAM-RISK]

- [ ] 4.1 在 `apps/space/core/components/issues/peek-overview/header.tsx` 中添加复制链接图标按钮（使用 `Link2` icon），点击后构造 `/issues/:anchor/issue/:issueId` 完整 URL 并写入剪贴板，显示 toast 成功提示
- [ ] 4.2 确认 header 接收 `anchor` 和 `issueId` props（或从 context/store 获取），用于构造分享 URL

## 5. 前端：新建独立 Issue 详情页

- [ ] 5.1 在 `apps/space/app/routes.ts` 中追加路由：`route("issues/:anchor/issue/:issueId", "./issues/[anchor]/issue/[issueId]/page.tsx")`
- [ ] 5.2 新建 `apps/space/app/issues/[anchor]/issue/[issueId]/page.tsx`：
  - SSR `loader` 函数调用 `/api/public/anchor/:anchor/issues/:issue_id/meta/` 获取 Issue 元信息
  - `meta` 函数基于 loader 数据生成 `<title>`、`og:title`、`og:description` 等 meta 标签
  - 客户端组件使用 `useSWR` 加载 publishSettings（验证 anchor 合法性，404 时渲染 `PageNotFound`）
  - 使用 `useSWR` 加载完整 Issue 详情（`fetchIssueDetails`）
  - 以独立全屏方式渲染 `FullScreenPeekView`（传入 `standalone={true}`），无 Dialog 包装
  - 页面顶部显示轻量 header：Logo + 项目标识符 + 可选"返回看板"链接

## 6. 提交实现代码

- [ ] 6.1 提交后端变更：`#FICC-9999# 新增 Issue Meta 公开端点，用于独立详情页 SSR`（暂存 `apps/api/plane/space/views/issue.py` 和 `apps/api/plane/space/urls/issue.py`）
- [ ] 6.2 提交前端变更：`#FICC-9999# 新增 Space 服务独立 Issue 详情页及分享链接功能`（暂存所有 `apps/space/` 下修改文件）

## 7. 用户验证

- [ ] 7.1 访问 `/issues/:anchor/issue/:issueId`（有效 anchor + issue UUID），确认全屏展示 Issue 标题、描述、属性面板和 Activity，无看板导航栏
- [ ] 7.2 访问无效 anchor 或不存在 issueId 的链接，确认显示 404 页面
- [ ] 7.3 在 curl 或浏览器 DevTools 中检查页面 `<title>` 和 `<meta property="og:title">` 内容正确包含 Issue 标识符
- [ ] 7.4 在 `/issues/:anchor` 看板中打开任意 Issue 的 peek overlay，点击 header 中的复制链接按钮，确认剪贴板内容为 `/issues/:anchor/issue/:issueId` 格式的完整 URL
- [ ] 7.5 将复制的链接粘贴到无痕/私有浏览窗口访问，确认无需登录即可查看 Issue 详情
