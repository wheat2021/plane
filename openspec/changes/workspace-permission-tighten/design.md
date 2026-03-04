## Context

本变更针对内部部署场景，收紧 Workspace Member 在两个特定操作上的权限：

- **创建 Project**：当前后端 `ProjectViewSet.create()` 使用 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`，前端 `canCreateProject` 同样包含 MEMBER
- **归档/恢复 Project**：当前 `ProjectArchiveUnarchiveEndpoint.post/delete()` 使用 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`（Project 层级），无前端权限守卫

Plane 的权限系统采用两层 RBAC（Workspace / Project），核心实现：

- 后端：`allow_permission()` 装饰器（`apps/api/plane/app/permissions/base.py`），`level="WORKSPACE"` 检查 WorkspaceMember，默认检查 ProjectMember
- 前端：`allowPermissions()` hook（`apps/web/core/store/user/base-permissions.store.ts`），搭配 `EUserPermissionsLevel` 常量

上游冲突风险：`apps/api/plane/app/views/project/base.py` 是核心视图文件，上游可能修改；前端组件文件风险较低。

## Goals / Non-Goals

**Goals:**

- 将「创建 Project」操作的 Workspace 层权限从 `[ADMIN, MEMBER]` 收紧为 `[ADMIN]`
- 将「归档 Project」和「恢复归档 Project」从 Project 层 `[ADMIN, MEMBER]` 提升为 Workspace 层 `[ADMIN]`
- 前后端同步收紧，确保 UI 入口与 API 权限一致
- 保留现有 `permissions` spec，通过 delta spec 记录变更

**Non-Goals:**

- 不修改邀请 Workspace 成员、数据导出等其他权限
- 不引入新角色或自定义 ACL
- 不修改 Project 层级的其他操作权限（Issue 创建/编辑等）
- 不修改 `WorkSpaceAdminPermission` 类（历史命名问题，范围外）

## Decisions

### 决策 1：归档操作从 Project 层提升至 Workspace 层

**现状**：归档/恢复使用 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`，默认是 Project 层，Project Admin 和 Member 均可归档自己所在的 Project。

**决策**：改为 `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`，将归档权限提升到 Workspace 层并只允许 Workspace Admin。

**理由**：归档是组织结构管理行为，影响整个团队对项目的可见性，不应由项目内部成员自主决定。将权限层级提升到 Workspace 与「归档 = 组织管理」的语义一致，且避免了 Project Admin 绕过 Workspace 管控的漏洞。

**备选方案**：仅限制为 Project Admin（去掉 MEMBER），但仍留有 Project Admin 可以自行归档的问题，不满足需求。

### 决策 2：前端同步添加权限守卫

**现状**：`control-section.tsx` 中的 Archive 按钮无权限检查，所有 Project 成员可见（后端会拦截，但 UI 体验差）。

**决策**：在 Archive 按钮处添加 `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug)` 守卫，非 Workspace Admin 不显示按钮。

**备选方案**：仅依赖后端拦截，不修改前端。但会导致用户看到按钮却无法操作，体验混乱。

### 决策 3：不修改 `workspace-menu-header.tsx` 新建入口（需要调查）

需确认 workspace sidebar 中是否存在「新建 Project」按钮，以及其权限控制方式。若使用与 `canCreateProject` 相同的 hook，则同步更新；若独立控制，需单独处理。

## Risks / Trade-offs

**[风险 1] 上游冲突**
→ 缓解：`base.py` 变更最小（仅修改两处 `allow_permission` 的参数），Rebase 时冲突范围有限。变更完成后在 delta spec 中记录，便于后续 Rebase 时快速定位。

**[风险 2] Workspace Admin 自动提权机制**
→ Plane 权限模型中，Workspace Admin 在 Project 层被视为 Project Admin（后端 `allow_permission` 中有特殊处理）。本次将归档权限改为 `level="WORKSPACE"` + `[ROLE.ADMIN]`，不依赖 Project 层的自动提权，逻辑更清晰，无兼容问题。

**[风险 3] 存量数据：Project Admin 已归档的 Project**
→ 本次变更仅影响「未来」的归档/恢复操作，存量已归档 Project 不受影响，无需数据迁移。

**[权衡] Member 体验影响**
→ Member 将无法自主创建或归档 Project，需要联系 Workspace Admin 操作。对内部部署企业场景这是期望行为；对小团队或自由使用场景可能感知不便。当前仅针对本项目内部部署，可接受。

## Migration Plan

1. **后端**：修改 `apps/api/plane/app/views/project/base.py` 中三个装饰器参数
2. **前端**：
   - 修改 `no-projects.tsx` 中的 `canCreateProject` hook 调用
   - 在 `control-section.tsx` Archive 按钮处添加权限守卫
   - 调查并修改 workspace sidebar 中的新建 Project 入口（如有）
3. **无数据库迁移**：纯权限逻辑变更，不涉及 model 变动
4. **回滚**：还原上述文件的对应行即可，无副作用

## Open Questions

1. `apps/web/core/components/workspace/sidebar/workspace-menu-header.tsx` 中是否有「新建 Project」入口，权限控制方式是否与 `no-projects.tsx` 一致？（需在实施前确认）
2. 是否还有其他前端入口（如 Projects 列表页的「+ 新建」按钮）使用 MEMBER 权限守卫创建 Project？（需要全局搜索）
