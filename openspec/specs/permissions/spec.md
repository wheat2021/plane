# 权限体系 Spec

> 描述 Plane 当前权限体系的能力边界与行为约定。
> 本文件是参考文档，不描述变更，仅记录现状与使用约束。

---

## 概述

Plane 采用基于角色的访问控制（RBAC），分为两个独立层级：**Workspace** 和 **Project**。每个层级有三个固定角色，角色之间通过数值大小比较权限高低。不支持自定义权限或细粒度 ACL。

### 角色定义

| 角色   | 数值 | 适用层级            |
| ------ | ---- | ------------------- |
| Admin  | 20   | Workspace / Project |
| Member | 15   | Workspace / Project |
| Guest  | 5    | Workspace / Project |

数值越高代表权限越高，权限检查使用数值比较（`>=`）。

---

## Workspace 层权限

### Requirement: Workspace 角色能力

#### Scenario: Workspace Admin 能力

- **WHEN** 用户持有 Workspace Admin 角色
- **THEN** 该用户 SHALL 能够管理所有 Workspace 成员（邀请、修改角色、移除）
- **THEN** 该用户 SHALL 能够修改所有 Workspace 设置（包括 billing、webhooks、extra properties）
- **THEN** 该用户 SHALL 自动拥有所有 Project 的 Admin 权限（无需单独添加为项目成员）
- **THEN** 该用户 SHALL 能够创建、归档、删除任何 Project

#### Scenario: Workspace Member 能力

- **WHEN** 用户持有 Workspace Member 角色
- **THEN** 该用户 SHALL 能够修改 Project（设置、成员管理等，须持有对应 Project 的 Admin 角色）
- **THEN** 该用户 SHALL 能够查看 Analytics 和 Archives
- **THEN** 该用户 SHALL NOT 能够创建 Project
- **THEN** 该用户 SHALL NOT 能够归档或恢复归档 Project
- **THEN** 该用户 SHALL NOT 能够修改 billing、webhooks 等敏感 Workspace 设置
- **THEN** 该用户 SHALL NOT 能够修改其他成员的 Workspace 角色

#### Scenario: Workspace Guest 能力

- **WHEN** 用户持有 Workspace Guest 角色
- **THEN** 该用户 SHALL 只能只读访问被明确授权的 Project 内容
- **THEN** 该用户 SHALL NOT 能够创建 Project
- **THEN** 该用户 SHALL NOT 能够查看 Analytics 或 Archives
- **THEN** 该用户 SHALL NOT 能够修改任何 Workspace 配置

### Requirement: Workspace 导航可见性

| 导航项    | Admin | Member | Guest |
| --------- | :---: | :----: | :---: |
| Home      |   ✓   |   ✓    |   ✓   |
| Projects  |   ✓   |   ✓    |   ✓   |
| Views     |   ✓   |   ✓    |   ✓   |
| Inbox     |   ✓   |   ✓    |   ✓   |
| Analytics |   ✓   |   ✓    |   ✗   |
| Archives  |   ✓   |   ✓    |   ✗   |
| Your Work |   ✓   |   ✓    |   ✗   |

### Requirement: Workspace 设置访问权限

| 设置项           | Admin | Member | Guest |
| ---------------- | :---: | :----: | :---: |
| General          |   ✓   |   ✓    |   ✗   |
| Members          |   ✓   |   ✓    |   ✗   |
| Export           |   ✓   |   ✓    |   ✗   |
| Billing & Plans  |   ✓   |   ✗    |   ✗   |
| Webhooks         |   ✓   |   ✗    |   ✗   |
| Extra Properties |   ✓   |   ✗    |   ✗   |

---

## Project 层权限

### Requirement: Project 角色能力

#### Scenario: Project Admin 能力

- **WHEN** 用户持有某 Project 的 Admin 角色
- **THEN** 该用户 SHALL 能够管理该 Project 的所有成员（添加、修改角色、移除）
- **THEN** 该用户 SHALL 能够修改 Project 设置（名称、标识符、网络、成员访问等）
- **THEN** 该用户 SHALL 能够创建、编辑、删除所有工作项
- **THEN** 该用户 SHALL 能够归档或删除 Project

#### Scenario: Project Member 能力

- **WHEN** 用户持有某 Project 的 Member 角色
- **THEN** 该用户 SHALL 能够创建和编辑工作项
- **THEN** 该用户 SHALL 能够创建和编辑 Pages
- **THEN** 该用户 SHALL 能够评论和参与讨论
- **THEN** 该用户 SHALL NOT 能够修改 Project 设置
- **THEN** 该用户 SHALL NOT 能够管理其他 Project 成员

#### Scenario: Project Guest 能力

- **WHEN** 用户持有某 Project 的 Guest 角色
- **THEN** 该用户 SHALL 只能只读访问工作项和 Pages
- **THEN** 该用户 SHALL NOT 能够创建或修改任何项目内容
- **THEN** 该用户 SHALL NOT 能够管理成员或修改设置

---

## 跨层继承规则

### Requirement: Workspace Admin 自动提权

#### Scenario: Workspace Admin 访问项目

- **WHEN** 用户持有 Workspace Admin 角色
- **AND** 该用户是某 Project 的成员（无论 Project 角色是什么）或尚未加入该 Project
- **THEN** 后端权限检查 SHALL 视其为该 Project 的 Admin
- **THEN** 前端 `getProjectRoleByWorkspaceSlugAndProjectId()` SHALL 返回 Admin（值 20）

### Requirement: Workspace Guest 角色上限

#### Scenario: Guest 不可被提升

- **WHEN** 用户的 Workspace 角色为 Guest
- **THEN** 该用户在所有 Project 中的角色 SHALL NOT 超过 Guest（5）
- **THEN** 尝试将该用户添加为 Project Member 或 Admin 的 API 请求 SHALL 返回错误

### Requirement: Workspace Admin 角色下限

#### Scenario: Admin 不可被降级

- **WHEN** 用户的 Workspace 角色为 Admin
- **THEN** 尝试将该用户在 Project 中设置为低于其 Workspace 角色的 API 请求 SHALL 返回错误

### Requirement: Guest 降级传播

#### Scenario: 将成员降为 Workspace Guest

- **WHEN** 管理员将某成员的 Workspace 角色修改为 Guest
- **THEN** 系统 SHALL 自动将该成员在所有 Project 中的角色同步更新为 Guest（5）

---

## 技术实现

### 后端

```
apps/api/plane/db/models/
  workspace.py       → WorkspaceMember, WorkspaceMemberInvite
  project.py         → ProjectMember, ProjectMemberInvite

apps/api/plane/app/permissions/
  base.py            → allow_permission() 装饰器，核心权限判断逻辑
  workspace.py       → WorkSpaceBasePermission, WorkspaceOwnerPermission,
                        WorkSpaceAdminPermission, WorkspaceEntityPermission
  project.py         → ProjectBasePermission, ProjectAdminPermission,
                        ProjectLitePermission
  page.py            → ProjectPagePermission（Pages 专用特殊逻辑）
```

**装饰器用法**：

```python
@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
def my_view(self, request, slug, project_id):
    ...
```

### 前端

```
packages/types/src/
  enums.ts           → EUserPermissions, EUserWorkspaceRoles, EUserProjectRoles

packages/constants/src/
  user.ts            → EUserPermissionsLevel（WORKSPACE / PROJECT）
  settings/workspace.ts → 各设置页和导航的权限配置表

apps/web/core/store/user/
  base-permissions.store.ts → 权限 Store 基类，allowPermissions() 方法

apps/web/core/hooks/store/user/
  user-permissions.ts → useUserPermissions() hook
```

**Hook 用法**：

```typescript
const { allowPermissions } = useUserPermissions();

const canEdit = allowPermissions(
  [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  EUserPermissionsLevel.PROJECT,
  workspaceSlug,
  projectId
);
```

---

## 使用约束（本项目适用）

本项目仅使用单一 Workspace，权限管理以 Project 为主要粒度。

| 约束                           | 说明                                                  |
| ------------------------------ | ----------------------------------------------------- |
| 单 Workspace                   | 无需考虑跨 Workspace 权限复杂度                       |
| Project 级别权限足够           | Admin / Member / Guest 三级满足当前所有访问控制需求   |
| 无需自定义权限                 | 不引入 ACL 或细粒度权限扩展                           |
| Workspace Admin = 超级管理员   | 用于系统管理员账号，自动拥有所有 Project 的完整权限   |
| 新功能默认需 Member 及以上权限 | 除明确只读场景外，功能开发的权限门槛使用 Member（15） |

---

## 数据模型摘要

```
WorkspaceMember
  workspace  FK → Workspace
  member     FK → User
  role       Int (5 / 15 / 20)
  is_active  Bool
  unique_together: (workspace, member, deleted_at)

ProjectMember
  project    FK → Project
  workspace  FK → Workspace
  member     FK → User
  role       Int (5 / 15 / 20)
  is_active  Bool
  unique_together: (project, member, deleted_at)
```
