# Mermaid Block

## Purpose

在 issue 描述编辑器中支持 Mermaid 图表块（`mermaidBlock` 节点），允许用户通过 Slash Command 或输入规则插入 Mermaid 图表，并在编辑模式下显示代码、在只读模式下渲染为 SVG 图形。

## Requirements

### Requirement: 插入 Mermaid 代码块节点

系统 SHALL 允许用户在 issue 描述编辑器中插入 `mermaidBlock` 节点类型，用于嵌入 Mermaid 图表。

#### Scenario: 通过 Slash Command 插入

- **WHEN** 用户在编辑器中输入 `/` 并搜索 "mermaid"
- **THEN** Slash Command 菜单中显示 "Mermaid 图表" 条目，选择后在光标位置插入一个空的 mermaid 代码块节点

#### Scenario: 通过输入规则插入

- **WHEN** 用户在编辑器中输入 ` ```mermaid ` 后按 Space 或 Enter
- **THEN** 自动将当前段落转换为 mermaid 代码块节点

### Requirement: 编辑模式下显示代码

`mermaidBlock` 节点 SHALL 以“显式模式切换”方式展示代码编辑区域，且默认进入代码编辑模式。

#### Scenario: 默认进入代码态

- **WHEN** 用户新建或插入 `mermaidBlock` 节点
- **THEN** 节点显示可编辑代码区域，顶部工具栏包含 "Mermaid 图表" 标签与模式切换按钮

#### Scenario: 代码编辑体验

- **WHEN** 用户在 `mermaidBlock` 代码区域编辑文本
- **THEN** 支持正常的光标移动、选择、撤销/重做操作（与代码块行为一致）

### Requirement: 查看模式下渲染图形

`mermaidBlock` 节点 SHALL 通过显式 `预览` 按钮触发图形渲染，而不是依赖编辑器全局只读状态。

#### Scenario: 有效 Mermaid 代码渲染

- **WHEN** 用户点击 `预览` 且节点包含有效 Mermaid 语法
- **THEN** 节点区域展示渲染后的 SVG 图形，不显示源代码

#### Scenario: 无效 Mermaid 代码

- **WHEN** 用户点击 `预览` 且节点包含语法错误的 Mermaid 代码
- **THEN** 节点区域显示错误提示信息（如 "Mermaid 图表语法错误"），不崩溃页面

#### Scenario: 空代码块

- **WHEN** 用户点击 `预览` 且节点内容为空
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

`mermaidBlock` 节点的渲染 SHALL 使用动态 import 懒加载 mermaid 库，且仅在用户进入预览模式时触发加载。

#### Scenario: 首次预览触发懒加载

- **WHEN** 用户首次点击 `预览` 且页面中尚未加载 mermaid 库
- **THEN** mermaid 库在后台动态加载，加载完成后渲染图形；加载期间显示加载占位状态

#### Scenario: 代码模式下不加载

- **WHEN** 节点处于代码编辑模式且用户未进入预览
- **THEN** 不触发 mermaid 库加载
