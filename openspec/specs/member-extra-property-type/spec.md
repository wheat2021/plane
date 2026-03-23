# Spec: Member Extra Property Type

## Purpose

定义 `member` 类型 Extra Property 的完整规范，包括后端数据模型、API 读写与校验、前端控件渲染、配置表单以及类型变更兼容性矩阵。

---

## Requirements

### Requirement: member 类型 ExtraPropertyConfig 支持

系统 SHALL 支持名为 `member` 的新 Extra Property 类型。该类型用于选择单个工作区成员，值存储为 user_id（UUID 字符串）或 null。

后端 `ExtraPropertyConfig.TYPE_CHOICES` SHALL 新增 `("member", "Member")` 条目。

`member` 类型的 `config` JSON SHALL 支持以下可选字段：

```json
{
  "member_color": "string (hex color, optional, e.g. #6366f1)"
}
```

`member_color` 不存在时，前端使用默认样式（无颜色环）渲染成员头像。

#### Scenario: 创建 member 类型 Extra Property 配置

- **WHEN** 管理员通过 API 或配置界面创建 type 为 `member` 的 ExtraPropertyConfig
- **THEN** 系统 SHALL 接受该创建请求并持久化配置
- **THEN** 返回的 config 对象中 `type` 字段 SHALL 为 `"member"`

#### Scenario: 创建带颜色的 member 类型配置

- **WHEN** 创建 `member` 类型配置时传入 `config.member_color = "#6366f1"`
- **THEN** 系统 SHALL 持久化该颜色值
- **THEN** API 返回的 `member_color` 字段 SHALL 为 `"#6366f1"`

---

### Requirement: member 类型值的 API 读写

系统 SHALL 通过现有 issue CRUD API（`extra_properties` 字段）支持 `member` 类型值的读写，**无需新增独立端点**。

写入时，`member` 类型的值 SHALL 为以下之一：

- 合法的 workspace member user_id（UUID 字符串）
- `null` 或空字符串（表示清除）

#### Scenario: 写入合法的 member 值

- **WHEN** 客户端通过 PATCH issue API 更新 `extra_properties`，`member` 类型字段值为合法 user_id
- **THEN** 系统 SHALL 接受并持久化该值
- **THEN** 后续 GET 该 issue 时，`extra_properties` 中 SHALL 返回该 user_id

#### Scenario: 写入 null 清除 member 值

- **WHEN** 客户端将 `member` 类型字段值设为 `null`
- **THEN** 系统 SHALL 清除该字段值，后续查询返回 `null`

#### Scenario: 写入不合法的 member 值被拒绝

- **WHEN** 客户端写入一个非 workspace member 的 user_id
- **THEN** 系统 SHALL 返回 400 错误，拒绝该更新

---

### Requirement: member 类型值校验

后端序列化器 SHALL 在 issue extra_properties 校验阶段，对 `member` 类型属性的值进行合法性校验。

校验规则：

- 值为 `null`、`""` 或 `[]`：合法（表示清除）
- 值为字符串：必须是当前 workspace 中存在的 member user_id
- 值为其他格式（boolean、list 等）：不合法，返回 400

#### Scenario: 非成员 user_id 被拒绝

- **WHEN** extra_properties 中 member 类型字段的值为一个不属于当前 workspace 的 user_id（如已离职成员）
- **THEN** 系统 SHALL 返回 400 并附带错误说明

#### Scenario: 合法 user_id 通过校验

- **WHEN** extra_properties 中 member 类型字段的值为当前 workspace 合法成员的 user_id
- **THEN** 系统 SHALL 接受并持久化

---

### Requirement: 前端 member 控件渲染

前端 `ExtraPropertyControl` SHALL 在 `config.type === "member"` 时渲染 `MemberControl` 组件。

`MemberControl` 组件 SHALL：

- 使用现有 `MemberDropdown` 组件，展示 workspace 全体成员列表
- 支持搜索成员（姓名/邮箱）
- 已选成员以头像 + 姓名形式展示
- 若 `config.member_color` 存在，在头像边框上显示该颜色
- 支持清除已选成员（设为 null）
- `disabled` 时仅展示，不可点击

#### Scenario: 选择成员后显示头像

- **WHEN** 用户点击 member 类型控件并从下拉列表中选择成员"张三"
- **THEN** 控件 SHALL 展示张三的头像和姓名
- **THEN** 调用 `onChange(userId)` 更新 extra_properties

#### Scenario: 颜色配置体现在头像边框

- **WHEN** `member` 类型的 `member_color` 配置为 `"#6366f1"`
- **THEN** 渲染的成员头像 SHALL 带有紫色边框，与默认 assignee 头像视觉区分

#### Scenario: 成员已从 workspace 移除时优雅降级

- **WHEN** extra_properties 中存储的 user_id 对应的用户已从 workspace 移除
- **THEN** 前端 SHALL 优雅降级（如显示"已移除用户"或空状态），不崩溃

#### Scenario: disabled 时只读展示

- **WHEN** `MemberControl` 的 `disabled` prop 为 true
- **THEN** 控件 SHALL 展示当前选中成员（或空状态），不可触发下拉选择

---

### Requirement: 前端挂载时自动校验 member 值

`ExtraPropertyControl` 挂载时，对 `member` 类型的值进行合法性校验，遵循与其他类型相同的挂载校验规则。

校验规则：

- 值为 `null` 或 `""`：合法，不触发 onChange
- 值为字符串：合法（不在前端做 user_id 存在性校验，由后端保证）
- 值为非字符串（boolean、array 等）：不合法，调用 `onChange(null)` 清空

#### Scenario: 非字符串值自动清空

- **WHEN** 控件挂载时，member 类型属性存储了非字符串值（如 `true`）
- **THEN** 系统 SHALL 调用 `onChange(null)` 清空

---

### Requirement: Extra Property 配置界面支持 member 类型

Workspace Settings 中的 Extra Property 配置表单（`form.tsx`）SHALL：

- 在类型选择下拉中新增 `Member` 选项
- 选择 `member` 类型时，展示颜色选择器（颜色选择器可复用现有 `IconColorPicker` 组件）
- 选择颜色后，保存到 `config.member_color`
- 不展示 `options` 配置区域（member 类型无选项列表）

#### Scenario: 选择 member 类型后显示颜色选择器

- **WHEN** 用户在配置表单中将类型改为 `Member`
- **THEN** 表单 SHALL 显示颜色选择器区域，隐藏 options 列表配置区域

#### Scenario: 保存 member 类型配置

- **WHEN** 用户选择类型为 `Member`，颜色为 `#6366f1`，点击保存
- **THEN** 系统 SHALL 创建 `type: "member"` 且 `config.member_color: "#6366f1"` 的 ExtraPropertyConfig

---

### Requirement: member 类型的类型变更兼容性

`isTypeCompatible` 兼容矩阵 SHALL 为 `member` 类型定义以下规则：

- `member` → `text`：兼容（user_id 字符串可直接存为 text）
- `member` → `textarea`：兼容
- `member` → 其他类型：不兼容
- 其他类型 → `member`：不兼容（需清空现有值）

#### Scenario: member 转 text 被视为兼容

- **WHEN** 管理员将已有数据的 `member` 类型属性改为 `text` 类型
- **THEN** 系统 SHALL 不警告数据丢失，保留已存储的 user_id 字符串作为 text 值

#### Scenario: select 转 member 被视为不兼容

- **WHEN** 管理员尝试将 `select` 类型改为 `member` 类型
- **THEN** 系统 SHALL 警告存在数据不兼容（现有值将被清空）
