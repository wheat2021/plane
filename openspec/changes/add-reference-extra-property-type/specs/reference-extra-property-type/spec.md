## ADDED Requirements

### Requirement: reference 类型纳入 extra property 类型系统

系统 SHALL 支持 `reference` 作为合法的 extra property 类型，与 text、textarea、select、multiselect、checkbox、member 并列。后端 `ExtraPropertyConfig.TYPE_CHOICES` 必须包含 `("reference", "Reference")`，前端 `TExtraPropertyType` 必须包含 `"reference"`。

#### Scenario: 管理员创建 reference 类型属性

- **WHEN** 管理员在工作空间 extra property 配置界面选择类型为 "Reference"
- **THEN** 系统创建 `type = "reference"` 的 `ExtraPropertyConfig` 记录，无需额外 config 字段（options、member_color 等均不适用）

#### Scenario: 类型系统识别 reference 值

- **WHEN** 系统读取 issue.extra_properties 中 reference 类型属性的值
- **THEN** 该值被识别为 `TReferenceItem[]`（`Array<{display: string, url: string}>`）或 `null`

---

### Requirement: reference 值的数据结构

reference 类型的值 SHALL 为 `TReferenceItem` 对象数组，每个对象包含 `display`（显示文本，非空字符串）和 `url`（链接地址字符串）两个字段。空值表示为 `null` 或空数组 `[]`。

#### Scenario: 合法的 reference 值

- **WHEN** API 接收到 reference 类型属性的值 `[{"display": "Jira Ticket", "url": "https://jira.example.com/BR-123"}]`
- **THEN** 系统接受该值并存储到 `issue.extra_properties`

#### Scenario: display 为空时拒绝

- **WHEN** API 接收到 `[{"display": "", "url": "https://example.com"}]`
- **THEN** 系统返回校验错误，拒绝存储（display 字段不得为空字符串）

#### Scenario: 非对象数组时拒绝

- **WHEN** API 接收到 reference 类型属性的值为字符串 `"https://example.com"`
- **THEN** 系统返回校验错误，拒绝存储

---

### Requirement: Normal 模式——只读展示

在 issue 详情侧边栏（Normal 模式），reference 类型属性 SHALL 以逗号分隔的可点击链接列表形式展示。每个链接显示 `display` 文本，点击在新标签页打开 `url`。无链接时显示占位符文本。

#### Scenario: 有链接时的展示

- **WHEN** reference 属性有值 `[{display:"Figma",url:"..."}, {display:"Jira",url:"..."}]`
- **THEN** 展示为 "Figma, Jira"，每个名称为可点击 `<a target="_blank">` 链接

#### Scenario: 无链接时的展示

- **WHEN** reference 属性值为 null 或 []
- **THEN** 展示占位符（如 "—" 或 "添加链接..."）

#### Scenario: 属性标签区的图标

- **WHEN** 属性在 `ExtraPropertyRenderer` 中渲染
- **THEN** 使用 lucide-react `Link2` 图标（或等效链接图标）作为属性类型图标

---

### Requirement: Normal 模式——Popover 编辑器

当 reference 属性可编辑时，点击属性值区域 SHALL 弹出 Popover，展示链接列表编辑器，支持查看、新增、编辑、删除链接条目。

#### Scenario: 打开 Popover

- **WHEN** 用户点击可编辑的 reference 属性值区域
- **THEN** Popover 弹出，显示当前所有链接条目（viewing 状态）

#### Scenario: 编辑已有链接

- **WHEN** 用户点击某条链接的编辑按钮（✏️）
- **THEN** 该条目切换为 editing 状态，展示 display 和 url 输入框，其他条目保持 viewing 状态

#### Scenario: 保存已编辑的链接

- **WHEN** 用户在 editing 状态下点击 [保存]，且 display 非空
- **THEN** 该条目更新为新值，切换回 viewing 状态；整体链接列表通过 onChange 提交给父组件

#### Scenario: 取消编辑

- **WHEN** 用户在 editing 状态下点击 [取消]
- **THEN** 该条目恢复为编辑前的值，切换回 viewing 状态

#### Scenario: 新增链接

- **WHEN** 用户点击 [+ 添加链接]
- **THEN** Popover 底部展开新增表单（display + url 输入框 + [取消]/[保存]）

#### Scenario: 保存新链接时 display 为空

- **WHEN** 用户在新增表单中未填写 display 即点击 [保存]
- **THEN** 系统拒绝保存，在 display 字段旁显示错误提示

#### Scenario: 删除链接

- **WHEN** 用户点击某条链接的删除按钮（✕）
- **THEN** 该条目立即从列表中移除，并通过 onChange 提交更新后的列表

#### Scenario: Popover 在 disabled 状态下不可触发

- **WHEN** reference 属性处于 disabled（只读）状态
- **THEN** 点击属性值区域不弹出 Popover，链接仍可点击跳转

---

### Requirement: Compact 模式——图标状态

在 Compact 模式（issue 列表行内），reference 属性 SHALL 显示链接图标，有链接时图标为蓝色，无链接时图标为灰色。

#### Scenario: 有链接时图标颜色

- **WHEN** reference 属性有一个或多个链接
- **THEN** 显示蓝色链接图标（`text-blue-500` 或等效）

#### Scenario: 无链接时图标颜色

- **WHEN** reference 属性值为 null 或 []
- **THEN** 显示灰色链接图标（`text-secondary`）

---

### Requirement: Compact 模式——只读导航 Dropdown

在 Compact 模式下，点击链接图标 SHALL 展开只读导航 Dropdown，列出所有链接供用户点击跳转，不支持编辑。

#### Scenario: 点击图标展开 Dropdown（有链接）

- **WHEN** 用户点击蓝色链接图标（有链接时）
- **THEN** Dropdown 展开，显示所有链接条目，每条显示 display 文本和外链图标

#### Scenario: 点击链接跳转

- **WHEN** 用户在 Dropdown 中点击某条链接
- **THEN** 浏览器在新标签页打开对应的 url（`target="_blank" rel="noopener noreferrer"`）

#### Scenario: 点击图标（无链接）

- **WHEN** 用户点击灰色链接图标（无链接时）
- **THEN** 不展开 Dropdown（或展开空状态提示），不可编辑

#### Scenario: Compact 模式始终为只读

- **WHEN** reference 属性在 Compact 模式下无论 disabled 与否
- **THEN** Dropdown 仅提供导航功能，不显示编辑、新增、删除按钮

---

### Requirement: 配置界面——reference 类型无额外配置

工作空间 extra property 配置表单 SHALL 在类型为 reference 时，不显示 options 配置区域、不显示颜色选择器等类型特定配置，只需要 label 和 key 字段。

#### Scenario: 选择 reference 类型时的表单状态

- **WHEN** 管理员在配置表单中将类型切换为 "Reference"
- **THEN** options 区域隐藏，无新增配置项出现

---

### Requirement: reference 类型与其他类型不兼容

在工作空间 extra property 配置界面，当管理员修改属性类型时，reference 类型 SHALL 与所有其他类型不兼容（双向）。

#### Scenario: 从 reference 切换到其他类型

- **WHEN** 管理员将已有 reference 类型属性改为其他类型（如 text）
- **THEN** `isTypeCompatible` 返回 false，系统不保留原有值（切换后值清空）

#### Scenario: 从其他类型切换到 reference

- **WHEN** 管理员将已有其他类型属性改为 reference
- **THEN** `isTypeCompatible` 返回 false，系统不保留原有值（切换后值清空）

---

### Requirement: 类型守卫保护 string[] 处理路径

在所有涉及 `Array.isArray(value)` 的代码路径中，SHALL 使用类型守卫区分 `string[]` 和 `TReferenceItem[]`，防止 reference 值被误当 string[] 处理。

#### Scenario: multiselect sanitize 路径不处理 reference 值

- **WHEN** `sanitizeValue` 被调用，且 value 为 `TReferenceItem[]`
- **THEN** 函数识别 value 不是 `string[]`，返回 null 而不是尝试过滤对象

#### Scenario: isValueValid 正确识别 reference 值

- **WHEN** `isValueValid` 对 reference 类型调用，value 为 `[{display:"x",url:"y"}]`
- **THEN** 函数返回 true（合法的 reference 值）
