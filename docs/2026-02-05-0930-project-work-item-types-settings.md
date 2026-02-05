# 项目设置 - Work Item Types 功能实现

## 目标

在项目设置（Project Settings）中添加 "Work Item Types" 设置页面，让每个项目可以：

1. 查看工作区级别的工作项类型
2. 为项目启用/禁用特定的工作项类型
3. 设置项目的默认工作项类型

## 实现日期

2026-02-05

## 实现内容

### Phase 1: 后端 API 实现

#### 1.1 创建 ProjectIssueType Serializer

**文件**: `apps/api/plane/app/serializers/issue_type.py`

添加了 `ProjectIssueTypeSerializer` 类，包含嵌套的 `issue_type_detail` 字段用于返回完整的 issue type 信息。

#### 1.2 创建项目级 Issue Types Endpoint

**新文件**: `apps/api/plane/app/views/project/issue_type.py`

创建了两个 endpoint：

- `ProjectIssueTypesEndpoint` - 处理 GET（列表）和 POST（启用类型）
- `ProjectIssueTypeDetailEndpoint` - 处理 PATCH（更新配置）和 DELETE（移除类型）

#### 1.3 注册 URL 路由

**文件**: `apps/api/plane/app/urls/project.py`

添加路由：

- `/api/workspaces/{slug}/projects/{project_id}/issue-types/`
- `/api/workspaces/{slug}/projects/{project_id}/issue-types/{pk}/`

#### 1.4 更新 views **init**.py

**文件**: `apps/api/plane/app/views/__init__.py`

导入新的 endpoint。

### Phase 2: 前端类型和常量

#### 2.1 更新 TypeScript 类型

**文件**: `packages/types/src/issue-type.ts`

添加了 `TProjectIssueType` 类型定义。

**文件**: `packages/types/src/settings.ts`

在 `TProjectSettingsTabs` 中添加了 `"work_item_types"`。

#### 2.2 更新项目设置常量

**文件**: `packages/constants/src/settings/project.ts`

1. 添加 `work_item_types` 到 `PROJECT_SETTINGS`
2. 添加到 `GROUPED_PROJECT_SETTINGS[WORK_STRUCTURE]` 数组

### Phase 3: 前端 Service 和 Store

#### 3.1 扩展 Issue Type Service

**文件**: `apps/web/core/services/issue-type.service.ts`

添加方法：

- `getProjectIssueTypes(workspaceSlug, projectId)`
- `addProjectIssueType(workspaceSlug, projectId, issueTypeId)`
- `updateProjectIssueType(workspaceSlug, projectId, id, data)`
- `removeProjectIssueType(workspaceSlug, projectId, id)`

#### 3.2 扩展 Issue Type Store

**文件**: `apps/web/core/store/issue-type.store.ts`

添加：

- `projectIssueTypeMap` - 存储项目级配置
- `projectFetchedMap` - 跟踪项目级数据加载状态
- `fetchProjectIssueTypes()` - 获取项目配置
- `getProjectIssueTypes()` - 获取项目的 issue types
- `getProjectDefaultIssueType()` - 获取项目默认类型
- CRUD 操作方法

### Phase 4: 前端 UI 组件

#### 4.1 创建设置页面路由

**新目录**: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/work-item-types/`

创建文件：

- `page.tsx` - 主页面组件
- `header.tsx` - 页面头部组件

#### 4.2 创建工作项类型管理组件

**新目录**: `apps/web/core/components/project-work-item-types/`

创建文件：

- `index.ts` - 导出
- `root.tsx` - 主容器组件
- `work-item-type-list.tsx` - 类型列表
- `work-item-type-item.tsx` - 单个类型项（含开关和默认选项）
- `loader.tsx` - 加载状态

#### 4.3 添加侧边栏图标

**文件**: `apps/web/core/components/settings/project/sidebar/item-icon.tsx`

为 `work_item_types` 添加图标映射（使用 `Layers` 图标）。

#### 4.4 添加路由配置

**文件**: `apps/web/app/routes/core.ts`

添加 work-item-types 页面路由。

### Phase 5: 国际化

**文件**: `packages/i18n/src/locales/en/translations.ts`

添加翻译键：

- `project_settings.work_item_types.short_title`
- `project_settings.work_item_types.heading`
- `project_settings.work_item_types.description`
- `project_settings.work_item_types.enabled_success`
- `project_settings.work_item_types.disabled_success`
- `project_settings.work_item_types.default_success`
- `project_settings.work_item_types.set_as_default`
- `project_settings.work_item_types.no_types_available`

## 文件清单

### 修改的文件

| 文件路径                                                          | 修改内容                        |
| ----------------------------------------------------------------- | ------------------------------- |
| `apps/api/plane/app/serializers/issue_type.py`                    | 添加 ProjectIssueTypeSerializer |
| `apps/api/plane/app/serializers/__init__.py`                      | 导出 ProjectIssueTypeSerializer |
| `apps/api/plane/app/urls/project.py`                              | 添加 URL 路由                   |
| `apps/api/plane/app/views/__init__.py`                            | 导入新 endpoint                 |
| `packages/types/src/settings.ts`                                  | 添加 work_item_types 到类型     |
| `packages/types/src/issue-type.ts`                                | 添加 TProjectIssueType 类型     |
| `packages/constants/src/settings/project.ts`                      | 添加设置项配置                  |
| `apps/web/core/services/issue-type.service.ts`                    | 添加项目级 API 方法             |
| `apps/web/core/store/issue-type.store.ts`                         | 添加项目级状态管理              |
| `apps/web/core/components/settings/project/sidebar/item-icon.tsx` | 添加图标                        |
| `packages/i18n/src/locales/en/translations.ts`                    | 添加翻译                        |
| `apps/web/app/routes/core.ts`                                     | 添加页面路由                    |

### 新建的文件

| 文件路径                                                                   | 用途              |
| -------------------------------------------------------------------------- | ----------------- |
| `apps/api/plane/app/views/project/issue_type.py`                           | 后端 API endpoint |
| `apps/web/app/.../work-item-types/page.tsx`                                | 设置页面          |
| `apps/web/app/.../work-item-types/header.tsx`                              | 页面头部          |
| `apps/web/core/components/project-work-item-types/index.ts`                | 组件导出          |
| `apps/web/core/components/project-work-item-types/root.tsx`                | 主组件            |
| `apps/web/core/components/project-work-item-types/work-item-type-list.tsx` | 列表组件          |
| `apps/web/core/components/project-work-item-types/work-item-type-item.tsx` | 列表项组件        |
| `apps/web/core/components/project-work-item-types/loader.tsx`              | 加载组件          |

## 验证方案

1. **后端测试**：使用 API 客户端测试 CRUD 接口

   ```bash
   # 获取项目工作项类型
   curl http://localhost:8000/api/workspaces/{slug}/projects/{id}/issue-types/
   ```

2. **前端测试**：
   - 访问项目设置页面，确认侧边栏显示 "Work Item Types"
   - 点击进入页面，确认显示工作区的工作项类型列表
   - 测试启用/禁用功能
   - 测试设置默认类型功能

3. **类型检查**：`pnpm check:types` ✅ 通过

## 总结

成功实现了项目级工作项类型管理功能，包括：

- 完整的后端 API（CRUD 操作）
- 前端状态管理和服务层
- 设置页面 UI 组件
- 国际化支持
