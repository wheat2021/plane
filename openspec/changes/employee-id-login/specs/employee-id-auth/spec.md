## ADDED Requirements

### Requirement: 工号登录转换

系统 SHALL 在登录认证流程中识别 6 位纯数字输入为工号，并自动转换为对应邮箱后继续认证。

#### Scenario: 工号输入成功转换

- **WHEN** 用户在登录表单的邮箱字段输入 6 位纯数字字符串（如 `123456`）
- **WHEN** 系统中存在 `employee_id` 等于该字符串的用户
- **THEN** 系统 SHALL 取该用户的 `email` 字段值，替换输入值继续后续密码校验流程
- **THEN** 后续流程 SHALL 与直接输入邮箱的行为完全一致

#### Scenario: 工号不存在时的回退行为

- **WHEN** 用户输入 6 位纯数字字符串
- **WHEN** 系统中不存在对应 `employee_id` 的用户
- **THEN** 系统 SHALL 将该字符串作为 email 值继续处理
- **THEN** 后续 User 查找将因 email 不匹配而返回「用户不存在」错误（错误码 5060）

#### Scenario: 邮箱输入不受影响

- **WHEN** 用户输入包含 `@` 的字符串（标准邮箱格式）
- **THEN** 系统 SHALL 跳过工号转换逻辑，直接使用该邮箱进行认证
- **THEN** 现有邮箱认证行为 SHALL 保持不变

#### Scenario: 非工号非邮箱输入

- **WHEN** 用户输入既不符合 `^\d{6}$` 格式也不含 `@`（如 `abc123`、`12345`）
- **THEN** 系统 SHALL 跳过工号转换逻辑，直接使用该输入继续
- **THEN** 后续因 email 不匹配返回「用户不存在」错误

### Requirement: EmailCheck 端点支持工号

系统 SHALL 在 `/auth/email-check/` 端点同样支持工号输入转换，保证前端登录方式检测与实际登录流程一致。

#### Scenario: 工号 EmailCheck 正确返回用户状态

- **WHEN** 前端调用 `POST /auth/email-check/` 并传入 6 位数字工号
- **WHEN** 系统中存在对应 `employee_id` 的用户
- **THEN** 系统 SHALL 转换为对应邮箱后执行查找
- **THEN** 响应 `existing` 字段 SHALL 返回 `true`
- **THEN** 响应 `status` 字段 SHALL 与该邮箱账号实际配置的登录方式一致

### Requirement: 工号格式定义

系统识别工号的格式规则 SHALL 为：正则 `^\d{6}$`，即恰好 6 位 ASCII 数字字符，不允许前导/后缀空格（在归一化 strip 后匹配）。

#### Scenario: 格式边界验证

- **WHEN** 输入为 5 位数字（如 `12345`）
- **THEN** 系统 SHALL NOT 触发工号转换逻辑

- **WHEN** 输入为 7 位数字（如 `1234567`）
- **THEN** 系统 SHALL NOT 触发工号转换逻辑

- **WHEN** 输入为 6 位含非数字字符（如 `12345a`）
- **THEN** 系统 SHALL NOT 触发工号转换逻辑
