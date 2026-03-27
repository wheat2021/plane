## Context

上一次变更（`default-property-description-tooltip-unify`）已实现：

- `DefaultPropertyConfigStore`：localStorage 存储每个默认属性的 `description`
- `DefaultPropertyTooltip`：基于 `@plane/propel/tooltip` 的统一 ℹ️ 组件
- 在 sidebar、peek-overview、main-content、create form 展示 description tooltip

本次变更在此基础上新增 `alias` 配置，并修复已发现的 `setDescription` 覆盖 bug，同时统一废弃 `ExtraPropertyDescriptionPopover` 旧组件。

当前的 `DefaultPropertyConfigStore` 存储结构：

```typescript
{ [workspaceSlug]: { [issueTypeId]: { [propertyKey]: { description: string } } } }
```

当前 `setDescription` 存在 bug：用 `{ description }` 直接覆盖整个 property 对象，加入 `alias` 后两者会互相覆盖。

## Goals / Non-Goals

**Goals:**

- 新增 `alias` 字段存储和读取，支持为每个默认属性设置自定义 label
- 修复 `setDescription` 覆盖 bug，改为合并写入
- 在设置页 UI 添加 alias 输入框（与 description 并排）
- 在所有渲染位置用 alias 替换默认属性 label
- 在全屏详情 / peek-overview 为 title、description 字段新增条件性 label 行
- 将 `ExtraPropertyDescriptionPopover` 完全迁移到 `DefaultPropertyTooltip`，删除旧文件

**Non-Goals:**

- 后端持久化 alias/description（保持 localStorage 方案）
- 对 extra（自定义）属性的 alias 支持（那些属性用 `config.label` 字段本身）
- state / work_item_type 这两个默认属性的 alias 支持（不在 CONFIGURABLE_DEFAULT_PROPERTIES 中）

## Decisions

### 决策 1：存储结构向后兼容扩展

将 `{ description: string }` 扩展为 `{ alias?: string; description?: string }`，读取时用 `?? ""` 保持现有行为。

**理由**：已有 localStorage 数据只有 `description` 字段，扩展后仍可正常读取，无需迁移。

### 决策 2：setAlias / setDescription 使用合并写入

```typescript
setAlias(ws, typeId, key, alias) {
  const existing = this.data[ws]?.[typeId]?.[key] ?? {};
  set(this.data, [ws, typeId, key], { ...existing, alias });
  this._saveToStorage();
}
```

`setDescription` 同样改为合并写入，修复现有 bug。

### 决策 3：渲染侧用 helper 函数封装 alias 逻辑

各组件新增 `defaultPropLabel(key, fallback)` helper（或等价逻辑），返回 `alias || fallback`，保持单一职责：

```typescript
const defaultPropLabel = (key: string, fallback: string) => {
  if (!issue.type_id) return fallback;
  return getAlias(workspaceSlug, issue.type_id, key) || fallback;
};
```

**理由**：避免在 JSX 中内联三元表达式，可读性更好，也便于测试。

### 决策 4：main-content / peek-overview 新增条件性 label 行

当 `alias` 或 `description` 任一已配置时，在 title/description 字段上方渲染 label 行，同时将 ℹ️ 图标从旧位置（右侧浮动 / reaction 旁）移入 label 行：

```
[alias || t("common.title")] [ℹ️]   ← 条件性 label 行
[IssueTitleInput]
```

当两者均未配置时，不渲染 label 行（与之前完全一致）。

**理由**：与 create form 的 label 行风格保持一致；ℹ️ 放在 reaction 旁边位置语义不清晰。

### 决策 5：create form 保持现有 label 行，仅替换文字

create form 已有 `{t("title")}` label 行，只需将文字替换为 `alias || t("title")`，不改变布局。

### 决策 6：统一 tooltip 组件，删除旧组件

`ExtraPropertyDescriptionPopover`（click-to-toggle，自定义 div）迁移至 `DefaultPropertyTooltip`（hover，Radix Tooltip）。

受影响文件：

- `issue-modal/form.tsx`：`formPropAppend` 改用 `DefaultPropertyTooltip`
- `extra-property-renderer.tsx`：`ExtraPropertyDescriptionPopover` → `DefaultPropertyTooltip`
- `description-popover.tsx`：删除

**理由**：hover tooltip 对"信息说明"场景更符合交互预期；减少一个组件的维护负担。

### 决策 7：config UI 方案 A（并排输入）

```
[label w-28]  [alias input w-28]  [description textarea flex-1]
```

alias 使用 `<input type="text">`（单行），description 保留 `<textarea>`（可多行）。

**理由**：改动量最小，不改变现有布局行数。

## Risks / Trade-offs

- **hover vs click 行为变化** → 旧组件是 click-to-toggle，新组件是 hover。对于已习惯 click 的用户可能有感知。缓解：hover 是更自然的 tooltip 交互，且 Radix Tooltip 也支持 touch/键盘。
- **description-popover.tsx 删除** → 若将来有分支依赖该文件会产生合并冲突。缓解：删除前确认所有使用方已迁移（全局搜索确认）。
- **上游 sidebar.tsx / main-content.tsx / form.tsx 冲突** → 这些文件上游持续变化。缓解：改动集中在特定 helper 函数和 label props，最小化冲突面。
