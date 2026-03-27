## Why

上一次变更（`default-property-description`）已支持为默认属性配置 description（ℹ️ 图标提示），但混淆了两个独立概念：**alias**（替换属性 label）和 **description**（附加说明信息）。实际需要同时支持两种配置，并统一 tooltip 组件（消除 `ExtraPropertyDescriptionPopover` 旧组件的重复维护负担）。

## What Changes

- 扩展 `DefaultPropertyConfigStore`：在每个默认属性配置项中新增 `alias` 字段，并修复 `setDescription` 覆盖 bug（改为合并写入）
- 在设置页 `DefaultPropertyConfigList` 中，每行新增 alias 输入框（与 description 并排，方案A）
- 在所有渲染位置，当 alias 已配置时，用 alias 替换属性的默认 label 文字：
  - 侧边栏（`issue-detail/sidebar.tsx`）
  - Peek Overview Properties（`peek-overview/properties.tsx`）
  - 创建表单（`issue-modal/form.tsx`）title / description 字段标签
- 在全屏详情和 Peek Overview issue-detail 的 title / description 字段，新增条件性 label 行（当 alias 或 description 已配置时显示），同时将 ℹ️ 图标移入该 label 行
- **统一 tooltip 组件**：将 `ExtraPropertyDescriptionPopover` 的所有使用方迁移到 `DefaultPropertyTooltip`，并删除旧组件文件

## Capabilities

### New Capabilities

- `default-property-alias`：为 work item type 的默认属性配置自定义 alias，在侧边栏、详情页、创建表单中替换对应属性的 label 文字

### Modified Capabilities

- `default-property-description`：扩展存储结构以同时支持 alias 和 description；修复 setDescription 覆盖 bug；扩展设置页 UI 新增 alias 输入框
- `default-property-tooltip`：迁移 `ExtraPropertyDescriptionPopover` 至 `DefaultPropertyTooltip`，删除旧组件；同步调整 extra-property-renderer 使用新组件

## Impact

**前端文件：**

- `apps/web/core/store/default-property-config.store.ts`（修改，新增 alias 字段/方法，修复合并 bug）
- `apps/web/core/components/project-work-item-types/default-property-config-list.tsx`（修改，新增 alias 输入框）
- `apps/web/core/components/issues/issue-detail/sidebar.tsx`（修改，label 替换为 alias || fallback）
- `apps/web/core/components/issues/peek-overview/properties.tsx`（修改，同上）
- `apps/web/core/components/issues/issue-modal/form.tsx`（修改，alias label + 替换旧 tooltip 组件）
- `apps/web/core/components/issues/issue-detail/main-content.tsx`（修改，新增条件性 label 行，ℹ️ 重新定位）
- `apps/web/core/components/issues/peek-overview/issue-detail.tsx`（修改，同上）
- `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`（修改，替换旧 tooltip 组件）
- `apps/web/core/components/issues/extra-properties/description-popover.tsx`（**删除**）

**无后端变更**，纯前端实现。

**上游冲突风险：**

- `sidebar.tsx`：上游持续迭代，中等风险
- `main-content.tsx`：上游持续迭代，中等风险
- `form.tsx`：上游持续迭代，中等风险
- `extra-property-renderer.tsx`：自定义文件，低风险
- `default-property-config.store.ts`：自定义文件，低风险
