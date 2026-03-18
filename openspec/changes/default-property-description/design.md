## Context

当前 ExtraPropertyDescriptionPopover 以纯文本渲染 description，不支持格式化。Extra properties 支持在 workspace 设置页配置 description，并在 issue 详情侧边栏通过 ℹ️ 图标浮层显示。但默认属性（Priority、Reporter 等）没有任何 description 机制。

本次变更纯前端实现，不涉及后端 API 变更。

## Goals / Non-Goals

**Goals:**

- 升级 ExtraPropertyDescriptionPopover 支持 Markdown 渲染和多行展示
- 为默认属性提供 description 配置入口（work item type 设置页）
- 在 issue 详情侧边栏，当 description 存在且 issue 有 type 时，显示 ℹ️ 图标

**Non-Goals:**

- 后端持久化（纯前端 localStorage）
- 属性的显示/隐藏控制
- 多语言支持（description 内容由用户自行输入）
- 创建表单中的 ℹ️ 图标展示

## Decisions

### 决策 1：使用 localStorage + MobX Store 存储配置

**选择**：新建 `DefaultPropertyConfigStore`，初始化时从 localStorage 读取，写入时同步到 localStorage。

**数据结构**：

```
localStorage key: "plane-default-prop-config"
value: {
  [workspaceSlug]: {
    [issueTypeId]: {
      [propertyKey]: { description: string }
    }
  }
}
```

**理由**：无需后端变更，MobX store 保证 React 响应式更新，localStorage 提供跨页面持久化。

**备选**：直接 sessionStorage / useState — 不跨页面，体验差，排除。

---

### 决策 2：可配置属性列表（硬编码）

**选择**：在前端用常量定义 10 个可配置的默认属性，state 和 type_id 不在列表中（不允许配置 description）：

```ts
export const CONFIGURABLE_DEFAULT_PROPERTIES = [
  { key: "created_by", label: "Reporter" },
  { key: "assignee_ids", label: "Assignees" },
  { key: "priority", label: "Priority" },
  { key: "label_ids", label: "Labels" },
  { key: "start_date", label: "Start Date" },
  { key: "target_date", label: "Due Date" },
  { key: "estimate_point", label: "Estimate" },
  { key: "module_ids", label: "Modules" },
  { key: "cycle_id", label: "Cycle" },
  { key: "parent_id", label: "Parent" },
] as const;
```

**理由**：state 和 type_id 是核心工作流字段，无需用户补充说明。

---

### 决策 3：description 弹窗编辑位置

**选择**：description 编辑仅在 work item type **设置页**进行（inline textarea），侧边栏弹窗为**只读 Markdown 展示**。

**理由**：与 extra properties 的 description 体验一致（extra properties 的 description 也在设置页编辑，侧边栏只读展示）。实现更简单，职责分离清晰。

---

### 决策 4：Markdown 渲染复用现有 MarkdownRenderer

**选择**：升级 `ExtraPropertyDescriptionPopover` 时，直接复用 `core/components/ui/markdown-to-component.tsx` 中的 `MarkdownRenderer`。

**理由**：`react-markdown` 已在 apps/web 中声明依赖，`MarkdownRenderer` 已有可用的组件映射，无需引入新依赖。

---

### 决策 5：type_id 为 null 时不显示 ℹ️

**选择**：在侧边栏，当 `issue.type_id` 为 null 时，不查找也不显示任何默认属性的 description。

**理由**：语义准确——没有 type 就没有 type 级别的配置。实现最简单，无额外逻辑分支。

## Risks / Trade-offs

- **localStorage 无法跨设备/跨用户同步** → 已知限制，纯前端实现的固有约束，用户已知情接受
- **sidebar.tsx 是上游高频修改文件** → 修改量最小化（仅加 appendElement），降低 rebase 冲突概率
- **MarkdownRenderer 的 h1/h3 样式偏大** → 弹窗内 description 建议用户写普通段落和列表，不写标题；可在弹窗内覆盖样式

## Open Questions

无。
