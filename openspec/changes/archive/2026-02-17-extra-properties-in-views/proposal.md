## Why

项目视图（Views）的 Display 面板目前仅支持显示/隐藏系统内置属性（如 State、Priority、Assignee 等），但无法控制工作空间级别定义的额外属性（Extra Properties）在各种视图布局（List、Kanban、Spreadsheet 等）中的显示。用户需要在视图中以统一风格展示这些自定义属性，同时对于给定工作项类型无效的属性需要以灰色不可操作状态呈现。

## What Changes

- 在 Views Display 面板中新增 Extra Properties 选择区域，用户可勾选要显示的额外属性
- 在 List、Kanban、Spreadsheet 等视图布局中，选中的额外属性将与系统属性以统一风格显示
- 对于给定工作项类型未绑定的额外属性，显示为灰色不可操作状态
- 扩展 `IIssueDisplayProperties` 类型以支持动态的额外属性显示配置
- 实现额外属性值的内联编辑功能，保持与现有属性编辑体验一致

## Capabilities

### New Capabilities

- `extra-properties-display`: 视图中额外属性的显示与交互功能，包括 Display 面板中的属性选择器、各布局中的属性渲染、以及基于工作项类型的属性有效性判断

### Modified Capabilities

- `work-item-display`: 扩展现有工作项显示能力，支持在各视图布局中渲染额外属性

## Impact

### 前端代码

- `packages/types/src/view-props.ts`: 扩展 `IIssueDisplayProperties` 支持动态额外属性
- `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/display-properties.tsx`: 新增额外属性选择区域
- `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`: 实现额外属性渲染逻辑
- `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`: 集成额外属性显示
- 各视图布局组件（list、kanban、spreadsheet）：确保额外属性正确渲染

### 数据流

- 需要从 `IssueTypeExtraProperty` binding 获取当前项目+类型的有效额外属性列表
- 需要从 `ExtraPropertyConfig` 获取工作空间级别的所有额外属性定义
- 需要访问 `TIssue.extra_properties` 获取具体工作项的额外属性值

### 上游同步风险

- **中等风险**: `IIssueDisplayProperties` 类型定义可能被上游修改
- **低风险**: Display 面板组件为扩展点，上游结构变化可能需要调整集成方式
