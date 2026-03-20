## 1. 数据模型变更

- [x] 1.1 [UPSTREAM-RISK] 在 `apps/api/plane/db/models/user.py` User 模型末尾添加 `employee_id`、`department`、`team` 三个字段
- [x] 1.2 确认当前最新 migration 编号，生成新 migration：`python manage.py makemigrations db --name add_employee_fields`
- [x] 1.3 执行 `python manage.py migrate` 并验证字段已创建
- [x] 1.4 将 `employee_id`、`department`、`team` 添加至 `User.__str__` 或 `User.REQUIRED_FIELDS` 清单（如需要）

## 2. 登录拦截逻辑

- [x] 2.1 [UPSTREAM-RISK] 在 `apps/api/plane/authentication/views/app/email.py` `SignInAuthEndpoint.post()` 中，email 归一化后插入工号转换逻辑（`re.fullmatch(r"\d{6}", email)`）
- [x] 2.2 [UPSTREAM-RISK] 在 `apps/api/plane/authentication/provider/credentials/email.py` `EmailProvider.set_user_data()` 中同步加入工号转换逻辑（与 2.1 保持一致）
- [x] 2.3 在 `apps/api/plane/authentication/views/app/email.py` `EmailCheckEndpoint`（`/auth/email-check/`）中加入工号转换逻辑
- [x] 2.4 验证：使用工号登录成功；使用邮箱登录成功；6位数字但无对应工号时返回错误码 5060

## 3. 强制改密响应字段

- [x] 3.1 检查 `POST /auth/sign-in/` 的响应体（视图或序列化器），确认是否已包含 `is_password_reset_required` 字段
- [x] 3.2 若缺失，在登录响应构建处补充该字段（返回 User 的 `is_password_reset_required` 布尔值）
- [x] 3.3 验证：预建账号登录后响应体中 `is_password_reset_required: true`；普通账号为 `false`

## 4. Django Admin 配置

- [x] 4.1 在 `apps/api/plane/admin.py`（或新建该文件）中创建 `EmployeeUserAdmin` 类，继承 `UserAdmin`
- [x] 4.2 配置 `list_display`：工号、邮箱、姓名、部门、团队、是否激活、注册时间
- [x] 4.3 配置 `search_fields`：按 `employee_id`、`email`、`display_name` 搜索
- [x] 4.4 配置 `fieldsets`，在编辑表单中加入 `employee_id`、`department`、`team` 字段
- [x] 4.5 实现「停用账号」Admin Action：批量将选中用户 `is_active` 设为 `False`
- [x] 4.6 确认 `apps/api/plane/urls.py` 或主 `urls.py` 已正确挂载 Django Admin（`admin.site.urls`）

## 5. CSV 批量导入

- [x] 5.1 在 `EmployeeUserAdmin` 中实现「导入 CSV」Action（弹出文件上传表单或跳转专用页面）
- [x] 5.2 实现 CSV 解析逻辑：读取 header 行，按列名匹配字段，逐行处理
- [x] 5.3 每行创建 User：密码 = 工号（`set_password(employee_id)`），`is_password_reset_required=True`，`is_active=True`
- [x] 5.4 若 `workspace` 列有值，查找对应 Workspace 并创建 `WorkspaceMember(role=15)`；Workspace 不存在时跳过分配并记录警告
- [x] 5.5 重复 `employee_id` 或 `email` 时跳过该行并记录错误
- [x] 5.6 导入完成后，在 Admin 消息框展示：成功数/跳过数/错误数及错误详情（含 CSV 行号）
- [x] 5.7 验证：导入 5 行含重复数据的 CSV，核对成功/跳过/错误统计正确

## 6. Workspace 批量分配 Action

- [x] 6.1 实现「分配 Workspace」Admin Action：接收 Workspace slug 输入，为选中用户创建 `WorkspaceMember(role=15)`
- [x] 6.2 已是成员的用户跳过，不修改角色
- [x] 6.3 验证：选中 3 个用户（1 个已是成员），执行 Action 后确认结果正确

## 7. 前端：登录页文案

- [x] 7.1 找到登录页邮箱输入框组件，将 `placeholder` 改为「邮箱 / 工号」（或对应的 i18n key）
- [x] 7.2 若有 i18n 配置，同步更新对应的翻译文件

## 8. 前端：强制改密跳转

- [x] 8.1 在登录成功的处理逻辑（auth store 或登录 callback）中，检测响应体 `is_password_reset_required`
- [x] 8.2 若为 `true`，跳转至修改密码页面（`/change-password/` 或现有的密码设置页面）
- [x] 8.3 修改密码成功后，确认 `is_password_reset_required` 被清除（后端已有 `change-password` 端点，确认其会更新该字段）
- [x] 8.4 验证：预建账号登录后自动跳转改密页；修改密码后再次登录不再跳转

## 9. 验收测试

- [x] 9.1 工号登录：用工号 + 初始密码（工号）登录 → 强制跳转改密 → 修改密码 → 正常进入应用
- [x] 9.2 邮箱登录：现有账号用邮箱 + 密码登录，行为不变
- [x] 9.3 错误场景：工号不存在时提示用户不存在；密码错误时提示认证失败
- [x] 9.4 停用账号：Admin 停用账号后，该账号无法登录
- [x] 9.5 CSV 导入：导入含完整字段的 CSV，验证账号创建、Workspace 分配、密码初始化均正确
