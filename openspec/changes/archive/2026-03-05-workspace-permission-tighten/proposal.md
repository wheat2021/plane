# Proposal: workspace-permission-tighten

## Why

内部部署场景下，Project 的创建和归档属于 **组织结构管理** 行为，不应由普通员工（Workspace Member）自行操作，否则会导致项目体系混乱，治理失控。当前 Member 和 Admin 均可创建和归档 Project，与公司内部管控需求不符。

## What Changes

- **创建 Project**：将权限从「Workspace Admin + Member 均可」收紧为「仅 Workspace Admin 可创建」
- **归档 Project**：将权限从「Project 级别 Admin/Member 均可触发」收紧为「仅 Workspace Admin 可归档」
- **恢复归档 Project**：与归档保持一致，同步收紧为仅 Workspace Admin 可操作
- **保持不变**：邀请 Workspace 成员、数据导出（Export）、其他所有权限不做调整

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `permissions`：Workspace Member 的能力范围变更——移除「创建 Project」和「归档 Project」权限；Project Admin/Member 角色不再拥有归档自身 Project 的权限（归档操作提升为 Workspace Admin 专属）

## Impact

**后端**

| 文件                                       | 变更                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/plane/app/views/project/base.py` | `ProjectViewSet.create()` 的 `allow_permission` 从 `[ROLE.ADMIN, ROLE.MEMBER]` 改为 `[ROLE.ADMIN]`（workspace 级别）           |
| `apps/api/plane/app/views/project/base.py` | `ProjectArchiveUnarchiveEndpoint.post/delete()` 从 project 级别 `[ROLE.ADMIN, ROLE.MEMBER]` 改为 workspace 级别 `[ROLE.ADMIN]` |

**前端**

| 文件                                                                              | 变更                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web/core/components/home/widgets/empty-states/no-projects.tsx`              | `canCreateProject` 从 `[ADMIN, MEMBER]` 改为 `[ADMIN]` |
| `apps/web/core/components/project/settings/control-section.tsx`                   | Archive 按钮增加 Workspace Admin 权限守卫              |
| `apps/web/core/components/workspace/sidebar/workspace-menu-header.tsx` 等新建入口 | 创建 Project 的触发入口同步收紧                        |

**上游冲突风险**

| 文件                                                                 | 风险等级 | 说明                       |
| -------------------------------------------------------------------- | -------- | -------------------------- |
| `apps/api/plane/app/views/project/base.py`                           | 中       | 核心视图文件，上游可能修改 |
| `apps/web/core/components/project/settings/control-section.tsx`      | 低       | 小组件，变更少             |
| `apps/web/core/components/home/widgets/empty-states/no-projects.tsx` | 低       | 上游改动概率低             |
