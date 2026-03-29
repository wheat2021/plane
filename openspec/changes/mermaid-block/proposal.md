## Why

Issue 描述中目前缺乏对图表类内容的原生支持，用户无法在 issue 中嵌入流程图、时序图、类图等可视化内容。通过引入 Mermaid 代码块节点类型，用户可以在编辑时书写 Mermaid 语法，在查看时直接看到渲染后的图形，无需借助外部工具或截图。

## What Changes

- 新增 `mermaidBlock` TipTap 节点类型（独立于现有 `codeBlock`）
- 编辑模式下：显示 Mermaid 代码编辑区域（支持正常文本编辑）
- 查看模式下：将 Mermaid 代码渲染为 SVG 图形，语法错误时显示错误提示
- 支持 ` ```mermaid ` 输入规则（键入即自动转换）
- 注册为 Slash Command 条目（`/Mermaid` 可插入节点）
- HTML 序列化格式与标准 mermaid 代码块兼容（`<pre><code class="language-mermaid">`）
- 懒加载 mermaid 库（减少首屏包体积影响）

## Capabilities

### New Capabilities

- `mermaid-block`: Issue 描述中可插入 Mermaid 图表节点，编辑时显示代码，查看时渲染为图形

### Modified Capabilities

（无现有 spec 级别需求变更）

## Impact

**前端代码**：

- `packages/editor/src/core/extensions/mermaid/` — 新增扩展目录（4 个文件）
- `packages/editor/src/core/constants/extension.ts` — 新增 `MERMAID_BLOCK` 枚举值
- `packages/editor/src/core/extensions/extensions.ts` — 注册新扩展
- `packages/editor/src/core/extensions/index.ts` — 导出新扩展
- `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx` — 添加 Mermaid slash command

**依赖**：

- 新增 `mermaid` npm 包到 `packages/editor/package.json`（懒加载，不影响首屏）

**上游冲突风险**：

- `extensions.ts`、`slash-commands/command-items-list.tsx`、`constants/extension.ts` 均为上游文件，但只做追加操作，合并冲突风险低
- 新增的 `mermaid/` 目录完全为本地新增，无冲突风险
