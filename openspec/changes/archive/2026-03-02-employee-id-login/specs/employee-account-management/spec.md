## ADDED Requirements

### Requirement: 员工账号字段扩展

User 模型 SHALL 包含以下组织专属字段：

| 字段          | 类型           | 约束                   | 说明             |
| ------------- | -------------- | ---------------------- | ---------------- |
| `employee_id` | CharField(6)   | unique, null, db_index | 6位数字工号      |
| `department`  | CharField(255) | null, blank            | 所属部门（文本） |
| `team`        | CharField(255) | null, blank            | 所属团队（文本） |

#### Scenario: employee_id 唯一性约束

- **WHEN** 管理员尝试创建或导入 `employee_id` 与已有用户重复的账号
- **THEN** 系统 SHALL 拒绝创建并返回唯一性错误
- **THEN** 现有账号数据 SHALL 保持不变

#### Scenario: 可选字段为空

- **WHEN** 创建用户时未提供 `department` 或 `team`
- **THEN** 系统 SHALL 允许这些字段为空，不影响账号创建

### Requirement: Django Admin 单个账号管理

管理员 SHALL 能够通过 Django Admin 界面完成单个员工账号的增删改查。

#### Scenario: 创建单个账号

- **WHEN** 管理员在 Django Admin 填写员工表单并提交
- **WHEN** 表单包含必填字段：`employee_id`、`email`、`display_name`
- **THEN** 系统 SHALL 创建用户账号，密码设为工号值，`is_password_reset_required=True`，`is_active=True`

#### Scenario: 停用账号

- **WHEN** 管理员在 Django Admin 对选中的用户执行「停用」操作
- **THEN** 系统 SHALL 将这些用户的 `is_active` 设为 `False`
- **THEN** 用户数据（工作项、评论等关联记录）SHALL 保留不删除
- **THEN** 被停用的账号 SHALL 无法登录

#### Scenario: Admin 用户列表展示

- **WHEN** 管理员访问用户列表页
- **THEN** 列表 SHALL 至少展示：工号、邮箱、姓名、部门、团队、是否激活
- **THEN** 管理员 SHALL 能够按工号、邮箱、姓名进行搜索

### Requirement: CSV 批量导入

管理员 SHALL 能够通过上传 CSV 文件批量创建员工账号。

#### Scenario: CSV 格式规范

- **WHEN** 管理员上传 CSV 文件
- **THEN** 系统 SHALL 接受如下列顺序（首行为 header）：
  `employee_id, email, display_name, department, team, workspace`
- **THEN** `employee_id`、`email`、`display_name` 为必填列，其余可为空

#### Scenario: 批量导入成功

- **WHEN** CSV 中的行数据格式正确且无冲突
- **THEN** 系统 SHALL 为每行创建用户账号，密码 = 工号，`is_password_reset_required=True`
- **WHEN** 该行 `workspace` 列有值且对应 Workspace 存在
- **THEN** 系统 SHALL 同时创建 `WorkspaceMember` 记录，角色为 Member（role=15）

#### Scenario: 重复数据跳过

- **WHEN** CSV 中某行的 `employee_id` 或 `email` 已存在于数据库
- **THEN** 系统 SHALL 跳过该行，不修改已有账号
- **THEN** 跳过的行 SHALL 记录在导入结果报告中

#### Scenario: 导入结果反馈

- **WHEN** 导入操作完成
- **THEN** 系统 SHALL 在 Admin 页面展示：成功创建数量、跳过数量、错误数量及错误详情（含行号）

#### Scenario: Workspace slug 不存在

- **WHEN** CSV 某行 `workspace` 列的值在数据库中无对应 Workspace
- **THEN** 系统 SHALL 仍创建用户账号
- **THEN** 系统 SHALL 跳过该行的 Workspace 分配，并在错误报告中注明「Workspace 不存在」

### Requirement: Workspace 批量分配

管理员 SHALL 能够在 Django Admin 中选中用户并批量分配到指定 Workspace。

#### Scenario: 批量分配 Workspace

- **WHEN** 管理员选中若干用户，执行「分配 Workspace」Action
- **WHEN** 管理员输入目标 Workspace slug 并确认
- **THEN** 系统 SHALL 为每个尚未加入该 Workspace 的用户创建 `WorkspaceMember` 记录，角色为 Member
- **WHEN** 用户已是该 Workspace 成员
- **THEN** 系统 SHALL 跳过该用户，不修改其现有角色

#### CSV Import Data Columns

: 6 digits. string
: email address
: user's full name
: department string (optional)
: team string (optional)
: Workspace Slug (optional)
