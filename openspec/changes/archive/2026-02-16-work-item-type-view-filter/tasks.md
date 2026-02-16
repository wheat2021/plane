## 1. 类型定义

- [x] 1.1 [UPSTREAM-RISK] 在 `packages/types/src/view-props.ts` 的 `WORK_ITEM_FILTER_PROPERTY_KEYS` 数组中添加 `"type_id"`

## 2. 筛选器配置工厂

- [x] 2.1 创建 `packages/utils/src/work-item-filters/configs/filters/issue-type.ts` 文件
- [x] 2.2 实现 `getIssueTypeFilterConfig` 函数，支持 IN 操作符的多选配置
- [x] 2.3 在 `packages/utils/src/work-item-filters/configs/filters/index.ts` 中导出新模块
- [x] 2.4 在 `packages/utils/src/index.ts` 中确保导出（如需要）

## 3. Hook 集成

- [x] 3.1 在 `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx` 中导入 `getIssueTypeFilterConfig`
- [x] 3.2 添加 `useIssueType` hook 获取项目工作项类型数据
- [x] 3.3 创建 `issueTypeFilterConfig` 配置，使用项目启用的工作项类型作为选项
- [x] 3.4 将 `issueTypeFilterConfig` 添加到 `configs` 数组
- [x] 3.5 将 `type_id` 添加到 `configMap`

## 4. 项目级筛选器 Props

- [x] 4.1 更新 `apps/web/ce/helpers/work-item-filters/project-level.ts` 返回项目工作项类型相关 props（如需要）

## 5. 验证与测试

- [x] 5.1 运行 `pnpm check:types` 确保类型检查通过
- [x] 5.2 运行 `pnpm check:lint` 确保代码风格检查通过
- [x] 5.3 手动测试：打开项目视图筛选器，确认工作项类型筛选选项显示
- [x] 5.4 手动测试：选择筛选条件后工作项列表正确过滤
- [x] 5.5 手动测试：保存视图后重新打开，筛选条件正确恢复
