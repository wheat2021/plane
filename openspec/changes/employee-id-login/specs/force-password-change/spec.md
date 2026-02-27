## ADDED Requirements

### Requirement: 预建账号强制改密

管理员预建的员工账号 SHALL 在首次登录时强制要求修改密码。

#### Scenario: 预建账号初始密码设置

- **WHEN** 管理员通过 Django Admin 单个创建或 CSV 批量导入员工账号
- **THEN** 系统 SHALL 将初始密码设置为该用户的 `employee_id`（工号字符串）
- **THEN** 系统 SHALL 将 `is_password_reset_required` 设为 `True`

#### Scenario: 首次登录触发强制改密

- **WHEN** 用户（工号或邮箱）登录成功
- **WHEN** 该用户的 `is_password_reset_required=True`
- **THEN** 系统 SHALL 在登录响应中包含 `is_password_reset_required: true` 标志
- **THEN** 前端 SHALL 检测该标志并跳转至修改密码页面
- **THEN** 用户 SHALL NOT 能够绕过改密步骤直接访问应用主页

#### Scenario: 修改密码后标志清除

- **WHEN** 用户在强制改密页面成功提交新密码
- **THEN** 系统 SHALL 将 `is_password_reset_required` 更新为 `False`
- **THEN** 后续登录 SHALL 不再触发强制改密流程

#### Scenario: 密码强度要求

- **WHEN** 用户在强制改密页面提交新密码
- **THEN** 新密码 SHALL 满足现有密码强度要求（zxcvbn score >= 3）
- **THEN** 新密码 SHALL NOT 与工号相同（防止用户不修改直接确认）

### Requirement: 登录响应包含改密标志

`POST /auth/sign-in/` 的成功响应 SHALL 包含 `is_password_reset_required` 字段，供前端判断是否需要跳转。

#### Scenario: 响应字段存在性

- **WHEN** 任意用户成功登录
- **THEN** 响应体 SHALL 包含布尔字段 `is_password_reset_required`
- **WHEN** `is_password_reset_required=False`
- **THEN** 前端 SHALL 执行正常登录后跳转
- **WHEN** `is_password_reset_required=True`
- **THEN** 前端 SHALL 跳转改密页面而非应用主页
