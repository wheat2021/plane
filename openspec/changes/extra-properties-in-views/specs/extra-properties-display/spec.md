## ADDED Requirements

### Requirement: Display 面板额外属性选择器

Views 的 Display 面板 SHALL 包含一个 "Extra Properties" 分区，允许用户选择要显示的额外属性。

#### Scenario: 显示额外属性选择器

- **WHEN** 用户打开 Views 的 Display 面板
- **THEN** 面板 SHALL 在 Display Properties 区域下方显示 "Extra Properties" 分区
- **AND** 分区标题 SHALL 可折叠/展开

#### Scenario: 列出工作空间的所有额外属性

- **WHEN** "Extra Properties" 分区展开
- **THEN** SHALL 显示当前工作空间定义的所有额外属性配置
- **AND** 每个属性 SHALL 以按钮形式显示，样式与系统属性选择器一致

#### Scenario: 切换额外属性显示状态

- **WHEN** 用户点击某个额外属性按钮
- **THEN** 该属性的显示状态 SHALL 切换（开/关）
- **AND** 选中状态 SHALL 以高亮背景表示

### Requirement: 额外属性显示配置持久化

视图的额外属性显示配置 SHALL 与视图一起保存。

#### Scenario: 保存额外属性显示配置

- **WHEN** 用户在 Display 面板中选择额外属性
- **THEN** 配置 SHALL 作为 `extra_display_properties` 字段保存到视图数据中
- **AND** 字段格式 SHALL 为 `Record<string, boolean>`，key 为属性 config ID

#### Scenario: 加载额外属性显示配置

- **WHEN** 用户打开一个已保存的视图
- **THEN** Display 面板 SHALL 恢复之前保存的额外属性选择状态

### Requirement: List 布局额外属性渲染

List 视图布局 SHALL 在工作项行中显示选中的额外属性。

#### Scenario: 渲染有效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型已绑定该属性
- **THEN** 该属性 SHALL 以可编辑控件形式显示
- **AND** 控件样式 SHALL 与系统属性控件保持一致

#### Scenario: 渲染无效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用状态显示
- **AND** 鼠标悬停 SHALL 显示提示 "此属性对当前工作项类型不可用"

#### Scenario: 属性位置一致性

- **WHEN** 列表中有多个不同类型的工作项
- **THEN** 额外属性 SHALL 在所有行中保持相同的列位置
- **AND** 无效属性显示为灰色占位而非隐藏

### Requirement: Kanban 布局额外属性渲染

Kanban 视图布局 SHALL 在卡片中显示选中的额外属性。

#### Scenario: 卡片中渲染额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型已绑定该属性
- **THEN** 该属性 SHALL 在卡片的属性区域显示

#### Scenario: 卡片中渲染无效属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用样式显示

### Requirement: Spreadsheet 布局额外属性渲染

Spreadsheet 视图布局 SHALL 支持额外属性列。

#### Scenario: 添加额外属性列

- **WHEN** 某个额外属性被选中显示
- **THEN** Spreadsheet SHALL 在表格中添加对应的列
- **AND** 列标题 SHALL 显示属性的 label

#### Scenario: 编辑有效属性单元格

- **WHEN** 用户点击某个有效额外属性的单元格
- **THEN** 单元格 SHALL 进入编辑模式
- **AND** 根据属性类型显示相应的编辑控件

#### Scenario: 无效属性单元格

- **WHEN** 某行工作项的类型未绑定该额外属性
- **THEN** 该单元格 SHALL 显示为灰色不可编辑状态

### Requirement: 额外属性值更新

用户 SHALL 能够在视图中直接编辑额外属性值。

#### Scenario: 更新属性值

- **WHEN** 用户在视图中修改某个额外属性的值
- **THEN** 系统 SHALL 调用工作项更新 API 保存新值
- **AND** UI SHALL 乐观更新显示

#### Scenario: 更新失败回滚

- **WHEN** 属性值更新 API 调用失败
- **THEN** UI SHALL 回滚到之前的值
- **AND** SHALL 显示错误提示

### Requirement: 类型信息化 interface 扩展

TypeScript 类型定义 SHALL 扩展以支持额外属性显示配置。

#### Scenario: IIssueDisplayProperties 扩展

- **WHEN** 视图需要存储额外属性显示配置
- **THEN** 视图相关类型 SHALL 包含 `extra_display_properties?: Record<string, boolean>` 字段

#### Scenario: 视图 API 响应类型

- **WHEN** 视图 API 返回数据
- **THEN** 响应类型 SHALL 包含 `extra_display_properties` 字段
