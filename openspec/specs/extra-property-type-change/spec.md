## ADDED Requirements

### Requirement: 管理员可修改已有额外属性的类型

编辑额外属性时，类型选择器 SHALL 保持可用状态（不再 disabled），管理员可将属性修改为任意类型。

#### Scenario: 编辑模式下类型选择器可用

- **WHEN** 管理员点击某个额外属性的编辑按钮
- **THEN** 类型选择器处于可交互状态，可选择任意类型

---

### Requirement: 兼容类型变更无需提示

当目标类型与来源类型的值格式兼容时，系统 SHALL 允许直接变更类型，不展示任何警告。

兼容情况：

- text/textarea 之间互转
- select → multiselect（值从 string 自动视为 string[]）
- select → text/textarea
- checkbox → text/textarea（值为 boolean，会在控件初始化时被清除）

#### Scenario: select 变更为 multiselect 无警告

- **WHEN** 管理员将属性类型从 select 变更为 multiselect
- **THEN** 表单不展示警告 banner，可直接提交

#### Scenario: text 变更为 textarea 无警告

- **WHEN** 管理员将属性类型从 text 变更为 textarea
- **THEN** 表单不展示警告 banner，可直接提交

---

### Requirement: 不兼容类型变更时查询影响范围并展示 banner

当目标类型与来源类型的值格式不兼容（⚠ 情况），系统 SHALL 调用后端 `/values/` API 查询受影响的工作项数量和现有值，并在表单内类型选择器下方展示 inline 警告 banner。

#### Scenario: 不兼容变更且有受影响工作项时展示 banner

- **WHEN** 管理员将属性类型从 text 变更为 select，且后端返回 count > 0
- **THEN** 在类型选择器下方展示警告 banner，显示受影响工作项数量和现有不重复值列表
- **THEN** 管理员仍可继续提交（banner 仅为警告，不阻断操作）

#### Scenario: 不兼容变更但无受影响工作项时不展示 banner

- **WHEN** 管理员将属性类型从 text 变更为 select，且后端返回 count === 0
- **THEN** 不展示任何警告 banner，可直接提交

#### Scenario: 查询 API 期间展示加载状态

- **WHEN** 不兼容类型变更后，系统正在调用 /values/ API
- **THEN** banner 区域展示加载指示，类型选择器保持当前选中状态

---

### Requirement: 后端提供属性使用情况查询 API

系统 SHALL 提供端点 `GET /api/workspaces/{slug}/extra-properties/{pk}/values/`，返回工作区内使用该属性的工作项数量和所有不重复的现有值。

仅 ADMIN 角色可访问。

#### Scenario: 返回使用统计数据

- **WHEN** ADMIN 请求某属性的 values 端点
- **THEN** 响应包含 `count`（整数）和 `distinct_values`（字符串数组，已去重排序）

#### Scenario: 非 ADMIN 无法访问

- **WHEN** MEMBER 或 GUEST 角色请求 values 端点
- **THEN** 响应 HTTP 403
