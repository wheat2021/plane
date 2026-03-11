## Context

工作项类型（IssueType）是工作区级别实体，存储在 `issue_types` 表。目前数据库模型已完备（name、description、logo_props、is_active、level 等字段），但后端仅有 `GET /api/workspaces/{slug}/issue-types/` 接口，无法在 UI 中创建或修改类型。前端图标渲染也是按类型名硬编码，没有实际读取 `logo_props`。

本次变更在工作区设置中新增 Work Item Types 管理页，补齐完整 CRUD 能力。

**关键约束**：

- 工作项类型是工作区共享实体，所有项目共用同一个类型列表
- 项目设置页（project settings → work item types）现有功能不变，只管理类型与 extra properties 的绑定关系
- 系统内置类型（Task、Bug、Story、Requirement、Milestone、Report）不可删除、不可改名，但可编辑图标和颜色

## Goals / Non-Goals

**Goals：**

- 工作区管理员可在 UI 中增删改查工作项类型
- 支持编辑图标（Lucide 可搜索选择）、颜色（色板 + HEX 输入）、名称、说明
- 删除类型时执行全局级联迁移（所有项目的工作项迁移到各项目默认类型）
- 支持拖拽排序（写入 `level` 字段）
- 修复图标渲染：实际读取 `logo_props` 而非按名称硬编码

**Non-Goals：**

- 工作项类型的多语言名称（名称/说明存储单一字符串，方案 A）
- 项目设置页的任何改动
- 类型间的继承或层级关系

## Decisions

### Decision 1：用 `is_system` 字段区分系统类型

**选择**：在 `IssueType` 模型上新增 `is_system = BooleanField(default=False)`，通过 migration 将现有内置类型（Task、Bug、Story、Requirement、Milestone、Report）标记为 `is_system=True`。

**理由**：当前代码用 `name.lower() == "task"` 的字符串硬判断来保护 Task 类型，脆弱且不一致。`is_system` 字段提供统一、可靠的标记，前后端均可依赖。用 `external_source` 字段来承担这个语义不合适（其语义是"外部导入来源"）。

**对系统类型的限制**：

- `is_system=True`：不可删除、不可改名（name 字段只读）、可编辑 logo_props（图标+颜色）和 description
- `is_system=False`（自定义类型）：可删除、可改名、可编辑所有字段

### Decision 2：图标选择器复用 `CustomSearchSelect`

**选择**：基于 `@plane/ui` 中现有的 `CustomSearchSelect` 组件封装 `LucideIconPicker`。图标数据从 `lucide-react` 包静态导出所有 PascalCase 导出名，转换为 kebab-case 备用列表。query 为空时显示"输入关键词搜索图标"提示（不渲染所有 1748 个 option，避免性能问题）。

**颜色选择**：预设 12 色色板 + 可选 HEX 手动输入，复用 `@plane/ui` 中已有的 `ColorPicker` 组件。

**存储格式**：与现有 `logo_props` 格式完全一致：

```json
{ "in_use": "icon", "icon": { "name": "bug", "color": "#ef4444" } }
```

### Decision 3：删除策略——全局级联 + 软删除

**选择**：

1. 找到所有含该类型的 `ProjectIssueType` 记录
2. 对每个项目：将该类型的工作项 `type_id` 迁移到该项目当前默认类型
3. 删除所有 `ProjectIssueType` 绑定记录
4. 将 `IssueType.is_active` 设为 `False`（软删除）

**理由**：软删除保留历史外键引用（ActivityLog 等），与现有 `is_active` 过滤模式一致。后端用 `transaction.atomic()` 保证原子性。

**边缘情况**：若某项目只启用了该类型，后端应拒绝（返回 400），前端提示"请先为这些项目启用其他类型"。

### Decision 4：拖拽排序复用现有 Sortable 基础设施

**选择**：复用项目中已有的基于 `@atlaskit/pragmatic-drag-and-drop` 的 Sortable 组件（extra properties 绑定列表已有实现）。排序后批量调用 PATCH 接口更新每个类型的 `level` 值，或新增 `PATCH /api/workspaces/{slug}/issue-types/reorder/` 批量接口。

**选择批量 PATCH 单个记录**（而非专用 reorder 接口），保持接口简单。

### Decision 5：前端 icon 渲染修复

**选择**：修改 `getIssueTypeIcon` 函数，优先读取 `logo_props.icon`，仅当 `logo_props` 为空时回退到按名称硬编码（向后兼容旧数据）。动态渲染用 `toPascalCase(iconName)` 从 `lucide-react` 取组件：

```typescript
// kebab-case "circle-check" → PascalCase "CircleCheck"
const iconKey = toPascalCase(iconName);
const IconComponent = (icons as Record<string, LucideIcon>)[iconKey];
```

## Risks / Trade-offs

**[风险] 删除时某项目只有一种类型** → 后端检测并返回 400，前端展示具体项目名称，引导管理员先为该项目启用其他类型

**[风险] 图标搜索 1748 项性能** → query 为空时不渲染列表，仅在输入关键词后过滤渲染，已缓解

**[风险] logo_props 历史数据格式不一致** → `getIssueTypeIcon` 保留 name 硬编码兜底，迁移透明

**[风险] i18n 中文 key 与上游 en 文件合并冲突** → 上游只维护 `en/translations.ts`，我们的新增 key 在独立 namespace 下（`workspace_settings.settings.work_item_types`），冲突概率低，但 rebase 时需检查

**[Trade-off] 单语言存储** → 类型名称和说明不支持多语言（用户输入什么存什么）。系统内置类型名称前端可按 `is_system` 做 i18n 映射（如 `t("system_types.task")`），自定义类型展示原始字符串

## Migration Plan

1. **后端 migration**（先部署）：新增 `is_system` 字段，回填内置类型标记
2. **后端新增接口**：POST/PATCH/DELETE workspace issue-types
3. **前端部署**：新增管理页，修复图标渲染，新增 i18n key
4. **回滚**：前端回滚不影响数据；后端 migration 可 reverse（`is_system` 字段默认 False）

## Open Questions

- 系统内置类型名称是否需要前端 i18n 映射（`t("system_types.bug")` → "缺陷"）？目前按方案 A+ 预留，暂不实现，等后续确认
