# 06 · 共享包（Packages）架构

> **路径**: `packages/`  
> **技术栈**: TypeScript · React · MobX · TipTap · i18next · Tailwind

---

## 1. 包依赖关系图

```
应用层（web / space / admin / live）
    ↓ 使用
┌──────────────────────────────────────────────────────┐
│  业务包                                               │
│  @plane/services    ← API 调用层（axios 封装）        │
│  @plane/shared-state ← MobX Store 基础               │
│  @plane/hooks       ← React Hooks                    │
│  @plane/types       ← TypeScript 类型定义             │
│  @plane/i18n        ← 国际化（i18next）               │
│  @plane/constants   ← 常量（枚举、配置）              │
├──────────────────────────────────────────────────────┤
│  UI 包                                                │
│  @plane/ui          ← 组件库（Storybook 预览）        │
│  @plane/editor      ← 富文本编辑器（TipTap）          │
│  @plane/tailwind-config ← Tailwind 基础配置           │
├──────────────────────────────────────────────────────┤
│  工具包                                               │
│  @plane/utils       ← 通用工具函数                    │
│  @plane/logger      ← 日志工具                       │
│  @plane/decorators  ← TS 装饰器                      │
│  @plane/codemods    ← 代码迁移工具                    │
└──────────────────────────────────────────────────────┘
```

---

## 2. 各包详解

### 2.1 @plane/types（类型中心）

**最重要的基础包**，所有 TypeScript 接口都在这里定义：

```typescript
// 主要类型分组
├── IIssue, IIssueLite         ← Issue 类型
├── IProject, IProjectLite     ← 项目类型
├── IWorkspace                 ← 工作区类型
├── IUser, IUserLite           ← 用户类型
├── ICycle, IModule            ← 周期/模块类型
├── IState, ILabel             ← 状态/标签类型
├── IIssueType, IExtraProperty ← 工作项类型/额外属性（本地扩展）
└── ...（120+ 接口）
```

使用约定：

```typescript
import type { IIssue } from "@plane/types"; // 必须用 import type
```

### 2.2 @plane/services（API 调用层）

封装所有对 Django REST API 的 HTTP 调用：

```typescript
// 服务类结构（图谱中 Community 23-90 的单节点服务）
APIService           ← axios 基类，统一 baseURL + 认证 header
├── WorkspaceService      ← /workspaces/
├── ProjectService        ← /projects/
├── IssueService          ← /issues/
├── CycleService          ← /cycles/
├── ModuleService         ← /modules/
├── FileService           ← 文件上传 /assets/
├── IssueTypeService      ← /issue-types/（本地扩展）
├── ExtraPropertyConfigService ← 额外属性配置（本地扩展）
├── AnalyticsService      ← 高级分析
├── WebhookService        ← Webhook 管理
├── DashboardService      ← 仪表板
└── ...（30+ 服务类）
```

### 2.3 @plane/shared-state（MobX 状态）

MobX observable store 的**基础设施层**：

```typescript
// 图谱社区 10（Activity Store）：
IssueActivityStore     ← Issue 活动日志
IssueAttachmentStore   ← 附件状态
IssueCommentStore      ← 评论状态
IssueCommentReactionStore ← 评论反应
EditorAssetStore       ← 编辑器资产
CommandPaletteStore    ← 命令面板
AnalyticsStore         ← 分析数据
BaseTimeLineStore      ← 时间轴基类
```

### 2.4 @plane/editor（富文本编辑器）

基于 **TipTap** 的富文本编辑器，功能：

- Markdown 语法支持
- 图片/文件上传（集成 S3Storage）
- @用户提及（mentions/root.tsx）
- 代码块高亮
- 表格、任务列表
- 协作光标（集成 live service）

```
packages/editor/
├── core/           ← 编辑器核心（extensions, plugins）
├── document/       ← 文档编辑器变体（Page 使用）
└── rich-text/      ← 富文本编辑器变体（Issue 描述使用）
```

### 2.5 @plane/ui（组件库）

基于 **Headless UI + Tailwind** 的组件库，通过 Storybook 预览：

```bash
pnpm --filter=@plane/ui storybook  # 启动 Storybook on port 6006
```

主要组件：

- Button, Input, Select, Dropdown
- Avatar, Badge, Tooltip
- Modal, Sheet, Popover
- Spinner, Progress
- Command（命令面板基础）

### 2.6 @plane/i18n（国际化）

基于 **i18next** 的翻译系统：

```typescript
// 翻译文件结构
locales/
├── en/           ← 英文（基准）
└── zh/           ← 中文

// 使用方式
import { useTranslation } from "@plane/i18n";
const { t } = useTranslation();
t("issue.create");  // → "Create Issue"
```

变量替换使用 **IntlMessageFormat** 格式：

```typescript
t("issue.count", { count: 5 }); // → "5 issues"
```

### 2.7 @plane/hooks（React Hooks）

通用 React Hooks，不依赖任何 Store：

```typescript
usePlatformOS()    ← 检测操作系统（Mac/Windows）（84 edges in web）
useOutsideClick()  ← 点击外部关闭
useIntersection()  ← 元素可见性检测
```

### 2.8 @plane/utils（工具函数）

通用工具函数：

- 日期格式化
- 字符串处理
- URL 验证（Community 20 & 59）
- 安全重定向（Community 60）
- HTML 标签去除（Community 76）

### 2.9 @plane/constants（常量）

业务常量（Group By 选项、Filter 类型、Priority 等）。

---

## 3. 包版本管理

使用 **pnpm workspace catalog** 统一管理外部依赖版本：

```json
// pnpm-workspace.yaml
catalog:
  react: "^18.3.1"
  mobx: "^6.x"
  "@tiptap/core": "^2.x"
```

内部包使用 `workspace:*`：

```json
// apps/web/package.json
"dependencies": {
  "@plane/ui": "workspace:*",
  "@plane/types": "workspace:*"
}
```

---

## 4. 构建顺序

```
packages/types → packages/utils → packages/ui
                              ↘ packages/services
                                ↘ packages/shared-state
                                  ↘ packages/hooks
                                    ↘ packages/editor
                                      ↘ apps/*
```

Turborepo 的 `build` pipeline 自动处理依赖顺序。

---

## 阅读建议

1. 先看 `packages/types/src/` → 理解所有业务实体的类型定义
2. 看 `packages/services/src/` → 理解 API 调用模式
3. 看 `packages/ui/src/` + Storybook → 理解 UI 组件使用方式
4. 看 `packages/editor/` → 理解富文本编辑器扩展机制
