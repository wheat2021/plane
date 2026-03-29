## Context

Plane 的 Issue 描述使用基于 TipTap 的富文本编辑器（`@plane/editor` 包）。编辑器已有多种自定义节点扩展：`callout`、`custom-image`、`work-item-embed` 等，每种都通过独立目录组织（extension + NodeView）。

当前编辑器存在 `codeBlock` 扩展，支持语法高亮，但不支持将代码渲染为图形。Mermaid 是一种流行的基于文本的图表工具，支持流程图、时序图、类图、甘特图等。目标是让用户能在 Issue 描述中直接嵌入这类图表。

## Goals / Non-Goals

**Goals:**

- 新增 `mermaidBlock` 独立节点类型（不修改现有 `codeBlock`）
- 编辑模式（`editor.isEditable = true`）：显示可编辑的 Mermaid 代码区域
- 查看模式（`editor.isEditable = false`）：渲染为 SVG 图形，语法错误时显示明确的错误提示
- 支持 ` ```mermaid ` 输入规则自动转换
- 注册为 Slash Command（`/mermaid`）
- HTML 序列化兼容标准代码块格式，以便降级展示
- 懒加载 mermaid 库，不影响首屏性能

**Non-Goals:**

- 实时双栏预览（编辑时同时显示代码和图形）
- 支持 Mermaid 主题定制
- 与后端 API 的变更（纯前端功能）

## Decisions

### 决策 1：独立节点 vs 扩展现有代码块

**选择**：独立 `mermaidBlock` 节点

**理由**：

- 现有 `codeBlock` 有 lowlight 语法高亮、复制按钮等逻辑，与 Mermaid 渲染完全不同
- 独立节点可以有自己的 `parseHTML`/`renderHTML`，避免与代码块耦合
- 参考 `callout` 与 `blockquote` 的模式，自定义渲染节点应当独立
- 代价：需要约 4 个新文件，代码量与 callout 扩展相当

**备选方案**：在 `CodeBlockComponent` 中检测 `language === "mermaid"` 分支渲染

- 缺点：逻辑耦合，代码块组件职责膨胀，未来难以分离

### 决策 2：懒加载 mermaid

**选择**：在 NodeView 查看模式下动态 `import('mermaid')`

**理由**：

- mermaid 包体积约 3.5MB (unminified)，不应放入 editor bundle 主链路
- 只有在查看含有 mermaid 节点的文档时才需要加载
- 使用 `useEffect` + 动态 import，首次渲染时触发，后续由浏览器缓存

**存储格式**：

```html
<pre data-type="mermaidBlock"><code class="language-mermaid">graph TD\n  A-->B</code></pre>
```

使用 `data-type="mermaidBlock"` 属性区分 mermaid 节点与普通 `language-mermaid` 代码块，保证 `parseHTML` 精确匹配。

### 决策 3：编辑态 UI 实现

**选择**：使用 TipTap `NodeViewContent` 管理文本

**理由**：

- 与 `codeBlock` 保持一致的编辑体验
- 原生支持 ProseMirror 的撤销/重做历史
- 不需要手动同步 `<textarea>` 内容到文档

### 决策 4：mermaid 依赖放置位置

**选择**：添加到 `packages/editor/package.json`（非 devDependency）

**理由**：mermaid 在运行时动态 import，但 bundler 仍需知道它的存在。放在 editor 包中而不是 apps/web，保持依赖关系与扩展代码在同一包内。

## Risks / Trade-offs

- **[风险] mermaid 库 API 变化** → 固定 mermaid 版本，通过 catalog 管理
- **[风险] SSR 场景下 mermaid 依赖 browser API** → NodeView 仅在客户端渲染，`useEffect` 中调用 mermaid render 天然避开 SSR；如有 SSR，需确保代码路径在 `useEffect` 内
- **[风险] Mermaid 渲染错误时 SVG 为空** → try/catch 捕获，显示用户友好的错误提示（代码 + 错误信息）
- **[权衡] 查看模式下首次渲染有延迟**（需动态加载 mermaid） → 可接受，加载后浏览器缓存，仅首次有感知
- **[权衡] 上游文件修改风险低**：`extensions.ts`、`slash-commands/command-items-list.tsx`、`constants/extension.ts` 仅追加，rebase 时冲突概率低

## Migration Plan

纯前端新增功能，无数据迁移需求：

- 已有 issue 描述中若有 ` ```mermaid ``` ` 普通代码块，不受影响（仍渲染为代码块）
- 新节点使用 `data-type="mermaidBlock"` 标识，不会误匹配旧内容

## Open Questions

（无）
