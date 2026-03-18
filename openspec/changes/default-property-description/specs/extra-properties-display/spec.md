## MODIFIED Requirements

### Requirement: 类型信息化 interface 扩展

TypeScript 类型定义 SHALL 扩展以支持额外属性显示配置。

#### Scenario: IIssueDisplayProperties 扩展

- **WHEN** 视图需要存储额外属性显示配置
- **THEN** 视图相关类型 SHALL 包含 `extra_display_properties?: Record<string, boolean>` 字段

#### Scenario: 视图 API 响应类型

- **WHEN** 视图 API 返回数据
- **THEN** 响应类型 SHALL 包含 `extra_display_properties` 字段

---

## ADDED Requirements

### Requirement: 描述弹窗支持 Markdown 渲染

`ExtraPropertyDescriptionPopover` 组件 SHALL 以 Markdown 格式渲染 description 内容，并支持多行文本展示。

#### Scenario: Markdown 格式渲染

- **WHEN** 用户点击 ℹ️ 图标打开描述弹窗
- **THEN** 弹窗 SHALL 使用 ReactMarkdown 渲染 description 内容
- **AND** 支持的格式 SHALL 包括：粗体、斜体、有序/无序列表、代码块、链接

#### Scenario: 多行文本支持

- **WHEN** description 包含换行符或多段文本
- **THEN** 弹窗 SHALL 正确展示多行内容
- **AND** 弹窗 SHALL 设置最大高度（max-h-48）并在超出时显示垂直滚动条

#### Scenario: 弹窗宽度

- **WHEN** 弹窗展示时
- **THEN** 弹窗宽度 SHALL 为 w-80（320px），比原来的 w-64 更宽，以容纳格式化内容
