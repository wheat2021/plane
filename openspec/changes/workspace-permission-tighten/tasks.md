## 1. 提交变更文档

- [ ] 1.1 提交 OpenSpec 变更文档（proposal.md、design.md、specs/permissions/spec.md、tasks.md）

## 2. 后端权限收紧 [UPSTREAM-RISK]

- [x] 2.1 修改 `apps/api/plane/app/views/project/base.py`：将 `ProjectViewSet.create()` 的 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` 改为 `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`
- [x] 2.2 修改 `apps/api/plane/app/views/project/base.py`：将 `ProjectArchiveUnarchiveEndpoint.post()` 的 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` 改为 `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`
- [x] 2.3 修改 `apps/api/plane/app/views/project/base.py`：将 `ProjectArchiveUnarchiveEndpoint.delete()` 的 `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` 改为 `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`

## 3. 前端权限收紧

- [x] 3.1 修改 `apps/web/core/components/home/widgets/empty-states/no-projects.tsx`：将 `canCreateProject` 的 `allowPermissions` 调用从 `[EUserPermissions.ADMIN, EUserPermissions.MEMBER]` 改为 `[EUserPermissions.ADMIN]`
- [x] 3.2 修改 `apps/web/core/components/project/settings/control-section.tsx`：在 Archive Project 按钮处添加 `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug)` 权限守卫
- [x] 3.3 搜索 workspace sidebar 中的「新建 Project」入口（`workspace-menu-header.tsx` 等），确认并同步收紧权限（实际修改：`projects-list.tsx` 中 `isAuthorizedUser` 从 ADMIN+MEMBER 收紧为 ADMIN）

## 4. 提交代码

- [ ] 4.1 提交后端权限变更（commit 信息：`#FICC-9999# fix(permissions): 收紧 Project 创建权限，仅允许 Workspace Admin 操作`）
- [ ] 4.2 提交前端权限变更（commit 信息：`#FICC-9999# fix(permissions): 收紧前端 Project 创建和归档权限守卫`）

## 5. 用户验证

- [ ] 5.1 以 Workspace Member 账号登录，验证「新建 Project」按钮不可见
- [ ] 5.2 以 Workspace Member 账号调用 POST `/api/v1/{slug}/projects/` 接口，验证返回 403 Forbidden
- [ ] 5.3 以 Workspace Member 账号进入某 Project，验证 Archive 按钮不显示
- [ ] 5.4 以 Workspace Member 账号调用 POST `/api/v1/{slug}/projects/{id}/archive/` 接口，验证返回 403 Forbidden
- [ ] 5.5 以 Workspace Admin 账号登录，验证「新建 Project」、Archive 按钮均正常可见且可操作
