# Work Item Type 显示和选择功能实现

## 目标

在 work items 列表视图和详情面板中添加 work item type 的显示和选择功能：

1. 列表视图：在 issue identifier 前面显示类型图标，点击可修改
2. 详情面板：在 Properties 区域添加 Type 属性行，支持下拉选择

## 实现方案

### 1. 创建独立的 IssueTypeDropdown 组件

**文件**: `apps/web/core/components/dropdowns/issue-type.tsx`

创建一个不依赖 React Hook Form 的独立下拉组件，参考 `PriorityDropdown` 的模式：

- 导出 `getIssueTypeIcon` 函数用于渲染类型图标
- 支持多种按钮变体：border、background、transparent
- 通过 `useIssueType` hook 获取 workspace 级别的类型列表
- 使用 Headless UI Combobox + Popper.js 实现下拉定位

### 2. 实现 IssueTypeIdentifier 组件

**文件**: `apps/web/ce/components/issues/issue-details/issue-identifier.tsx`

将原有空占位符实现为功能完整的组件：

- 支持只读模式（仅显示图标）和编辑模式（点击显示下拉框）
- 只读模式：当缺少 `issueId/projectId/workspaceSlug` 时自动启用
- 编辑模式：调用 `updateIssue` 更新 issue 的 `type_id`

同时更新 `IssueIdentifier` 组件：

- 在 identifier 前添加类型图标显示
- 根据 `displayProperties.issue_type` 控制是否显示

### 3. 详情面板添加 Type 属性

**文件修改**:

- `apps/web/core/components/issues/peek-overview/properties.tsx`
- `apps/web/core/components/issues/issue-detail/sidebar.tsx`

在 State 属性后添加 Type 属性行：

- 使用 `DropdownPropertyIcon` 作为属性图标
- 使用 `IssueTypeDropdown` 组件实现选择
- 样式与其他属性行保持一致

## Development Log

### 18:32 - 开始实现

读取现有代码了解架构：

- `PriorityDropdown` 组件模式
- `IssueTypeSelect` 组件（React Hook Form 版本）
- 详情面板 Properties 组件结构

### 18:35 - 创建 IssueTypeDropdown 组件

创建 `apps/web/core/components/dropdowns/issue-type.tsx`：

- 复用 `getIssueTypeIcon` 函数从 issue-type-select.tsx
- 实现三种按钮变体：BorderButton、BackgroundButton、TransparentButton
- 导出 `getIssueTypeIcon` 供其他组件使用

### 18:37 - 更新类型定义

修改 `packages/types/src/issues/issue-identifier.ts`：

- 扩展 `TIssueTypeIdentifier` 类型
- 添加 `issueId`、`projectId`、`workspaceSlug` 为可选字段
- 支持只读和编辑两种模式

### 18:38 - 实现 IssueTypeIdentifier 组件

更新 `apps/web/ce/components/issues/issue-details/issue-identifier.tsx`：

- 实现 `IssueTypeIconDisplay` 内部组件用于只读显示
- 更新 `IssueIdentifier` 在 identifier 前显示类型图标
- 实现 `IssueTypeIdentifier` 支持只读/编辑模式

### 18:39 - 添加详情面板 Type 属性

修改 `peek-overview/properties.tsx` 和 `issue-detail/sidebar.tsx`：

- 添加 `DropdownPropertyIcon` 和 `IssueTypeDropdown` 导入
- 在 State 属性后添加 Type 属性行
- 绑定 `issueOperations.update` 处理类型变更

### 18:40 - 添加翻译键

修改 `packages/i18n/src/locales/en/translations.ts`：

- 添加 `work_item_type: "Work item type"` 翻译键

### 18:42 - 修复类型错误

发现 `draft-issue-block.tsx` 使用旧版 `TIssueTypeIdentifier` 类型：

- 将类型参数改为可选
- 更新 `IssueTypeIdentifier` 支持只读模式

### 18:45 - 类型检查通过

所有 TypeScript 类型检查通过。

## 修改的文件

| 文件                                                               | 操作 | 说明                                           |
| ------------------------------------------------------------------ | ---- | ---------------------------------------------- |
| `apps/web/core/components/dropdowns/issue-type.tsx`                | 新建 | IssueTypeDropdown 组件                         |
| `packages/types/src/issues/issue-identifier.ts`                    | 修改 | 扩展 TIssueTypeIdentifier 类型                 |
| `apps/web/ce/components/issues/issue-details/issue-identifier.tsx` | 修改 | 实现 IssueTypeIdentifier，更新 IssueIdentifier |
| `apps/web/core/components/issues/peek-overview/properties.tsx`     | 修改 | 添加 Type 属性行                               |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx`         | 修改 | 添加 Type 属性行                               |
| `packages/i18n/src/locales/en/translations.ts`                     | 修改 | 添加翻译键                                     |

## 验证方法

1. 启动开发服务器: `pnpm dev`
2. 创建一个带有 type 的 work item
3. 验证列表视图中 identifier 旁显示类型图标
4. 点击 work item 打开详情面板
5. 验证 Properties 区域显示 Type 属性行
6. 点击 Type 下拉框，选择不同类型
7. 验证类型更改后列表和详情都正确更新

## Summary

成功实现了 Work Item Type 的显示和选择功能：

1. **IssueTypeDropdown** - 独立的下拉选择组件，支持多种按钮变体
2. **IssueTypeIdentifier** - 支持只读显示和点击编辑两种模式
3. **IssueIdentifier** - 在 identifier 前显示类型图标
4. **详情面板** - peek-overview 和 sidebar 都添加了 Type 属性行

所有 TypeScript 类型检查通过，代码遵循现有的设计模式和风格。
