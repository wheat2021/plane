## Context

当前项目视图支持多种筛选器（如状态、优先级、负责人、标签等），但不支持按工作项类型（Issue Type）筛选。工作项类型是工作空间级别定义的，每个项目可以启用/禁用特定的类型。

现有筛选器架构：
- `@plane/types` 定义 `TWorkItemFilterProperty` 和 `TWorkItemFilterExpression`
- `@plane/utils` 提供筛选器配置工厂函数（如 `getStateFilterConfig`）
- `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx` 组装所有筛选器配置
- 后端 API 已支持 `type_id` 字段的查询

## Goals / Non-Goals

**Goals:**
- 在项目视图筛选器中添加工作项类型筛选选项
- 筛选器仅显示当前项目已启用的工作项类型
- 筛选条件可保存到视图并持久化
- 支持多选（IN 操作符）

**Non-Goals:**
- 不修改工作空间级别视图的筛选器（本次仅针对项目视图）
- 不添加工作项类型的分组（group_by）支持
- 不修改后端 API（已支持 type_id 筛选）

## Decisions

### 1. 筛选器键名使用 `type_id`

**决定**: 使用 `type_id` 作为筛选器属性键

**理由**: 
- 与后端 API 字段名保持一致
- 与现有 `state_id`、`label_id` 等命名规范一致
- `TIssueParams` 中已有 `issue_type` 参数定义

**替代方案**: 
- `issue_type_id` - 更明确但与后端不一致

### 2. 筛选器配置放置在 `@plane/utils`

**决定**: 在 `packages/utils/src/work-item-filters/configs/filters/` 新建 `issue-type.ts`

**理由**:
- 遵循现有架构，与 `state.ts`、`label.ts` 等并列
- 便于在多个应用中复用
- 保持代码组织一致性

### 3. 类型选项从 project issue types store 获取

**决定**: 通过 `useIssueType().getProjectIssueTypes(projectId)` 获取项目启用的工作项类型

**理由**:
- 复用现有 store 逻辑
- 自动过滤仅显示项目已启用的类型
- 与项目设置页面的数据源一致

### 4. 图标使用工作项类型自定义图标

**决定**: 使用 `TIssueType.logo_props` 渲染类型图标

**理由**:
- 与工作项列表中显示的图标一致
- 提供更好的视觉识别

## Risks / Trade-offs

**[风险] 上游同步冲突**
- `packages/types/src/view-props.ts` 修改可能与上游冲突
- → 缓解：仅添加新字段到 `WORK_ITEM_FILTER_PROPERTY_KEYS` 数组末尾，降低冲突概率

**[风险] 项目工作项类型未加载**
- 筛选器渲染时 `projectIssueTypeMap` 可能未初始化
- → 缓解：在 `isEnabled` 中检查数据是否已加载，未加载时禁用筛选器

**[权衡] 筛选器仅显示项目启用的类型**
- 如果工作项使用了已禁用的类型，该类型不会出现在筛选选项中
- → 接受此限制，因为禁用的类型在项目中应该逐步迁移

## 实现要点

### 前端修改

1. **类型定义** (`packages/types/src/view-props.ts`)
   ```typescript
   export const WORK_ITEM_FILTER_PROPERTY_KEYS = [
     // ... existing keys
     "type_id",
   ] as const;
   ```

2. **筛选器配置工厂** (`packages/utils/src/work-item-filters/configs/filters/issue-type.ts`)
   - 创建 `getIssueTypeFilterConfig` 函数
   - 支持 `IN` 操作符的多选配置

3. **Hook 集成** (`apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx`)
   - 添加 `issueTypeFilterConfig` 到 configs 数组
   - 添加到 `configMap`

4. **项目级 Props** (`apps/web/ce/helpers/work-item-filters/project-level.ts`)
   - 扩展返回项目的工作项类型 ID 列表
