## Purpose

TBD — Workspace-level work item type CRUD operations. Workspace admins can create, read, update, and delete custom work item types from a dedicated settings page.

## Requirements

### Requirement: 工作区工作项类型管理页

工作区管理员 SHALL 能在工作区设置中访问专属的「Work Item Types」管理页，用于增删改查工作项类型。

#### Scenario: 管理页仅对 Workspace Admin 可见

- **WHEN** Workspace Admin 访问工作区设置侧边栏
- **THEN** 侧边栏 SHALL 在「Features」分类下显示「Work Item Types」入口

#### Scenario: 非管理员无法访问管理页

- **WHEN** 非 Workspace Admin 用户直接访问 `/settings/work-item-types` URL
- **THEN** 系统 SHALL 重定向至无权限提示页

#### Scenario: 管理页展示所有工作区类型

- **WHEN** Workspace Admin 访问管理页
- **THEN** 页面 SHALL 列出该工作区所有 `is_active=True` 的工作项类型
- **THEN** 每个类型 SHALL 显示：图标、名称、说明（截断）、是否系统类型标记

---

### Requirement: 创建自定义工作项类型

Workspace Admin SHALL 能通过页面右上角「+ 新建类型」按钮，内联创建自定义工作项类型。

#### Scenario: 点击新建按钮展开内联表单

- **WHEN** Workspace Admin 点击页面右上角的「+ 新建类型」按钮
- **THEN** 类型列表末尾 SHALL 展开一个内联创建表单

#### Scenario: 创建表单包含必填字段

- **WHEN** 内联创建表单展开
- **THEN** 表单 SHALL 包含：图标选择器、颜色选择器、名称输入框（必填）、说明输入框（选填）

#### Scenario: 名称不能为空

- **WHEN** 用户提交空名称的类型表单
- **THEN** 系统 SHALL 展示「名称为必填项」错误，阻止提交

#### Scenario: 名称不能与现有类型重复

- **WHEN** 用户输入与现有类型（含 is_active=False 的软删除类型）同名的名称
- **THEN** 后端 SHALL 返回 400 错误
- **THEN** 前端 SHALL 展示「该名称已被使用」提示

#### Scenario: 成功创建类型

- **WHEN** 用户填写有效名称并提交
- **THEN** 系统 SHALL 调用 `POST /api/workspaces/{slug}/issue-types/`
- **THEN** 新类型 SHALL 出现在列表末尾
- **THEN** 前端 SHALL 显示成功 toast

---

### Requirement: 编辑工作项类型

Workspace Admin SHALL 能内联编辑工作项类型的图标、颜色和说明；系统类型名称不可修改。

#### Scenario: 点击编辑按钮展开内联编辑表单

- **WHEN** Workspace Admin 点击类型行的编辑按钮（✏️）
- **THEN** 该类型行 SHALL 展开内联编辑表单，预填当前值

#### Scenario: 系统类型名称字段只读

- **WHEN** 编辑的类型 `is_system=True`
- **THEN** 名称输入框 SHALL 为只读状态，并显示「系统类型名称不可修改」提示

#### Scenario: 自定义类型可修改名称

- **WHEN** 编辑的类型 `is_system=False`
- **THEN** 名称输入框 SHALL 可编辑

#### Scenario: 成功保存编辑

- **WHEN** 用户修改字段并点击「保存」
- **THEN** 系统 SHALL 调用 `PATCH /api/workspaces/{slug}/issue-types/{id}/`
- **THEN** 列表中该类型 SHALL 立即反映更新后的图标、颜色和说明
- **THEN** 前端 SHALL 显示成功 toast

---

### Requirement: 删除自定义工作项类型

Workspace Admin SHALL 能删除自定义类型，系统内置类型不可删除。删除前需确认全局级联迁移影响。

#### Scenario: 系统类型无删除按钮

- **WHEN** 类型的 `is_system=True`
- **THEN** 该类型行 SHALL 不显示删除按钮

#### Scenario: 删除确认弹窗展示影响摘要

- **WHEN** Workspace Admin 点击自定义类型的删除按钮
- **THEN** 系统 SHALL 展示确认弹窗，包含：
  - 受影响项目数量
  - 将被迁移的工作项总数
  - 迁移目标说明（各项目默认类型）

#### Scenario: 存在项目只启用该类型时拒绝删除

- **WHEN** 某项目只启用了待删除的类型且没有其他类型
- **THEN** 系统 SHALL 返回 400 并列出这些项目名称
- **THEN** 前端 SHALL 提示「请先为以下项目启用其他类型：{项目列表}」

#### Scenario: 确认后执行全局级联删除

- **WHEN** 用户在确认弹窗中点击「确认删除」
- **THEN** 系统 SHALL 原子性地执行：迁移所有项目中该类型的工作项 → 删除 ProjectIssueType 绑定 → 设置 `is_active=False`
- **THEN** 类型 SHALL 从列表中消失
- **THEN** 前端 SHALL 显示含迁移数量的成功 toast

#### Scenario: 取消删除不产生副作用

- **WHEN** 用户点击确认弹窗的「取消」按钮
- **THEN** 系统 SHALL 关闭弹窗，不做任何数据修改

---

### Requirement: 图标选择器

系统 SHALL 提供基于 `lucide-react` 包的可搜索图标选择器，支持实时预览。

#### Scenario: 空状态显示搜索提示

- **WHEN** 图标选择器打开且搜索框为空
- **THEN** 下拉列表 SHALL 不渲染图标列表，显示「输入关键词搜索图标」提示

#### Scenario: 搜索过滤图标

- **WHEN** 用户在搜索框输入关键词（如 "bug"）
- **THEN** 下拉列表 SHALL 展示名称包含该关键词的 Lucide 图标，每项显示图标预览 + 名称

#### Scenario: 选择图标后实时预览

- **WHEN** 用户选中一个图标
- **THEN** 类型行的图标显示区域 SHALL 立即更新为所选图标（结合当前选择的颜色）

---

### Requirement: 颜色选择器

系统 SHALL 提供预设色板与 HEX 输入相结合的颜色选择器。

#### Scenario: 色板提供预设颜色

- **WHEN** 颜色选择器渲染
- **THEN** SHALL 显示至少 12 种预设颜色色块，可点击选择

#### Scenario: 支持 HEX 手动输入

- **WHEN** 用户在 HEX 输入框输入有效的十六进制颜色值（如 `#ef4444`）
- **THEN** 图标颜色 SHALL 实时更新为该颜色

#### Scenario: 非法 HEX 输入不更新

- **WHEN** 用户输入非法颜色值（如 `#xyz`）
- **THEN** 系统 SHALL 不更新颜色，并对输入框标红提示格式错误

---

### Requirement: 拖拽排序

Workspace Admin SHALL 能通过拖拽调整工作项类型的显示顺序，排序结果写入 `level` 字段并影响所有项目中的类型展示顺序。

#### Scenario: 拖拽手柄可见

- **WHEN** Workspace Admin 访问类型管理页
- **THEN** 每个类型行左侧 SHALL 显示拖拽手柄图标

#### Scenario: 拖拽调整顺序

- **WHEN** 用户拖动某类型行至新位置并释放
- **THEN** 列表 SHALL 立即重新排序（乐观更新）
- **THEN** 系统 SHALL 调用 PATCH 接口更新受影响类型的 `level` 值

#### Scenario: 排序持久化

- **WHEN** 用户刷新页面
- **THEN** 类型列表 SHALL 按上次保存的 `level` 顺序展示

---

### Requirement: 图标渲染修复

系统 SHALL 基于 `logo_props` 动态渲染工作项类型图标，不再依赖类型名称硬编码。

#### Scenario: 从 logo_props 读取图标

- **WHEN** 渲染任意工作项类型图标
- **THEN** 系统 SHALL 优先读取 `logo_props.icon.name`（Lucide 图标名）和 `logo_props.icon.color`

#### Scenario: logo_props 为空时回退到默认图标

- **WHEN** `logo_props` 为空或 `logo_props.icon.name` 未知
- **THEN** 系统 SHALL 显示默认图标（CircleCheck，灰色），而非报错

#### Scenario: 图标更新后全局同步

- **WHEN** 管理员在类型管理页修改某类型图标
- **THEN** 该类型图标在所有使用处（工作项列表、下拉框、项目设置页）SHALL 同步显示新图标
