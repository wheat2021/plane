## ADDED Requirements

### Requirement: 插入 Draw.io 图表节点

系统 SHALL 允许用户在富文本编辑器中插入 `drawioBlock` 节点类型，用于承载 draw.io 图表。

#### Scenario: 通过 Slash Command 插入

- **WHEN** 用户在编辑器中输入 `/` 并搜索 "drawio"
- **THEN** Slash Command 菜单显示 "Draw.io 图表" 条目，选择后在光标位置插入一个空的 `drawioBlock` 节点

#### Scenario: 通过输入规则插入

- **WHEN** 用户在编辑器中输入 ` ```drawio ` 后按 Space 或 Enter
- **THEN** 当前段落自动转换为 `drawioBlock` 节点

### Requirement: 三模式显式切换

`drawioBlock` 节点 SHALL 提供 `编辑`、`预览`、`源代码` 三个显式按钮，模式切换只能由用户点击触发。

#### Scenario: 默认模式

- **WHEN** 新建或首次插入 `drawioBlock` 节点
- **THEN** 节点默认进入 `源代码` 模式

#### Scenario: 禁止隐式切换

- **WHEN** 编辑器在可编辑/只读状态之间切换
- **THEN** `drawioBlock` 当前模式不因全局编辑状态自动切换

### Requirement: 编辑模式为全屏 Modal 内嵌编辑器

系统 SHALL 在 `编辑` 模式下以全屏 Modal 打开 draw.io iframe 编辑器，并通过 JSON 协议完成加载与保存。

#### Scenario: 打开编辑器并加载 XML

- **WHEN** 用户点击 `编辑` 按钮
- **THEN** 系统打开全屏 Modal，等待 iframe `init` 事件后发送 `{action: 'load', xml: <mxfile...>}`

#### Scenario: 手工保存回源码

- **WHEN** 用户在 draw.io 编辑器内点击保存并触发 `save` 事件
- **THEN** 系统将返回 XML 写回当前节点源码缓存，并在用户确认前不自动提交到文档持久层

### Requirement: 源代码模式仅接受 mxfile

系统 SHALL 在 `源代码` 模式中仅接受 `mxfile` XML，且在切换到预览或编辑前执行格式校验。

#### Scenario: 合法 mxfile

- **WHEN** 用户输入以 `<mxfile` 开头且结构合法的 XML
- **THEN** 系统允许切换到 `预览` 或 `编辑` 模式

#### Scenario: 非法 XML 或非 mxfile

- **WHEN** 用户输入非 XML 或 `<mxGraphModel>` 裸结构
- **THEN** 系统阻止模式切换并显示结构错误提示

### Requirement: 预览模式内联展示并与源码一致

系统 SHALL 在 `预览` 模式内联展示基于当前源码 XML 渲染得到的图形，预览结果必须与当前 `mxfile` 对应。

#### Scenario: 源码切换到预览

- **WHEN** 用户在 `源代码` 模式编辑后点击 `预览`
- **THEN** 系统使用当前源码渲染图形并在节点内联展示

#### Scenario: 编辑器切回预览

- **WHEN** 用户在全屏编辑器保存后返回并点击 `预览`
- **THEN** 节点展示的图形与保存回来的 XML 一致

### Requirement: XML 外置资产化存储

系统 SHALL 将 draw.io XML 存储在资产系统（FileAsset + MinIO）中，文档内容中仅保留轻量引用信息。

#### Scenario: 保存文档

- **WHEN** 用户保存包含 `drawioBlock` 的文档
- **THEN** 系统上传或更新 XML 资产并在节点中存储 `asset_id` 引用，而不是内嵌完整 XML 文本

#### Scenario: 重新加载文档

- **WHEN** 用户再次打开文档
- **THEN** 系统根据节点 `asset_id` 拉取 XML 并恢复 `源代码`/`预览`/`编辑` 所需数据

### Requirement: Draw.io 服务默认使用内网容器

系统 SHALL 默认连接项目内网 draw.io 服务，不暴露用户级可配置地址。

#### Scenario: 开发环境接入

- **WHEN** 本地通过 `compose.dev.yml` 启动服务
- **THEN** draw.io 容器随环境启动，并可通过统一代理路径访问

#### Scenario: 生产环境接入

- **WHEN** 生产通过 `compose.prod.yml` 与 proxy 部署
- **THEN** draw.io 服务通过反向代理路径对前端可用，前端无需切换不同地址配置

### Requirement: 编辑器消息通信安全校验

系统 SHALL 对 draw.io iframe 的消息来源执行严格校验，仅处理受信任来源的协议消息。

#### Scenario: 可信消息

- **WHEN** 消息来源 `origin` 与 `source` 均匹配受信任 draw.io iframe
- **THEN** 系统处理 `init/load/save/exit` 等协议事件

#### Scenario: 非可信消息

- **WHEN** 消息来源不匹配受信任 origin 或 source
- **THEN** 系统忽略该消息且不更新节点数据
