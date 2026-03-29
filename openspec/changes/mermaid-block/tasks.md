## 1. 提交变更文档

- [ ] 1.1 提交 openspec/changes/mermaid-block/ 目录下所有文档（proposal.md、design.md、specs/、tasks.md）到 git

## 2. 依赖准备

- [ ] 2.1 在 `packages/editor/package.json` 中添加 `mermaid` 依赖（运行时依赖，懒加载使用）
- [ ] 2.2 执行 `pnpm install` 确认依赖安装成功

## 3. 注册节点类型常量

- [ ] 3.1 [UPSTREAM-RISK] 在 `packages/editor/src/core/constants/extension.ts` 的 `CORE_EXTENSIONS` 枚举中添加 `MERMAID_BLOCK = "mermaidBlock"`
- [ ] 3.2 在 `BLOCK_NODE_TYPES` 数组中添加 `CORE_EXTENSIONS.MERMAID_BLOCK`

## 4. 创建 Mermaid 扩展

- [ ] 4.1 新建 `packages/editor/src/core/extensions/mermaid/types.ts`，定义节点 attribute 类型
- [ ] 4.2 新建 `packages/editor/src/core/extensions/mermaid/extension.ts`，定义 TipTap Node schema：
  - `content: "text*"`、`group: "block"`、`code: true`
  - `parseHTML`：匹配 `<pre data-type="mermaidBlock">` 解析为 mermaidBlock 节点
  - `renderHTML`：输出 `<pre data-type="mermaidBlock"><code class="language-mermaid">...</code></pre>`
  - `addInputRules`：支持 ` ```mermaid ` 触发规则
  - `addNodeView`：返回 `ReactNodeViewRenderer(MermaidBlockNodeView)`
- [ ] 4.3 新建 `packages/editor/src/core/extensions/mermaid/node-view.tsx`，实现 React NodeView：
  - 编辑模式（`editor.isEditable = true`）：显示代码编辑区（`NodeViewContent as="code"`），顶部显示 "Mermaid 图表" 标签
  - 查看模式（`editor.isEditable = false`）：`useEffect` 中动态 `import('mermaid')` 并调用 `mermaid.render()`，成功时渲染 SVG，失败时显示错误提示，代码为空时显示占位提示
  - 加载中状态：显示 loading 占位
- [ ] 4.4 新建 `packages/editor/src/core/extensions/mermaid/index.ts`，导出扩展

## 5. 注册扩展到编辑器

- [ ] 5.1 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/index.ts` 中导出 `MermaidBlockExtension`
- [ ] 5.2 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/extensions.ts` 的 `CoreEditorExtensions` 中导入并注册 `MermaidBlockExtension`

## 6. 添加 Slash Command

- [ ] 6.1 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx` 中添加 Mermaid 条目：
  - `commandKey: "mermaid"`，`key: "mermaid"`
  - `title: "Mermaid 图表"`，`description: "插入 Mermaid 流程图、时序图等图表"`
  - `searchTerms: ["mermaid", "diagram", "flowchart", "图表", "流程图"]`
  - `command`：调用 `editor.chain().focus().deleteRange(range).setMermaidBlock().run()`

## 7. 提交实现代码

- [ ] 7.1 提交新增文件：`#FICC-9999# feat: 新增 mermaid 图表代码块扩展（节点类型、NodeView、依赖）`
- [ ] 7.2 提交修改文件：`#FICC-9999# feat: 注册 mermaid 扩展到编辑器及 slash command`

## 8. 用户验证

- [ ] 8.1 在编辑 issue 描述时，输入 `/mermaid`，确认 Slash Command 菜单出现 "Mermaid 图表" 条目，点击后插入空的 mermaid 代码块
- [ ] 8.2 在 mermaid 代码块中输入有效的 Mermaid 语法（如 `graph TD\n  A-->B`），切换到查看模式，确认渲染出图形
- [ ] 8.3 在 mermaid 代码块中输入无效语法，切换到查看模式，确认显示错误提示而非崩溃
- [ ] 8.4 在编辑器中输入 ` ```mermaid ` 后按 Space，确认自动转换为 mermaid 代码块节点
- [ ] 8.5 保存 issue 并重新加载页面，确认 mermaid 图表持久化正常（HTML 序列化/反序列化）
- [ ] 8.6 在查看模式打开含 mermaid 节点的 issue，通过浏览器 DevTools Network 面板确认 mermaid 库为懒加载（不在主 bundle 中）
