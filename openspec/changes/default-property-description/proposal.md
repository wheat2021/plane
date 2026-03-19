## Why

Work item type 配置页已支持为自定义（extra）属性添加 description，通过 ℹ️ 图标在详情侧边栏浮层展示。但默认属性（Reporter、Priority 等）无法配置 description，导致团队无法为这些内置属性补充使用说明。同时现有弹窗仅支持纯文本，无法渲染格式化内容。

## What Changes

- 升级 `ExtraPropertyDescriptionPopover`：渲染从纯文本改为轻量 Markdown（SimpleMarkdown 内联组件），支持多行、滚动、弹窗方向控制
- 新增 `DefaultPropertyConfigStore`：基于 localStorage 的 MobX store，workspace + issueType 维度存储默认属性的 description（共 12 个属性，含 title 和 description）
- 在 work item type 展开面板中新增 "Default Properties" 区块，支持 inline 编辑各默认属性的 description（onChange 即时保存）
- 在 issue 详情侧边栏中，当属性有 description 且 issue 有 type 时，显示 ℹ️ 弹窗图标
- 在 issue 详情主内容区（main-content 和 peek-overview），title 和 description 字段也显示 ℹ️ 图标
- 在创建工作项表单（create form）中，title/description 字段新增标签行和条件性 ℹ️ 图标，与 Additional Properties 风格一致

## Capabilities

### New Capabilities

- `default-property-description`：为 work item type 的默认属性配置自定义 description，在侧边栏以 Markdown 弹窗展示

### Modified Capabilities

- `extra-properties-display`：升级描述弹窗（ExtraPropertyDescriptionPopover）支持 Markdown 渲染和多行文本

## Impact

**前端文件：**

- `core/components/issues/extra-properties/description-popover.tsx`（修改，SimpleMarkdown + align prop）
- `core/store/default-property-config.store.ts`（新建）
- `core/store/root.store.ts`（修改，注册新 store）
- `core/hooks/store/use-default-property-config.ts`（新建）
- `core/components/project-work-item-types/default-property-config-list.tsx`（新建）
- `core/components/project-work-item-types/work-item-type-item.tsx`（修改，挂载新面板）
- `core/components/issues/issue-detail/sidebar.tsx`（修改，加 ℹ️ 图标）
- `core/components/issues/issue-detail/main-content.tsx`（修改，title/description ℹ️ 图标）
- `core/components/issues/peek-overview/issue-detail.tsx`（修改，title/description ℹ️ 图标）
- `core/components/issues/issue-modal/form.tsx`（修改，创建表单标签行 + ℹ️ 图标）

**依赖：** 无新增外部依赖，使用内联 SimpleMarkdown 组件

**无后端变更**，纯前端实现。

**上游冲突风险：**

- `sidebar.tsx`：上游持续迭代，中等风险
- `description-popover.tsx`：自定义文件，低风险
- `root.store.ts`：上游不常改，低风险
