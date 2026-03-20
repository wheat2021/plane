## Context

当前 ExtraPropertyDescriptionPopover 以纯文本渲染 description，不支持格式化。Extra properties 支持在 workspace 设置页配置 description，并在 issue 详情侧边栏通过 ℹ️ 图标浮层显示。但默认属性（Priority、Reporter 等）没有任何 description 机制。

本次变更纯前端实现，不涉及后端 API 变更。

## Goals / Non-Goals

**Goals:**

- 升级 ExtraPropertyDescriptionPopover 支持 Markdown 渲染和多行展示
- 为默认属性提供 description 配置入口（work item type 设置页），含 title 和 description 在内共 12 个属性
- 在 issue 详情侧边栏，当 description 存在且 issue 有 type 时，显示 ℹ️ 图标
- 在 issue 详情主内容区（main-content / peek-overview），title 和 description 字段也显示 ℹ️ 图标
- 在创建工作项表单（create form）中，title/description 字段显示标签行和 ℹ️ 图标，与 extra properties 风格一致

**Non-Goals:**

- 后端持久化（纯前端 localStorage）
- 属性的显示/隐藏控制
- 多语言支持（description 内容由用户自行输入；UI 标签复用已有 i18n key）

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

### 决策 2：可配置属性列表（硬编码，共 12 项）

**选择**：在前端用常量定义 12 个可配置的默认属性，state 和 type_id 不在列表中（不允许配置 description）：

```ts
export const CONFIGURABLE_DEFAULT_PROPERTIES = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
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

**理由**：state 和 type_id 是核心工作流字段，无需用户补充说明。title 和 description 是最主要的字段，用户需要在创建/编辑时看到说明。

---

### 决策 3：description 弹窗编辑位置

**选择**：description 编辑仅在 work item type **设置页**进行（inline textarea），侧边栏弹窗和创建表单图标均为**只读 Markdown 展示**。

**理由**：与 extra properties 的 description 体验一致（extra properties 的 description 也在设置页编辑，侧边栏只读展示）。实现更简单，职责分离清晰。

---

### 决策 4：Markdown 渲染使用内联 SimpleMarkdown 组件（非 ReactMarkdown）

**选择**：升级 `ExtraPropertyDescriptionPopover` 时，使用内联实现的轻量 `SimpleMarkdown` 组件，支持粗体、斜体、无序列表基本语法。

**理由**：`remark-rehype@10.x`（react-markdown@8 的依赖）需要 `mdast-util-to-hast@^12`，但 root `package.json` pnpm override 强制锁定了 `mdast-util-to-hast@13.x`，导致构建报错。为避免修改 root override（可能影响其他包），改用零依赖的内联实现。

**实现**：`renderInline()` + `SimpleMarkdown` 组件，支持 `**粗体**`、`*斜体*`、`- 列表项`、空行段落。

**备选**：修改 root pnpm override — 风险面太大，可能影响编辑器等其他依赖，排除。

---

### 决策 5：type_id 为 null 时不显示 ℹ️

**选择**：在侧边栏和主内容区，当 `issue.type_id` 为 null 时，不查找也不显示任何默认属性的 description。

**理由**：语义准确——没有 type 就没有 type 级别的配置。实现最简单，无额外逻辑分支。

---

### 决策 6：description 设置页保存时机改为 onChange（非 onBlur）

**选择**：`DefaultPropertyConfigList` 在每次 `onChange` 时立即调用 `setDescription`，而非等到 `onBlur`。

**理由**：用户在输入后直接点击侧边栏属性查看效果，不经过 blur 事件，onBlur 存在数据未保存的时机问题。onChange 即时保存体验更一致，localStorage 写入成本低。

---

### 决策 7：ExtraPropertyDescriptionPopover 新增 align prop

**选择**：新增 `align?: "left" | "right"` 属性，控制浮窗展开方向，默认 `"left"`。

**理由**：title 图标位于主内容区右侧边缘，若浮窗向右展开会被容器裁剪。通过 `align="right"` 使浮窗向左展开，避免内容截断。

## Risks / Trade-offs

- **localStorage 无法跨设备/跨用户同步** → 已知限制，纯前端实现的固有约束，用户已知情接受
- **sidebar.tsx 是上游高频修改文件** → 修改量最小化（仅加 appendElement），降低 rebase 冲突概率
- **SimpleMarkdown 不支持完整 Markdown** → 弹窗内 description 建议用户使用段落、粗体、列表；不支持标题、表格、代码块

## Open Questions

无。
