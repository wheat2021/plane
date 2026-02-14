# Work Item Types

## 概述

在 Plane 上游基础上实现完整的工作项类型管理系统，支持 Workspace 级类型定义和 Project 级类型配置。工作项可关联类型（如 Task、Requirement、Story、Bug），类型决定图标展示和可用的自定义属性。

## 功能范围

### 1. Workspace 级类型定义

- 预置类型：Task（默认）、Requirement、Story、Bug
- 每个类型具有名称、描述、图标（icon name + color）、层级、默认标记
- Task 类型 `is_default=True`，灰色 circle-check 图标

### 2. 创建工作项时选择类型

- 创建对话框中内嵌类型下拉选择器
- 下拉列表展示项目已启用的类型，含图标和名称
- 默认选中项目默认类型
- 创建时将 `type_id` 写入 Issue

### 3. 类型展示

- 列表视图：Issue 标识符前显示类型图标
- 详情侧边栏：Type 属性行，可通过下拉切换类型
- 快速预览面板：同详情侧边栏
- 无类型的工作项显示 Task 默认图标（灰色）

### 4. 项目级类型配置

- 设置路径：项目设置 → Work Item Types
- 启用/禁用 Workspace 中的类型
- 指定项目默认类型（唯一）
- Task 类型受保护，不可禁用
- 禁用某类型时，该类型下的工作项自动迁移到项目默认类型
- 新项目自动初始化 Task 类型

## 数据模型

### IssueType（Workspace 级）

| 字段        | 类型              | 说明                                          |
| ----------- | ----------------- | --------------------------------------------- |
| id          | UUID              | PK                                            |
| workspace   | FK → Workspace    | 所属工作空间                                  |
| name        | CharField(100)    | 类型名称                                      |
| description | TextField         | 描述                                          |
| logo_props  | JSONField         | `{icon: {name, color}}` 或 `{emoji: {value}}` |
| is_default  | BooleanField      | 是否为默认类型                                |
| is_active   | BooleanField      | 是否激活                                      |
| level       | SmallIntegerField | 排序层级                                      |

### ProjectIssueType（Project 级，M:N 关联）

| 字段       | 类型              | 说明           |
| ---------- | ----------------- | -------------- |
| id         | UUID              | PK             |
| project    | FK → Project      | 所属项目       |
| issue_type | FK → IssueType    | 关联类型       |
| is_default | BooleanField      | 是否为项目默认 |
| level      | SmallIntegerField | 项目内排序     |

### Issue 扩展字段

| 字段 | 类型           | 说明                             |
| ---- | -------------- | -------------------------------- |
| type | FK → IssueType | 工作项类型（nullable, SET_NULL） |

## API 端点

| 方法             | 路径                                                  | 说明                    |
| ---------------- | ----------------------------------------------------- | ----------------------- |
| GET              | `/workspaces/<slug>/issue-types/`                     | 获取 Workspace 所有类型 |
| GET/POST         | `/workspaces/<slug>/projects/<pid>/issue-types/`      | 获取/添加项目类型       |
| GET/PATCH/DELETE | `/workspaces/<slug>/projects/<pid>/issue-types/<id>/` | 项目类型详情/更新/移除  |

## 前端架构

### TypeScript 类型（`packages/types/src/issue-type.ts`）

- `TIssueType` — 完整类型定义
- `TIssueTypeLite` — 轻量版（id, name, logo_props, is_default）
- `TProjectIssueType` — 项目类型关联，内嵌 `issue_type_detail`

### Store（`apps/web/core/store/issue-type.store.ts`）

MobX store，注册于 `root.store.ts`：

- **状态**: `issueTypeMap`, `projectIssueTypeMap`, 各自带 `fetchedMap` 缓存
- **计算属性**: `workspaceIssueTypes`, `getIssueTypeById()`, `getDefaultIssueType()`, `getProjectIssueTypes()`, `getProjectDefaultIssueType()`
- **操作**: `fetchWorkspaceIssueTypes()`, `fetchProjectIssueTypes()`, `addProjectIssueType()`, `updateProjectIssueType()`, `removeProjectIssueType()`

### Service（`apps/web/core/services/issue-type.service.ts`）

Axios 封装，对应上述 API 端点。

### 关键 UI 组件

| 组件                 | 路径                                                     | 用途                           |
| -------------------- | -------------------------------------------------------- | ------------------------------ |
| IssueTypeDropdown    | `core/components/dropdowns/issue-type.tsx`               | 独立类型下拉                   |
| IssueTypeIcon        | `core/components/dropdowns/issue-type-icon.tsx`          | 类型图标渲染                   |
| IssueTypeSelect      | `ce/components/issues/issue-modal/issue-type-select.tsx` | 创建对话框内选择器             |
| ProjectWorkItemTypes | `core/components/project-work-item-types/`               | 项目设置页（root, list, item） |

## 数据库迁移

| 序号 | 文件                               | 内容                                    |
| ---- | ---------------------------------- | --------------------------------------- |
| 0118 | `seed_default_issue_types.py`      | 创建预置类型（Requirement, Story, Bug） |
| 0119 | `add_task_issue_type.py`           | 添加 Task 默认类型                      |
| 0120 | `initialize_project_task_types.py` | 为现有项目初始化 Task 类型              |

## 上游差异

基于 `preview` 分支（截至 2026-02-14）的对比分析。

### 高风险（上游活跃修改 + 深度定制）

| 文件                                      | 你的改动                                  | 上游动态                                            | 冲突点                                     |
| ----------------------------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `apps/api/plane/app/serializers/issue.py` | 新增 type_id 字段 + ProjectIssueType 验证 | WEB-5845: description→description_json 重构（1/22） | 同 serializer class 内的字段和 import 区域 |
| `packages/types/src/issues/issue.ts`      | 新增 type_id                              | WEB-5845: description 重构（1/22）                  | 同 interface 内字段定义                    |

### 中风险（上游可能修改的接入点）

| 文件                                                              | 你的改动                              | 说明                                 |
| ----------------------------------------------------------------- | ------------------------------------- | ------------------------------------ |
| `apps/api/plane/app/serializers/__init__.py`                      | 新增 import                           | 注册入口，上游新增 serializer 时冲突 |
| `apps/api/plane/app/views/__init__.py`                            | 新增 import                           | 同上                                 |
| `apps/api/plane/app/urls/project.py`                              | 新增 issue-types URL                  | 路由追加                             |
| `apps/api/plane/app/urls/workspace.py`                            | 新增 issue-types URL                  | 路由追加                             |
| `apps/api/plane/db/models/__init__.py`                            | 新增 IssueType, ProjectIssueType 导出 | 模型注册                             |
| `apps/api/plane/db/models/issue.py`                               | 新增 type FK                          | WEB-5845 改了 description，不同区域  |
| `apps/web/core/store/root.store.ts`                               | 注册 issueType store                  | 上游 WEB-5537 重命名过此文件         |
| `apps/web/app/routes/core.ts`                                     | 新增设置页路由                        | 路由追加                             |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx`        | 新增 Type 属性行                      | 上游 1 月做了多次 UI 重构            |
| `apps/web/core/components/issues/peek-overview/properties.tsx`    | 新增 Type 属性行                      | 同上                                 |
| `apps/web/ce/components/issues/issue-modal/issue-type-select.tsx` | +261 行重写                           | 上游近期未改，但文件量大             |
| `apps/web/ce/components/issues/issue-modal/provider.tsx`          | 修改状态逻辑                          | 上游近期未改                         |
| `packages/types/src/index.ts`                                     | 新增类型导出                          | 上游频繁追加                         |
| `packages/i18n/src/locales/en/translations.ts`                    | 新增翻译 key                          | 上游持续新增                         |

### 迁移序号

当前无冲突（上游止于 0117）。上游迁移频率约 3 周一次，下次新增将从 0118 起编号，届时需处理 Django 迁移依赖图合并。
