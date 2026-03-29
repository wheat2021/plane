## ADDED Requirements

### Requirement: 插入 Mermaid 代码块节点

系统 SHALL 允许用户在 issue 描述编辑器中插入 `mermaidBlock` 节点类型，用于嵌入 Mermaid 图表。

#### Scenario: 通过 Slash Command 插入

- **WHEN** 用户在编辑器中输入 `/` 并搜索 "mermaid"
- **THEN** Slash Command 菜单中显示 "Mermaid 图表" 条目，选择后在光标位置插入一个空的 mermaid 代码块节点

#### Scenario: 通过输入规则插入

- **WHEN** 用户在编辑器中输入 ` ```mermaid ` 后按 Space 或 Enter
- **THEN** 自动将当前段落转换为 mermaid 代码块节点

### Requirement: 编辑模式下显示代码

在编辑器可编辑状态（`editor.isEditable = true`）时，`mermaidBlock` 节点 SHALL 以代码编辑区域呈现。

#### Scenario: 进入编辑态

- **WHEN** 编辑器处于可编辑模式且文档中包含 mermaid 节点
- **THEN** 该节点显示为可编辑的代码区域，顶部有 "Mermaid 图表" 标签，用户可直接在其中输入或修改 Mermaid 语法

#### Scenario: 代码编辑体验

- **WHEN** 用户在 mermaid 代码块中编辑文本
- **THEN** 支持正常的光标移动、选择、撤销/重做操作（与代码块行为一致）

### Requirement: 查看模式下渲染图形

在编辑器只读状态（`editor.isEditable = false`）时，`mermaidBlock` 节点 SHALL 将 Mermaid 代码渲染为 SVG 图形。

#### Scenario: 有效 Mermaid 代码渲染

- **WHEN** 编辑器处于只读模式且节点包含有效的 Mermaid 语法
- **THEN** 节点区域展示渲染后的 SVG 图形，不显示源代码

#### Scenario: 无效 Mermaid 代码

- **WHEN** 编辑器处于只读模式且节点包含语法错误的 Mermaid 代码
- **THEN** 节点区域显示错误提示信息（如 "Mermaid 图表语法错误"），不崩溃页面

#### Scenario: 空代码块

- **WHEN** 编辑器处于只读模式且 mermaid 节点内容为空
- **THEN** 节点区域显示占位提示（如 "空的 Mermaid 图表"）

### Requirement: HTML 序列化与反序列化

`mermaidBlock` 节点 SHALL 使用与 Mermaid 代码块兼容的 HTML 格式进行存储。

#### Scenario: 序列化为 HTML

- **WHEN** 编辑器将文档序列化为 HTML
- **THEN** mermaid 节点输出为 `<pre data-type="mermaidBlock"><code class="language-mermaid">...</code></pre>`

#### Scenario: 从 HTML 反序列化

- **WHEN** 编辑器加载包含 `<pre data-type="mermaidBlock">` 标记的 HTML
- **THEN** 正确解析为 `mermaidBlock` 节点类型，不会错误识别为普通 `codeBlock`

### Requirement: 性能——懒加载 Mermaid 库

`mermaidBlock` 节点的渲染 SHALL 使用动态 import 懒加载 mermaid 库，不影响编辑器的首屏加载时间。

#### Scenario: 首次渲染触发懒加载

- **WHEN** 包含 mermaid 节点的文档在只读模式下首次打开
- **THEN** mermaid 库在后台动态加载，加载完成后渲染图形；加载期间显示加载占位状态

#### Scenario: 编辑模式下不加载

- **WHEN** 编辑器处于可编辑模式
- **THEN** 不触发 mermaid 库的加载（仅在只读/查看时才需要渲染图形）
