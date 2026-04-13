# Analytics Chart Block

## Purpose

在富文本编辑器中支持分析图表块（`analyticsChart` 节点），允许用户在 Issue 描述等任意编辑器上下文中嵌入实时分析图表，支持多种图表类型与参数配置，数据实时从 Plane API 获取。

## Requirements

### Requirement: 插入分析图表节点

系统 SHALL 允许用户在富文本编辑器中插入 `analyticsChart` 节点，用于嵌入实时数据图表。

#### Scenario: 通过 Slash Command 插入

- **WHEN** 用户在编辑器中输入 `/` 并搜索 "analytics" 或 "图表" 或 "分析"
- **THEN** Slash Command 菜单显示 "Analytics 图表" 条目，选择后在光标处插入一个空的 `analyticsChart` 节点，并自动进入配置模式

#### Scenario: 通过输入规则插入

- **WHEN** 用户在编辑器中输入 ` ```analytics ` 后按 Space 或 Enter
- **THEN** 当前段落自动转换为 `analyticsChart` 节点，进入配置模式

---

### Requirement: 配置模式——选择图表类型

`analyticsChart` 节点 SHALL 在配置模式下展示图表类型选择器，供用户选择所需图表类型。

#### Scenario: 显示所有可用图表类型

- **WHEN** 用户进入配置模式
- **THEN** 界面顶部以图标网格展示以下六种图表类型：Bar（柱状图）、Line（折线图）、Area（面积图）、Pie（饼图）、Radar（雷达图）、TreeMap（树图）

#### Scenario: 切换图表类型

- **WHEN** 用户点击某种图表类型图标
- **THEN** 该图表类型高亮选中，配置面板中的参数选项根据图表类型联动更新

---

### Requirement: 配置模式——参数联动约束

系统 SHALL 根据当前选择的图表类型，动态约束 x_axis 和 group_by 的可用选项。

#### Scenario: Line/Area 图表限制 x_axis 为日期属性

- **WHEN** 用户选择 Line 或 Area 图表类型
- **THEN** x_axis 下拉框仅显示日期类属性（start_date、target_date、created_at、completed_at），非日期属性不可选

#### Scenario: Pie 图表隐藏 group_by

- **WHEN** 用户选择 Pie 图表类型
- **THEN** group_by 选择器隐藏，若之前已设置 group_by 值则自动清空

#### Scenario: 其他图表类型显示全部属性

- **WHEN** 用户选择 Bar、Radar 或 TreeMap 图表类型
- **THEN** x_axis 显示全部可用属性，group_by 选择器正常显示

---

### Requirement: 配置模式——参数配置

`analyticsChart` 节点 SHALL 在配置模式下提供以下参数配置项。

#### Scenario: 配置 X 轴属性

- **WHEN** 用户在配置模式中操作 X 轴选择器
- **THEN** 下拉框列出当前约束范围内的所有可用属性（优先级、状态、负责人、标签、日期等），选择后更新节点配置

#### Scenario: 配置分组属性

- **WHEN** 用户在配置模式中操作 Group By 选择器（仅非 Pie 图表显示）
- **THEN** 下拉框列出与 x_axis 不重复的可用属性，允许选择"无分组"选项

#### Scenario: 配置工作项类型过滤

- **WHEN** 用户在配置模式中操作工作项类型选择器
- **THEN** 下拉框列出当前 workspace 下所有工作项类型及"全部类型"选项

#### Scenario: 配置时间范围

- **WHEN** 用户在配置模式中操作时间范围选择器
- **THEN** 下拉框提供预设时间范围选项（如 Last 7 days、Last 30 days、Last 3 months 等）

#### Scenario: 配置项目范围

- **WHEN** 用户在配置模式中操作项目选择器
- **THEN** 下拉框列出当前 workspace 下所有可访问项目及"全部项目"选项，支持多选；选择"全部项目"则查询 workspace 级别数据

#### Scenario: 配置图表标题

- **WHEN** 用户在配置模式中填写标题输入框
- **THEN** 节点保存标题，在预览模式下图表上方显示该标题

#### Scenario: 应用配置切换至预览

- **WHEN** 用户点击配置面板中的"应用"或"预览"按钮
- **THEN** 节点切换至预览模式，使用当前配置参数渲染图表

---

### Requirement: 预览模式——渲染实时图表

`analyticsChart` 节点 SHALL 在预览模式下调用 API 并渲染对应图表类型的实时数据。

#### Scenario: 默认进入预览模式

- **WHEN** 已有完整配置的 `analyticsChart` 节点被加载（新建或从存储恢复）
- **THEN** 节点默认以预览模式展示，发起 API 请求获取数据并渲染图表

#### Scenario: 显示加载状态

- **WHEN** 图表节点正在获取数据
- **THEN** 节点区域显示加载指示器，不显示空白或残留的旧数据

#### Scenario: 成功渲染图表

- **WHEN** API 返回有效数据
- **THEN** 节点渲染对应类型的图表（Bar/Line/Area/Pie/Radar/TreeMap），若配置了标题则显示在图表上方

#### Scenario: 悬浮显示操作工具栏

- **WHEN** 用户将鼠标悬停在处于预览模式的图表节点上
- **THEN** 节点右上角浮出工具栏，包含"⚙ 配置"和"👁 预览"切换按钮，样式与 mermaid/drawio block 一致

#### Scenario: 从预览切换至配置

- **WHEN** 用户点击悬浮工具栏中的"⚙ 配置"按钮
- **THEN** 节点切换至配置模式，展示当前参数的可视化配置面板

---

### Requirement: 预览模式——错误处理

系统 SHALL 在 API 调用失败时向用户展示清晰的错误提示，而非静默失败。

#### Scenario: API 返回权限不足错误

- **WHEN** 图表节点调用 API 时收到 403 响应
- **THEN** 节点区域显示权限不足的提示信息（如"无权访问此数据，请检查项目权限"），并提供"⚙ 配置"入口供用户调整参数

#### Scenario: API 返回其他错误

- **WHEN** 图表节点调用 API 时收到非 2xx 响应（非 403）
- **THEN** 节点区域显示通用错误提示（如"数据加载失败，请稍后重试"），并提供"重试"按钮

#### Scenario: 数据为空时的空状态

- **WHEN** API 返回成功但数据集为空
- **THEN** 节点显示空状态占位（如"暂无数据，请调整过滤条件"），不渲染空图表轴

---

### Requirement: 只读模式下渲染图表

系统 SHALL 在编辑器处于只读状态时仍渲染实时图表，但隐藏配置入口。

#### Scenario: 只读模式下显示图表

- **WHEN** 编辑器处于只读状态（如 Issue 详情页预览）且节点有完整配置
- **THEN** 节点以预览模式渲染图表，隐藏悬浮工具栏中的"⚙ 配置"按钮

#### Scenario: 只读模式下的错误提示

- **WHEN** 编辑器处于只读状态且 API 调用失败
- **THEN** 节点显示错误提示信息，不显示配置入口

---

### Requirement: 节点持久化与序列化

`analyticsChart` 节点 SHALL 将图表配置持久化为 HTML 属性，以实现跨会话恢复。

#### Scenario: 序列化为 HTML

- **WHEN** 编辑器将文档序列化为 HTML
- **THEN** `analyticsChart` 节点输出为 `<div data-type="analyticsChart" data-config="<base64(JSON)>"></div>`，配置 JSON 包含所有参数（chart_type、x_axis、group_by、issue_type_id、issue_type_name、project_ids、duration、title）

#### Scenario: 从 HTML 恢复节点

- **WHEN** 编辑器解析含有 `data-type="analyticsChart"` 的 HTML
- **THEN** 正确恢复 `analyticsChart` 节点及其全部配置参数

#### Scenario: workspaceSlug 不持久化

- **WHEN** 节点配置被序列化
- **THEN** workspaceSlug 不包含在 `data-config` 中；workspaceSlug 在运行时通过编辑器 context 注入
