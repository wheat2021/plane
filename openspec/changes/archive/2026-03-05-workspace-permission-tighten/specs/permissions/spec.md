## MODIFIED Requirements

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
