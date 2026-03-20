## Why

组织内部所有系统均以 6 位数字工号作为用户标识，员工习惯用工号登录。Plane 当前仅支持邮箱登录，且工号与邮箱的对应关系不规律，无法通过简单拼接转换。需要在保留邮箱登录的同时，支持工号直接登录，并提供管理员批量导入员工账号的能力。

## What Changes

- 用户模型新增三个字段：`employee_id`（6位工号）、`department`（部门）、`team`（团队）
- 登录入口支持工号输入：检测到6位数字时，自动查找对应邮箱后继续现有认证流程
- 邮箱直接登录保持不变
- 新建账号时，以工号作为初始密码，并设置 `is_password_reset_required=True`，强制首次登录后修改密码
- Django Admin 新增员工账号管理页面：支持单个新增、停用、CSV 批量导入、分配至 Workspace
- 前端登录页输入框提示文案调整为「邮箱 / 工号」
- 前端登录后检测强制改密标志，跳转至修改密码页面

## Capabilities

### New Capabilities

- `employee-id-auth`: 工号登录认证——6位工号在登录时自动转换为对应邮箱，完成认证
- `employee-account-management`: 员工账号管理——Django Admin 界面支持批量导入、单个新增/停用、分配 Workspace
- `force-password-change`: 强制改密流程——账号首次登录时强制要求修改初始密码

### Modified Capabilities

- `authentication`: 登录标识符扩展——在现有邮箱认证基础上支持工号作为替代输入

## Impact

**后端文件：**

- `apps/api/plane/db/models/user.py` — 新增字段（上游文件，中等冲突风险）
- `apps/api/plane/db/migrations/` — 新增 migration
- `apps/api/plane/authentication/views/app/email.py` — 登录拦截逻辑（上游文件，低冲突风险）
- `apps/api/plane/authentication/provider/credentials/email.py` — 同步拦截（上游文件，低冲突风险）
- `apps/api/plane/admin.py` — 新建，Django Admin 配置（无上游冲突）

**前端文件：**

- 登录页组件 — placeholder 文案调整（低风险）
- 登录后路由守卫 — force_change 跳转（低风险）

**依赖：** 无需新增第三方依赖，CSV 解析使用 Python 标准库 `csv` 模块。
