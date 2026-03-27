## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal.md、design.md、specs/）
- [x] 1.2 提交信息：`#FICC-9999# docs: 新增 default-property-alias-and-description 变更文档`

## 2. 扩展 DefaultPropertyConfigStore

- [x] 2.1 修改 `apps/web/core/store/default-property-config.store.ts`：将存储类型中 `{ description: string }` 扩展为 `{ alias?: string; description?: string }`
- [x] 2.2 在接口 `IDefaultPropertyConfigStore` 中新增 `getAlias` 和 `setAlias` 方法声明
- [x] 2.3 实现 `getAlias = computedFn(...)` 方法，返回 `alias ?? ""`
- [x] 2.4 实现 `setAlias` 方法，使用合并写入（读取 existing 后 `{ ...existing, alias }`）
- [x] 2.5 修复 `setDescription`：改为合并写入（读取 existing 后 `{ ...existing, description }`），避免覆盖 alias

## 3. 统一 Tooltip 组件（删除旧组件）

- [x] 3.1 修改 `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`：将 `ExtraPropertyDescriptionPopover` 替换为 `DefaultPropertyTooltip`，更新 import
- [x] 3.2 修改 `apps/web/core/components/issues/issue-modal/form.tsx`：`formPropAppend` 中将 `ExtraPropertyDescriptionPopover` 替换为 `DefaultPropertyTooltip`，更新 import
- [x] 3.3 删除 `apps/web/core/components/issues/extra-properties/description-popover.tsx`
- [x] 3.4 验证：全局搜索确认 `ExtraPropertyDescriptionPopover` 无残留引用

## 4. 设置页 UI 新增 alias 输入框

- [x] 4.1 修改 `apps/web/core/components/project-work-item-types/default-property-config-list.tsx`：
  - 将 `drafts` state 从 `Record<string, string>` 改为 `Record<string, { alias: string; description: string }>`
  - 引入 `getAlias` 和 `setAlias`
  - 每行新增 `<input type="text" placeholder="Alias…">` 并排在 description textarea 左侧（固定宽度 `w-28`）
  - 实现 `handleAliasChange` 调用 `setAlias`
- [x] 4.2 验证：设置页中每个属性行显示并排的 alias input 和 description textarea

## 5. 侧边栏与 Peek Overview 属性面板 alias 替换 [UPSTREAM-RISK]

- [x] 5.1 修改 `apps/web/core/components/issues/issue-detail/sidebar.tsx`：
  - 引入 `getAlias`
  - 新增 `defaultPropLabel(key, fallback)` helper：返回 `getAlias(ws, typeId, key) || fallback`（type_id 为 null 时直接返回 fallback）
  - 将所有 `SidebarPropertyListItem` 的 `label={t("...")}` 替换为 `label={defaultPropLabel("key", t("..."))}`（8 个属性）
- [x] 5.2 修改 `apps/web/core/components/issues/peek-overview/properties.tsx`：同上
- [x] 5.3 验证：为 priority 配置 alias，侧边栏和 peek-overview 的 "Priority" label 替换为 alias

## 6. 创建表单 alias 标签替换 [UPSTREAM-RISK]

- [x] 6.1 修改 `apps/web/core/components/issues/issue-modal/form.tsx`：
  - 引入 `getAlias`
  - 新增 `formPropAlias(key, fallback)` helper：返回 `getAlias(ws, typeId, key) || fallback`（typeId/ws 为空时返回 fallback）
  - 将 title 标签 `{t("title")}` 替换为 `{formPropAlias("title", t("title"))}`
  - 将 description 标签 `{t("description")}` 替换为 `{formPropAlias("description", t("description"))}`
- [x] 6.2 验证：为 title 配置 alias，创建表单的 title 标签显示为 alias

## 7. 全屏详情与 Peek Overview 新增条件性 label 行 [UPSTREAM-RISK]

- [x] 7.1 修改 `apps/web/core/components/issues/issue-detail/main-content.tsx`：
  - 引入 `getAlias`
  - 重构 `mainPropAppend` 为 `mainPropLabelRow(key, fallback, align?)`：当 alias 或 description 任一非空时返回 label 行 `<div className="flex items-center gap-1"><span className="text-body-xs-medium text-secondary">{alias || fallback}</span>{desc && <DefaultPropertyTooltip .../>}</div>`，否则返回 null
  - title 区域：在 `<div className="flex items-start gap-1">` 前插入 `{mainPropLabelRow("title", t("common.title"), "right")}`，并**移除**旧的 `<div className="mt-1 flex-shrink-0">{mainPropAppend(...)}</div>`
  - description 区域：在 `<DescriptionInput>` 前插入 `{mainPropLabelRow("description", t("description"))}`，并**移除**旧的 `<div className="mt-4">{mainPropAppend("description")}</div>`
- [x] 7.2 修改 `apps/web/core/components/issues/peek-overview/issue-detail.tsx`：同上
- [x] 7.3 验证：为 title 配置 alias，全屏详情和 peek-overview 的 title 字段上方显示 alias label 行
- [x] 7.4 验证：均未配置时，全屏详情界面与变更前完全一致（无 label 行）

## 8. 提交实现代码

- [x] 8.1 提交 store 扩展：`#FICC-9999# feat: DefaultPropertyConfigStore 支持 alias 字段，修复 setDescription 合并 bug`
- [x] 8.2 提交 tooltip 统一：`#FICC-9999# refactor: 统一使用 DefaultPropertyTooltip，删除 ExtraPropertyDescriptionPopover`
- [x] 8.3 提交设置页 UI：`#FICC-9999# feat: DefaultPropertyConfigList 新增 alias 输入框`
- [x] 8.4 提交侧边栏与 peek-overview：`#FICC-9999# feat: 侧边栏和 peek-overview 支持默认属性 alias 替换 label`
- [x] 8.5 提交创建表单：`#FICC-9999# feat: 创建表单 title/description 标签支持 alias 替换`（已包含在 8.2 提交中）
- [x] 8.6 提交全屏详情：`#FICC-9999# feat: 全屏详情和 peek-overview 为 title/description 新增条件性 label 行`

## 9. 用户验证

- [x] 9.1 验证 alias 不覆盖 description：为 priority 设置 alias，再设置 description，刷新页面后两者均保留
- [x] 9.2 验证侧边栏 alias 替换：为 priority 配置 alias "紧急程度"，侧边栏 label 显示为"紧急程度"
- [x] 9.3 验证 ℹ️ 共存：为同一属性同时设置 alias 和 description，侧边栏显示 alias 文字且 ℹ️ 图标正常
- [x] 9.4 验证创建表单 alias：为 title 配置 alias "任务名称"，创建表单 title 标签显示"任务名称"
- [x] 9.5 验证全屏详情 label 行：为 title 配置 alias，全屏详情 title 字段上方出现 alias label 行
- [x] 9.6 验证无配置时无变化：清空所有 alias/description，全屏详情和侧边栏与原来完全一致
- [x] 9.7 验证 extra 属性 tooltip：自定义 extra 属性的 ℹ️ 图标仍可正常 hover 显示（迁移到 DefaultPropertyTooltip 后）
- [x] 9.8 验证 description-popover.tsx 已删除：全局搜索 `ExtraPropertyDescriptionPopover` 无任何引用

## 10. List/Kanban tooltip 改为显示 alias，统一 tooltip 字体样式

- [x] 10.1 修改 `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`：
  - 新增 `getAlias` 到 `useDefaultPropertyConfig()` 解构
  - 重构 `getCustomTooltipContent`：改为基于 `alias` 触发（无 alias 返回 null），
    内容从 `desc + value` 改为 `alias（text-caption-md-medium text-primary）+ value（text-caption-sm-regular text-secondary）`
- [x] 10.2 修改 `apps/web/core/components/issues/extra-properties/default-property-tooltip.tsx`：
  - 给 `<SimpleMarkdown>` 包装 `<div className="text-caption-sm-regular text-secondary">`，
    使 ℹ️ 浮窗字体样式与 list/kanban 标准 tooltip 保持一致
- [x] 10.3 提交：`#FICC-9999# feat: list/kanban tooltip 改为显示 alias，统一 info 图标浮窗字体样式`
- [x] 10.4 验证：为 priority 配置 alias，list view 悬停 priority 图标显示 alias + 属性值
- [x] 10.5 验证：为某属性配置 description，详情侧边栏 ℹ️ 图标浮窗字体样式与 list view tooltip 一致
