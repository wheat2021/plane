# 认证体系 Spec

> 描述 Plane 当前认证体系的能力边界与行为约定。
> 本文件是参考文档，不描述变更，仅记录现状与使用约束。

---

## 概述

Plane 采用**会话（Session）**机制进行状态保持，支持三类认证方式：邮箱/密码、魔法验证码、OAuth 2.0（第三方提供商）。系统以 `email` 作为主要用户标识符和登录凭据。后端为 Django REST Framework，认证逻辑集中在 `apps/api/plane/authentication/` 目录。

### 认证方式概览

| 方式         | 功能开关                  | 前提条件            |
| ------------ | ------------------------- | ------------------- |
| 邮箱 + 密码  | `ENABLE_EMAIL_PASSWORD`   | —                   |
| 魔法验证码   | `ENABLE_MAGIC_LINK_LOGIN` | SMTP 邮件服务已配置 |
| Google OAuth | `GOOGLE_CLIENT_ID` 已配置 | —                   |
| GitHub OAuth | `GITHUB_CLIENT_ID` 已配置 | —                   |
| GitLab OAuth | `GITLAB_CLIENT_ID` 已配置 | —                   |
| Gitea OAuth  | `GITEA_CLIENT_ID` 已配置  | —                   |

所有功能开关默认值见「配置参数」节。

---

## 用户模型

**文件**：`apps/api/plane/db/models/user.py`

### Requirement: 用户标识字段

#### Scenario: email 是主登录标识符

- **WHEN** 系统处理任何认证请求
- **THEN** `email` 字段 SHALL 用于匹配和查找用户（`USERNAME_FIELD = "email"`）
- **THEN** `email` 字段 SHALL 在存储前自动 lowercase 并 strip
- **THEN** `email` 字段 SHALL 在系统内全局唯一（max 255 字符）
- **THEN** `email` 字段 SHALL 通过 Django `validate_email()` 验证格式

#### Scenario: username 字段行为

- **WHEN** 新用户通过 OAuth 注册
- **THEN** `username` SHALL 自动生成为 `uuid.uuid4().hex`（不可由用户自定义）
- **WHEN** 新用户通过邮箱密码注册
- **THEN** `username` SHALL 默认取自 email 的 `@` 前缀，如前缀不可用则生成随机 6 字符字符串
- **THEN** `username` SHALL 在系统内全局唯一（max 128 字符，无格式约束）
- **THEN** `username` 字段 SHALL NOT 用于登录认证

### Requirement: 用户状态字段

| 字段                         | 含义                                 |
| ---------------------------- | ------------------------------------ |
| `is_active`                  | 用户是否激活（False 时禁止登录）     |
| `is_email_verified`          | 邮箱是否已验证                       |
| `is_password_autoset`        | 密码是否由系统自动设置（OAuth 用户） |
| `is_password_expired`        | 密码是否已过期                       |
| `is_password_reset_required` | 是否需要强制重置密码                 |
| `is_managed`                 | 是否由外部管理（预留字段）           |

#### Scenario: 非激活用户

- **WHEN** `is_active=False` 的用户尝试登录
- **THEN** 系统 SHALL 拒绝认证请求

---

## 邮箱/密码认证

**文件**：

- `apps/api/plane/authentication/provider/credentials/email.py`
- `apps/api/plane/authentication/views/app/email.py`

### Requirement: 注册流程

#### Scenario: 新用户注册

- **WHEN** `POST /auth/sign-up/` 收到邮箱和密码
- **THEN** 系统 SHALL 验证 `ENABLE_SIGNUP=1`，否则返回错误
- **THEN** 系统 SHALL 检查邮箱是否已存在，若存在则返回错误码 5030
- **THEN** 系统 SHALL 使用 `zxcvbn` 验证密码强度（score >= 3），不足则拒绝
- **THEN** 系统 SHALL 创建 User 和 Profile 记录
- **THEN** 系统 SHALL 处理待接受的工作区/项目邀请

### Requirement: 登录流程

#### Scenario: 现有用户登录

- **WHEN** `POST /auth/sign-in/` 收到邮箱和密码
- **THEN** 系统 SHALL 通过 email 查找用户，未找到返回错误码 5060
- **THEN** 系统 SHALL 校验密码哈希，不匹配返回错误码 5065
- **THEN** 系统 SHALL 建立 Django Session 并返回认证状态

---

## 魔法验证码认证

**文件**：

- `apps/api/plane/authentication/provider/credentials/magic_code.py`
- `apps/api/plane/authentication/views/app/magic.py`

### Requirement: 验证码生成

#### Scenario: 请求魔法验证码

- **WHEN** `POST /auth/magic-generate/` 收到有效邮箱
- **THEN** 系统 SHALL 生成 6 位随机数字验证码（`secrets.randbelow(900000) + 100000`）
- **THEN** 系统 SHALL 将验证码存入 Redis，TTL = 10 分钟
- **THEN** 系统 SHALL 通过 SMTP 发送验证码到用户邮箱
- **WHEN** 同一邮箱在有效期内已请求 3 次及以上
- **THEN** 系统 SHALL 返回频率限制错误（错误码 5100）

### Requirement: 验证码验证

#### Scenario: 使用验证码登录/注册

- **WHEN** `POST /auth/magic-sign-in/` 或 `POST /auth/magic-sign-up/` 收到邮箱+验证码
- **THEN** 系统 SHALL 从 Redis 取出对应验证码进行比对
- **WHEN** 验证码不匹配
- **THEN** 系统 SHALL 返回错误码 5090
- **WHEN** 验证码已过期（Redis key 不存在）
- **THEN** 系统 SHALL 返回错误码 5095
- **WHEN** 验证码验证成功
- **THEN** 系统 SHALL 删除 Redis 中的验证码（防止重放）
- **THEN** 系统 SHALL 创建或更新用户（`is_password_autoset=True`）

---

## OAuth 2.0 认证

**文件**：`apps/api/plane/authentication/provider/oauth/`

### Requirement: OAuth 通用流程

#### Scenario: OAuth 授权流程

- **WHEN** 用户访问 `GET /auth/{provider}/`
- **THEN** 系统 SHALL 生成 state 参数并重定向至第三方授权页面
- **WHEN** 第三方授权成功，回调 `GET /auth/{provider}/callback/?code=...&state=...`
- **THEN** 系统 SHALL 校验 state 参数防止 CSRF
- **THEN** 系统 SHALL 用 code 换取 access_token
- **THEN** 系统 SHALL 从提供商获取用户信息（email、头像、姓名）
- **THEN** 系统 SHALL 创建或更新 User、Profile、Account 记录

#### Scenario: OAuth 账号关联

- **WHEN** 同一 email 已有账号但尚未关联该 OAuth 提供商
- **THEN** 系统 SHALL 为现有用户创建新的 Account 记录（而非创建重复用户）
- **WHEN** `ENABLE_{PROVIDER}_SYNC=1`
- **THEN** 系统 SHALL 在每次 OAuth 登录时同步提供商的用户信息（头像、姓名）

### Requirement: 各提供商特殊规则

#### Scenario: GitHub 组织限制

- **WHEN** 配置了 `GITHUB_ORGANIZATION_ID`
- **THEN** 系统 SHALL 验证用户是否为该组织成员
- **WHEN** 用户不在指定组织内
- **THEN** 系统 SHALL 返回错误码 5122 并拒绝登录

#### Scenario: GitLab 自托管支持

- **WHEN** 配置了 `GITLAB_HOST`
- **THEN** 系统 SHALL 使用该地址作为 GitLab 实例端点（支持企业私有部署）
- **WHEN** `GITLAB_HOST` 未配置
- **THEN** 系统 SHALL 默认使用 `https://gitlab.com`

#### Scenario: Gitea 邮箱获取

- **WHEN** Gitea 主用户接口未返回 email
- **THEN** 系统 SHALL 额外调用 `/api/v1/user/emails` 获取邮箱列表
- **THEN** 系统 SHALL 优先选取「主要」且「已验证」的邮箱

---

## Account 模型（OAuth 凭据存储）

**文件**：`apps/api/plane/db/models/user.py`（`Account` class）

### Requirement: OAuth 凭据存储

#### Scenario: Account 记录唯一性

- **WHEN** 系统存储 OAuth 账号
- **THEN** `(provider, provider_account_id)` SHALL 唯一标识一条 Account 记录
- **THEN** 每个 User 可以关联多个不同 provider 的 Account（一对多）

| 字段                      | 含义                               |
| ------------------------- | ---------------------------------- |
| `provider`                | 提供商名称（google/github/gitlab） |
| `provider_account_id`     | 提供商侧的用户 ID                  |
| `access_token`            | OAuth Access Token（明文存储）     |
| `refresh_token`           | OAuth Refresh Token（可为空）      |
| `access_token_expired_at` | Access Token 过期时间              |
| `id_token`                | OIDC ID Token（部分提供商提供）    |
| `metadata`                | 提供商额外数据（JSON）             |

---

## 密码管理

**文件**：`apps/api/plane/authentication/views/app/email.py`

### Requirement: 密码操作

#### Scenario: 忘记密码

- **WHEN** `POST /auth/forgot-password/` 收到邮箱
- **THEN** 系统 SHALL 发送重置链接（含 uidb64 + token）至该邮箱
- **THEN** 链接 SHALL 在一定时间内有效

#### Scenario: 重置密码

- **WHEN** `POST /auth/reset-password/<uidb64>/<token>/` 收到新密码
- **THEN** 系统 SHALL 验证 token 有效性，无效返回错误码 5125，过期返回 5130
- **THEN** 系统 SHALL 对新密码执行 zxcvbn 强度验证

#### Scenario: 修改密码

- **WHEN** 已登录用户 `POST /auth/change-password/` 提交旧密码和新密码
- **THEN** 系统 SHALL 验证旧密码正确性，不正确返回错误码 5135
- **THEN** 系统 SHALL 对新密码执行强度验证

#### Scenario: OAuth 用户设置密码

- **WHEN** `is_password_autoset=True` 的用户 `POST /auth/set-password/` 设置密码
- **THEN** 系统 SHALL 允许设置密码，并将 `is_password_autoset` 更新为 False

---

## 登录前检查

**文件**：`apps/api/plane/authentication/views/app/email.py`

### Requirement: Email Check 端点

#### Scenario: 检查邮箱状态

- **WHEN** `POST /auth/email-check/` 收到邮箱地址
- **THEN** 系统 SHALL 返回：
  - `existing`：该 email 是否已注册
  - `status`：推荐的登录方式（`"MAGIC_CODE"` 或 `"CREDENTIAL"`）
  - `is_password_autoset`：是否为 OAuth 用户（无独立密码）
- **THEN** 前端 SHALL 根据返回的 `status` 决定展示魔法码或密码输入框

---

## 界面与引导

### Requirement: 默认界面语言为简体中文

系统 SHALL 在用户无语言偏好记录（localStorage 无 `userLanguage` key）时，默认以简体中文（`zh-CN`）呈现所有界面文本。

#### Scenario: 首次访问时语言默认为中文

- **WHEN** 用户首次打开 Plane（localStorage 中无 `userLanguage` 记录）
- **THEN** 系统 SHALL 以 `zh-CN` 渲染界面

#### Scenario: 已保存语言偏好不受影响

- **WHEN** 用户 localStorage 中已有 `userLanguage=en` 等记录
- **THEN** 系统 SHALL 读取该记录，以保存的语言渲染界面（不强制覆盖）

### Requirement: Onboarding 仅包含 Profile Setup 步骤

新用户完成 Profile Setup（设置姓名和初始密码）后，系统 SHALL 直接完成引导流程，不再展示角色选择（Role Setup）和使用场景问卷（UseCase Setup）步骤。

#### Scenario: Profile Setup 完成后直接结束引导

- **WHEN** 用户提交 Profile Setup 表单
- **THEN** 系统 SHALL 调用 `finishOnboarding()` 结束引导
- **THEN** 系统 SHALL NOT 跳转至 Role Setup 步骤

#### Scenario: 工作空间缺失时的行为

- **WHEN** 用户 Profile Setup 完成但未被分配到任何工作空间
- **THEN** 系统 SHALL 同样调用 `finishOnboarding()`（由管理员负责工作空间分配，不在引导流程中处理）

---

## 安全机制

### Requirement: 基础安全保障

#### Scenario: CSRF 防护

- **WHEN** 前端发起认证请求
- **THEN** 系统 SHALL 要求携带有效 CSRF Token（通过 `GET /auth/get-csrf-token/` 获取）

#### Scenario: 频率限制

- **WHEN** 同一 IP 或邮箱在短时间内多次请求认证端点
- **THEN** `AuthenticationThrottle` SHALL 触发频率限制，返回错误码 5900

#### Scenario: 密码强度

- **WHEN** 任何涉及密码设置的操作（注册、重置、修改）
- **THEN** 系统 SHALL 使用 `zxcvbn` 评估密码强度
- **THEN** 强度 score < 3 的密码 SHALL 被拒绝

#### Scenario: 会话安全

- **WHEN** 用户登录成功
- **THEN** 系统 SHALL 记录 `last_login_time`、`last_login_ip`、`last_login_uagent` 用于审计
- **THEN** 管理后台和主应用 SHALL 使用独立的 Session Cookie

---

## 注册控制

### Requirement: 开放/受控注册

#### Scenario: 关闭公开注册

- **WHEN** `ENABLE_SIGNUP=0`
- **THEN** 系统 SHALL 拒绝所有未受邀的新用户注册
- **THEN** 已有邀请链接的用户 SHALL 仍可通过邀请流程注册

#### Scenario: 邀请自动入组

- **WHEN** 新用户注册成功（任意方式）
- **THEN** 系统 SHALL 自动处理该邮箱的所有待接受工作区/项目邀请

---

## 配置参数

| 环境变量                  | 默认值       | 含义                          |
| ------------------------- | ------------ | ----------------------------- |
| `ENABLE_SIGNUP`           | `"1"`        | 是否允许公开注册              |
| `ENABLE_EMAIL_PASSWORD`   | `"1"`        | 是否启用邮箱/密码认证         |
| `ENABLE_MAGIC_LINK_LOGIN` | `"1"`        | 是否启用魔法验证码            |
| `GOOGLE_CLIENT_ID/SECRET` | —            | 配置后自动启用 Google OAuth   |
| `GITHUB_CLIENT_ID/SECRET` | —            | 配置后自动启用 GitHub OAuth   |
| `GITHUB_ORGANIZATION_ID`  | —            | 限制 GitHub 登录至指定组织    |
| `GITLAB_CLIENT_ID/SECRET` | —            | 配置后自动启用 GitLab OAuth   |
| `GITLAB_HOST`             | `gitlab.com` | GitLab 实例地址（支持自托管） |
| `GITEA_CLIENT_ID/SECRET`  | —            | 配置后自动启用 Gitea OAuth    |
| `GITEA_HOST`              | —            | Gitea 实例地址（必填）        |
| `ENABLE_GOOGLE_SYNC`      | `"0"`        | 每次登录同步 Google 用户信息  |
| `ENABLE_GITHUB_SYNC`      | `"0"`        | 每次登录同步 GitHub 用户信息  |
| `ENABLE_GITLAB_SYNC`      | `"0"`        | 每次登录同步 GitLab 用户信息  |
| `ENABLE_GITEA_SYNC`       | `"0"`        | 每次登录同步 Gitea 用户信息   |

---

## 错误码参考

| 错误码    | 含义                    |
| --------- | ----------------------- |
| 5000      | 实例未配置              |
| 5015      | 公开注册已禁用          |
| 5030      | 邮箱已存在              |
| 5060      | 用户不存在              |
| 5065      | 密码错误                |
| 5090      | 魔法验证码不匹配        |
| 5095      | 魔法验证码已过期        |
| 5100      | 验证码生成次数超限      |
| 5105–5112 | OAuth 提供商未配置      |
| 5122      | GitHub 组织成员校验失败 |
| 5125      | 密码重置 Token 无效     |
| 5130      | 密码重置 Token 已过期   |
| 5135      | 旧密码错误              |
| 5900      | 频率限制触发            |

---

## 当前限制与已知约束

1. **email 强绑定**：系统以 email 为唯一登录标识，不支持以 username 或工号登录。
2. **无 SAML/LDAP 支持**：内置 OAuth 仅支持标准 OAuth 2.0 流程，无 SAML 2.0 或 LDAP 集成。
3. **无自定义 SSO 提供商**：不支持通用 OIDC Discovery 或企业 SSO 配置界面，新增提供商需修改代码。
4. **密码存储明文 Token**：OAuth access_token 以明文存储在数据库（Account 模型），无加密保护。
5. **username 不可登录**：`username` 字段当前仅作内部标识，无法用于认证。
