# 02 · Web App 架构

> **路径**: `apps/web/`  
> **技术栈**: TypeScript · React · React Router · MobX · Tailwind CSS  
> **节点规模**: 3338 nodes

---

## 1. 目录结构

```
apps/web/
├── app/             # 路由层（React Router，Next.js compat 层）
│   ├── (all)/       # 需认证页面
│   └── (home)/      # 登录/注册页面
├── core/            # 核心层（可被 ce/ 扩展）
│   ├── components/  # UI 组件（1626 nodes，最大）
│   ├── services/    # API 调用层（492 nodes）
│   ├── store/       # MobX 状态层（391 nodes）
│   ├── hooks/       # React Hooks（184 nodes）
│   ├── constants/   # 常量定义（54 nodes）
│   └── lib/         # 工具库（store-context 等，11 nodes）
└── ce/              # Community Edition 扩展层
    ├── components/  # CE 专用组件（225 nodes）
    ├── store/       # CE 专用 Store（62 nodes）
    ├── hooks/       # CE 专用 Hooks（36 nodes）
    └── services/    # CE 专用 Service（11 nodes）
```

---

## 2. 核心设计模式：ce/ vs core/ 双轨

```
core/          ← 开源基础实现（所有版本共用）
ce/            ← Community Edition 扩展/覆盖

规则：ce/ 可以 import core/，但 core/ 不能 import ce/
app/routes     ← 决定渲染哪个版本的组件
```

---

## 3. 状态管理：MobX Store 层次

```
StoreProvider（web/core/lib/store-context.tsx，65 edges）
  └── RootStore
        ├── ProjectStore           ← 项目数据（ProjectStore）
        ├── IssueStore             ← 各种 Issue 视图
        │   ├── base-issues.store  ← Issue CRUD 基类
        │   ├── ProjectIssueStore
        │   ├── CycleIssueStore
        │   ├── ModuleIssueStore
        │   └── ...
        ├── CycleStore             ← 迭代周期
        ├── ModulesStore           ← 模块管理
        ├── StateStore             ← Issue 状态
        ├── LabelStore             ← 标签
        ├── WorkspaceMemberStore   ← 成员
        ├── CalendarStore          ← 日历视图
        ├── IssueActivityStore     ← 活动日志
        ├── IssueAttachmentStore   ← 附件
        ├── IssueCommentStore      ← 评论
        ├── RouterStore            ← 路由状态
        ├── ThemeStore             ← 主题
        └── CommandPaletteStore    ← 命令面板
```

**访问 Store 的方式（Hooks）**:

```typescript
// 通过 hooks 访问 store（不直接 import store 实例）
const { issues } = useIssues(); // use-issues.ts (55 edges)
const { project } = useProject(); // use-project.ts (97 edges)
const { issueDetail } = useIssueDetail(); // use-issue-detail.ts (96 edges)
const { projectState } = useProjectState(); // use-project-state.ts (36 edges)
```

---

## 4. Service 层（API 调用抽象）

`core/services/` 是对 API 调用的封装，与 `@plane/services` 包配合：

| Service                      | 边数 | 功能         |
| ---------------------------- | ---- | ------------ |
| `WorkspaceService`           | 44   | 工作区 CRUD  |
| `IssueService`               | 35   | Issue CRUD   |
| `ProjectService`             | —    | 项目管理     |
| `CycleService`               | —    | 迭代周期     |
| `ModuleService`              | —    | 模块         |
| `FileService`                | —    | 文件上传     |
| `EstimateService`            | —    | 工时估算     |
| `IssueLabelService`          | —    | 标签         |
| `IssueTypeService`           | —    | 工作项类型   |
| `ExtraPropertyConfigService` | —    | 额外属性配置 |

---

## 5. 组件架构

### 5.1 Issue 组件树（核心功能）

```
Issue 视图
├── issue-layouts/          ← 布局视图选择器
│   ├── list/               ← 列表视图
│   ├── board/              ← 看板视图（Kanban）
│   ├── spreadsheet/        ← 表格视图
│   ├── calendar/           ← 日历视图
│   ├── gantt/              ← 甘特图
│   └── utils.tsx           ← 布局工具函数（478 edges，最高！）
├── peek-overview/          ← Issue 快速预览侧边栏
│   ├── issue-detail.tsx    ← 详情主体（39 edges）
│   └── properties.tsx      ← 属性面板（37 edges）
└── issue-detail-widgets/   ← 详情小组件（评论/附件/子任务）
    └── sub-issues/
        └── filters.tsx     ← 子任务过滤（55 edges）
```

### 5.2 编辑器组件（Rich Text）

```
web/core/components/editor/
└── rich-text/editor.tsx    ← 主编辑器（68 edges）
    基于 @plane/editor 包（TipTap 封装）
```

### 5.3 通知组件

```
web/core/components/workspace-notifications/
└── sidebar/notification-card/options/
    └── button.tsx          ← 通知操作按钮（129 edges，最高！）
```

---

## 6. 路由系统

```
app/routes/                 ← React Router 路由定义
app/(all)/                  ← 认证后页面（工作区、项目、设置等）
app/(home)/                 ← 公开页面（登录/注册）

路由 compat 层（Next.js → React Router 迁移）:
app/compat/next/
├── navigation.ts           ← useRouter() 兼容（225 edges）
└── helper.ts               ← 路由辅助函数（84 edges）
```

---

## 7. 关键常量

`core/constants/fetch-keys.ts`（68 edges）：SWR/React Query 缓存 Key 的中央定义文件。所有 API 请求的缓存失效依赖此文件中的 key 常量。

---

## 8. Issue 操作 Hooks（useIssueActions 系列）

社区 44（凝聚度 0.22，8个节点）：

```typescript
// 按视图上下文提供 Issue 操作
useProjectIssueActions()    ← 项目列表 Issue 操作
useCycleIssueActions()      ← 迭代内 Issue 操作
useModuleIssueActions()     ← 模块内 Issue 操作
useGlobalIssueActions()     ← 全局 Issue 操作
useArchivedIssueActions()   ← 归档 Issue 操作
useProfileIssueActions()    ← 个人资料页 Issue 操作
useProjectEpicsActions()    ← Epic 操作
```

---

## 9. 菜单项工厂（useMenuItemFactory）

社区 19（Attachment & Notifications）：

```typescript
// 根据上下文动态生成 Issue 右键/操作菜单
useMenuItemFactory();
useIssueActionHandlers();
useAllIssueMenuItems();
useArchivedIssueMenuItems();
useCycleIssueMenuItems();
useModuleIssueMenuItems();
```

---

## 10. 页面（Pages）功能

`web/core/store/pages/base-page.ts`（38 edges）：

- Pages 是 Plane 的内置文档系统
- 基于 TipTap 富文本编辑器
- 支持版本历史（`main-content.tsx` 36 edges）
- 实时协作通过 live service

---

## 阅读建议

1. 从 `web/core/lib/store-context.tsx` 开始 → 理解 MobX 注入方式
2. 读 `web/core/store/` 下任意一个 store → 理解 observable/action 模式
3. 读 `web/core/hooks/store/use-project.ts` → 理解 hooks 封装 store 的模式
4. 读 `web/core/components/issues/issue-layouts/` → 理解多视图切换
5. 读 `web/core/components/issues/peek-overview/` → 理解 Issue 详情侧边栏
