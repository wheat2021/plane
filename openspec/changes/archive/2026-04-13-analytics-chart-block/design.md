## Context

Plane 富文本编辑器基于 TipTap，已有两个类似的 Block 扩展：`mermaidBlock`（Mermaid 代码 → SVG）和 `drawioBlock`（XML → Draw.io iframe）。两者均以 React NodeView 渲染，通过悬浮工具栏切换模式，是本功能的直接参考模型。

当前分析功能（`advance-analytics-charts` API）已支持工作空间及项目级图表查询，propel 包已提供 bar、line、area、pie、radar、treemap 六种图表组件。两个层面均无需后端改动。

## Goals / Non-Goals

**Goals:**

- 在编辑器中插入 `analyticsChart` Block 节点
- 默认预览模式渲染实时图表，悬浮浮出配置/预览切换按钮
- 配置模式：可视化面板选择图表类型和参数，x_axis 选项按图表类型联动过滤
- 支持跨项目数据查询（project_ids 可为空表示全 workspace）
- 权限不足或 API 失败时显示清晰错误提示

**Non-Goals:**

- 不保存到独立分析视图/页面（配置随 description 存储）
- 不支持 Scatter 图（需要两个数值维度，与当前 count 数据模型不匹配）
- 不支持图表导出（CSV 导出属于 Analytics 页面功能）
- 不修改后端 API

## Decisions

### 决策 1：使用 atom 节点 + node attributes 存储配置（而非 text content）

**选择**：`atom: true`，通过 `addAttributes()` 存储 JSON 配置，`renderHTML` 序列化为 `data-config=<base64(JSON)>`。

**理由**：Mermaid/DrawIO 用 `content: "text*"` 是因为内容本身是用户编辑的文本（Mermaid DSL、XML）。Analytics 配置是结构化数据，不需要用户直接编辑"源码"，atom 节点更语义清晰，也避免用户意外编辑内部 JSON。

**备选**：text content + JSON 字符串。缺点：需要源码模式，JSON 对用户暴露，模式切换逻辑复杂。

---

### 决策 2：配置面板内联展开（非全屏 Modal）

**选择**：配置模式在节点内部展开，替换图表区域，顶部固定工具栏（图表类型选择 + 参数行），下方实时预览。

**理由**：DrawIO 需要全屏是因为 Draw.io 编辑器本身要求大画布。Analytics 参数配置只有 5-6 个下拉框，内联展开体验更轻量，且可实时看到图表变化（live preview）。

**备选**：浮层/Popover。问题：宽度不够展示图表类型选择器和参数，且 Popover 在编辑器 z-index 中容易被裁剪。

---

### 决策 3：图表类型约束 x_axis 选项

**选择**：在配置面板中，图表类型变更时动态过滤 x_axis 下拉选项。

```
Line / Area  →  x_axis 仅显示日期属性 (start_date, target_date, created_at, completed_at)
Pie          →  自动清空 group_by，隐藏 group_by 选择器
其余类型      →  x_axis 显示全部属性
```

**理由**：防止用户配置出无意义的图表（如折线图按 Priority 分组，x 轴无时间含义）。

---

### 决策 4：workspaceSlug 从 React Context 获取，不存入节点属性

**选择**：NodeView 组件通过 `useParams()` 或编辑器 `extendedEditorProps` 传入 workspaceSlug，不存入节点的 `data-config`。

**理由**：workspaceSlug 是运行时环境变量，随 URL 变化。如果存入节点，文档在不同 workspace 间迁移时会出错。节点只存"查询参数"（x_axis、project_ids 等），不存环境信息。

**实现**：通过 TipTap `extendedEditorProps` 机制向节点传递 context（现有 `getEditorMetaData` 机制，`work-item-embed` 已采用此模式）。

---

### 决策 5：只读模式仍渲染实时图表

**选择**：只读状态（预览/详情页）下仍然调用 API 渲染实时图表，隐藏配置按钮。

**理由**：实时数据对读者同样有价值，图表在只读环境下也应有意义。

**错误处理**：API 失败（含 403 权限不足）时显示带图标的错误提示框，不静默失败。

## Risks / Trade-offs

| 风险                                                | 缓解措施                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 大量图表节点同时发起 API 请求，导致性能问题         | 使用 SWR/useSWR，相同参数命中缓存；节点进入视口才发起请求（Intersection Observer，后续可选） |
| 编辑器 extendedEditorProps 传递机制需要验证         | 参考 `work-item-embed` 实现，该节点已用此模式传递 workspaceSlug 和 projectId                 |
| propel 图表组件版本与分析页现有用法不一致           | 复用 `priority-chart.tsx` 中现有的 BarChart 调用方式，其他类型参照相同模式                   |
| 上游 `extensions.ts`、`command-items-list.tsx` 冲突 | 改动量小（各新增一行），冲突时手动解决较简单                                                 |

## Migration Plan

纯新增功能，无需数据迁移或部署步骤。

- 不修改现有数据模型
- 不修改 API
- 编辑器扩展默认不加载（需显式注册），不影响现有文档渲染

## Open Questions

- `extendedEditorProps` 的具体传递方式需要查阅 `work-item-embed` 节点的实现细节以确认 workspaceSlug 传递路径（实现时验证）
- Pie 图无 group_by 时是否显示全部 x_axis 分类（无数量上限），还是限制最多 N 个分类？（建议实现时保持与分析页一致）
