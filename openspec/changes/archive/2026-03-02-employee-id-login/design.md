## Context

Plane 当前以 `email` 作为唯一登录标识（`USERNAME_FIELD = "email"`）。认证逻辑完全自定义，绕过了 Django 的 `AUTHENTICATION_BACKENDS`，在视图层直接完成 email 查找和密码校验。

组织内所有员工拥有 6 位数字工号，工号与邮箱的对应关系不规律。需要在不破坏现有邮箱登录的前提下，支持工号作为替代登录方式，并提供管理员预建账号的工具链。

## Goals / Non-Goals

**Goals:**

- 工号登录：6 位数字输入在认证流程中自动转换为对应邮箱
- 邮箱登录保持不变
- 管理员可通过 Django Admin 预建账号（单个 + CSV 批量）
- 预建账号使用工号作为初始密码，首次登录强制修改
- 账号停用（软删除），分配 Workspace（Member 角色）

**Non-Goals:**

- 不支持 SSO / LDAP / SAML
- 不提供自助注册入口（保持 `ENABLE_SIGNUP=0` 供部署时配置）
- 不新增独立的部门/团队管理模块（字段为纯文本）
- 不修改 OAuth 登录流程

## Decisions

### 决策 1：工号存储位置 — User 模型字段（而非配置文件或独立模型）

**选择**：在 `User` 模型新增 `employee_id` 字段（`CharField(max_length=6, unique=True, null=True, db_index=True)`）。

**备选方案：**

- 配置文件（JSON）：无需 DB migration，但更新需重启，无法通过 Admin 管理，不适合持续维护
- 独立 `EmployeeMapping` 模型：解耦灵活，但增加 join 复杂度，且与用户账号生命周期不一致

**理由**：工号是用户身份的固有属性，存在 User 模型最自然；DB 唯一索引保证唯一性；Admin 管理界面可直接操作；迁移为加字段操作（低风险）。

---

### 决策 2：登录拦截位置 — SignInAuthEndpoint 最上游

**选择**：在 `SignInAuthEndpoint.post()` 中，于 email 归一化后、User 查找前插入转换逻辑：

```python
# apps/api/plane/authentication/views/app/email.py
email = request.POST.get("email", "").strip().lower()
if re.fullmatch(r"\d{6}", email):
    user = User.objects.filter(employee_id=email).only("email").first()
    if user:
        email = user.email
```

同样的检测逻辑在 `EmailProvider.set_user_data()` 中同步加入，保证两处查找一致。

**备选方案：**

- 自定义 Django auth backend：Plane 完全绕过了 `AUTHENTICATION_BACKENDS`，此路径无效
- 仅改 EmailProvider：上游 SignInAuthEndpoint 先做了一次 `User.objects.filter(email=email)` 的存在性检查，若不同步修改，工号会在该处提前失败

**理由**：最早拦截，覆盖所有下游逻辑，改动最小（两处约 15 行）。

---

### 决策 3：EmailCheckEndpoint 同步处理

`POST /auth/email-check/` 用于前端判断登录方式（密码 or 魔法码）。若用户输入工号，该端点也需做转换，否则前端会报"用户不存在"。同样在该视图加入工号转换。

---

### 决策 4：强制改密 — 复用现有 `is_password_reset_required` 字段

User 模型已有 `is_password_reset_required` 布尔字段。预建账号时设为 `True`，前端登录成功后检测该标志跳转改密页面，改密成功后置 `False`。

无需新增字段，无需 API 变更（假设后端已在登录响应中返回该标志，需验证；若未返回则需在 `/auth/sign-in/` 响应体中补充）。

---

### 决策 5：CSV 导入 — 自定义 Admin Action，使用标准库 `csv`

**选择**：在 Django Admin 中实现自定义 `ImportCsvAction`，使用 Python 内置 `csv` 模块解析。

**备选方案：**

- `django-import-export`：功能完备但引入新依赖；CSV 格式固定，标准库够用

**CSV 列定义（按序）：**

| 列名           | 必填 | 说明           |
| -------------- | :--: | -------------- |
| `employee_id`  |  ✅  | 6位数字        |
| `email`        |  ✅  | 内部邮箱       |
| `display_name` |  ✅  | 姓名           |
| `department`   |  —   | 部门（文本）   |
| `team`         |  —   | 团队（文本）   |
| `workspace`    |  —   | Workspace slug |

导入行为：

- 创建 User，密码 = 工号，`is_password_reset_required=True`，`is_active=True`
- 若指定 workspace：查找 Workspace，创建 `WorkspaceMember(role=15)`（Member）
- 重复 `employee_id` 或 `email`：跳过该行，汇总错误报告返回
- 导入完成后在 Admin 页面展示成功/跳过/错误计数

---

### 决策 6：账号停用 — 软删除（`is_active=False`）

不做物理删除，避免关联数据（工作项、评论、分配）出现孤立记录。Admin 提供批量停用 Action。停用账号无法登录（现有 `is_active` 检查已覆盖）。

## Risks / Trade-offs

| 风险                                                   | 缓解措施                                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `user.py` 是上游文件，字段变更与上游 rebase 有冲突风险 | 字段加在模型末尾，migration 独立，冲突时仅需手动合并字段声明                                                            |
| `email.py`（views 和 provider）也是上游文件            | 修改内容为局部插入（if 块），与上游变更交叉概率低；记录改动行号以便 rebase 时定位                                       |
| 工号碰撞：有效邮箱恰好是 6 位数字                      | 当前场景内部邮箱均含 `@`，正则 `^\d{6}$` 不会误判；若未来有纯数字用户名需求，可调整为仅在 6 位数字且不含 `@` 时触发转换 |
| 初始密码即工号，安全性较低                             | 强制首次登录修改密码（`is_password_reset_required`），降低暴露窗口                                                      |
| CSV 导入无事务回滚                                     | 每行独立 try/except，失败行跳过并报告；不影响已成功的行；导入前建议备份                                                 |

## Migration Plan

1. 在 `itemtype` 分支执行 DB migration（`makemigrations` + `migrate`）
2. 通过 Django Admin CSV 导入员工账号（分批可行）
3. 将 `ENABLE_SIGNUP=0` 写入 `.env`，关闭公开注册
4. 前端更新 placeholder 文案并部署
5. 通知员工使用工号登录，首次登录需修改密码

**回滚**：migration 可 `migrate --fake` 回退字段（数据已存在时不影响业务），登录拦截代码可独立 revert。

## Open Questions

1. 当前 `/auth/sign-in/` 的响应体是否已包含 `is_password_reset_required` 字段？需在实现时确认，若缺失则在序列化层补充。
2. Workspace slug 在导入时需精确匹配，是否需要在 Admin 界面提供 slug 查询辅助？
