# 03 · Space App 架构

> **路径**: `apps/space/`  
> **技术栈**: TypeScript · React · React Router (SSR 模式) · MobX  
> **节点规模**: 300 nodes  
> **端口**: 3002

---

## 1. 定位与职责

Space App 是 Plane 的**公开访问层**，允许：

- 外部访问已发布（Published）的项目 Issue 列表
- 嵌入式 Issue 展示（`/issues/[anchor]`）
- 无需登录浏览发布的工作项

与 web app 不同，space 面向**未认证或低权限用户**，因此功能更简单，UI 更纯净。

---

## 2. 目录结构

```
apps/space/
├── app/                    # 路由层
│   ├── [workspaceSlug]/    # 工作区路由
│   │   └── [projectId]/    # 项目路由（page.tsx，179 edges）
│   ├── issues/             # Issue 展示路由
│   │   └── [anchor]/       # 锚点页（发布页面入口）
│   │       └── layout.tsx  # 布局（76 edges）
│   └── compat/next/        # Next.js 兼容层
│       ├── navigation.ts   # 路由导航（225 edges，最高！）
│       └── helper.ts       # 辅助函数（84 edges）
├── core/                   # 核心层（共享逻辑）
│   ├── components/         # UI 组件
│   │   ├── issues/         # Issue 组件
│   │   │   ├── issue-layouts/
│   │   │   │   └── utils.tsx   ← 478 edges（全项目最高！）
│   │   │   └── peek-overview/
│   │   │       └── header.tsx  ← 114 edges
│   │   └── editor/embeds/mentions/
│   │       ├── root.tsx    ← 355 edges（第2高！）
│   │       └── user.tsx    ← 203 edges
│   ├── store/              # MobX store
│   │   ├── helpers/
│   │   │   └── base-issues.store.ts ← 53 edges
│   │   ├── issue.store.ts  ← 27 edges
│   │   └── root.store.ts   ← 91 edges（空间Store根）
│   ├── hooks/store/        # Store hooks
│   │   ├── use-member.ts   ← 74 edges
│   │   ├── use-cycle.ts    ← 40 edges
│   │   ├── use-module.ts   ← 38 edges
│   │   └── use-label.ts    ← 30 edges
│   └── lib/
│       └── store-provider.tsx ← 20 edges
└── ce/                     # CE 扩展层
    ├── store/              # CE Store 扩展
    │   └── root.store.ts   ← 91 edges
    ├── hooks/store/
    │   └── index.ts        ← 97 edges（Store hooks 入口）
    └── components/editor/embeds/mentions/
        └── root.tsx        ← 编辑器@提及根组件
```

---

## 3. 为何 utils.tsx 有 478 edges（全项目最高）？

`space/core/components/issues/issue-layouts/utils.tsx` 是 Issue 布局的**工具函数集中地**：

- 定义了所有布局视图（列表/看板/表格/日历）共用的工具函数
- 被每个 Issue 布局组件 import
- 同时被 web app 复用（space↔web 共享 1952 边的主要原因之一）

---

## 4. 为何 mentions/root.tsx 有 355 edges？

`space/ce/components/editor/embeds/mentions/root.tsx`：

- 是富文本编辑器中 **@用户提及** 功能的根组件
- 被所有包含编辑器的组件（Issue 描述、评论、Page 等）引用
- `user.tsx` (203 edges) 负责渲染单个用户 mention 显示

---

## 5. Store 架构（精简版 MobX）

```
space/ce/store/root.store.ts（91 edges）
  ├── ProjectStore
  ├── IssueStore
  │   └── base-issues.store.ts  ← CRUD 基础操作
  ├── MemberStore
  ├── CycleStore
  ├── ModuleStore
  ├── LabelStore
  └── InstanceStore
```

Space 的 Store 比 web 精简得多，因为功能子集更小。

---

## 6. Next.js 兼容层

由于项目从 Next.js 迁移到 React Router，space 保留了一个兼容层：

```typescript
// app/compat/next/navigation.ts（225 edges）
// 模拟 next/navigation 的接口
export const useRouter = () => useReactRouter();
export const useParams = () => useReactRouterParams();
export const useSearchParams = () => ...;
```

这个文件连接数极高（225边），因为整个 space 的旧代码都 `import from 'next/navigation'`，统一被重定向到此兼容模块。

---

## 7. 与 web app 的代码共享

Space 与 Web 共享 1952 条图谱边，主要来自：

| 共享内容                                 | 共享方向           |
| ---------------------------------------- | ------------------ |
| Issue 布局工具（utils.tsx）              | space → web        |
| 编辑器 @提及组件                         | space → web        |
| Issue 布局组件（list/board/spreadsheet） | space ↔ web        |
| @plane/ui 组件库                         | 通过 packages 共享 |
| @plane/types 类型                        | 通过 packages 共享 |

---

## 8. 与 API 的交互

Space 通过 API 端点的 `/space/` 路由访问数据：

- `api/plane/space/views/issue.py`（IssueCommentPublicViewSet 等）
- 这些视图允许未认证或低权限访问已发布项目

---

## 阅读建议

1. 从 `space/ce/store/root.store.ts` 开始 → 理解 Space 的数据结构
2. 读 `space/app/issues/[anchor]/layout.tsx` → 理解公开页面入口
3. 读 `space/core/components/issues/issue-layouts/utils.tsx` → 理解高度复用的布局工具
4. 读 `space/app/compat/next/navigation.ts` → 理解 Next.js 迁移策略
