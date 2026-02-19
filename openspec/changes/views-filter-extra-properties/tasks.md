## 1. 类型系统扩展

- [ ] 1.1 [UPSTREAM-RISK] 在 `packages/types/src/view-props.ts` 的 `WORK_ITEM_FILTER_PROPERTY_KEYS` 所在位置，新增模板字面量类型 `TExtraPropertyFilterKey = \`extra*property*${string}\``，并将 `TWorkItemFilterProperty`扩展为`(typeof WORK_ITEM_FILTER_PROPERTY_KEYS)[number] | TExtraPropertyFilterKey`

## 2. 前端 Filter Config 工厂函数

- [ ] 2.1 在 `packages/utils/src/work-item-filters/configs/filters/` 下新建 `extra-property.ts`，实现 `getExtraPropertyOptionFilterConfig` 工厂函数，接受 `configId`、`label`、`options` 参数，使用 `COLLECTION_OPERATOR.IN` 操作符生成 multi-select 类型的 `TFilterConfig`
- [ ] 2.2 在 `packages/utils/src/work-item-filters/configs/filters/index.ts`（或同级 barrel 文件）中导出新工厂函数

## 3. Hook 扩展——动态注入 Extra Property 筛选器

- [ ] 3.1 [UPSTREAM-RISK] 在 `apps/web/ce/hooks/work-item-filters/use-work-item-filters-config.tsx` 中，通过 `useExtraPropertyConfig` 和 `useIssueTypeExtraProperty` 获取当前项目绑定的 `option`/`multi_option` 类型 Extra Property configs
- [ ] 3.2 为每个可用的 Extra Property config 调用 `getExtraPropertyOptionFilterConfig` 生成对应的 `TFilterConfig` 对象（key 格式为 `extra_property_<configId>`）
- [ ] 3.3 将生成的 Extra Property filter configs 追加到 Hook 返回的 `configs` 列表和 `configMap` 中
- [ ] 3.4 确认 `isFilterEnabled` 逻辑对 Extra Property 动态 key 的兼容性（类型检查不应拒绝模板字面量 key）

## 4. 后端——Extra Property 筛选条件处理

- [ ] 4.1 调研 `Issue.extra_properties`（JSONField）中 `option` 类型的值存储格式，确认是存选项 value 字符串还是 UUID，以确定 ORM 过滤的比较值类型
- [ ] 4.2 在 `apps/api/plane/utils/filters/filterset.py` 的 `IssueFilterSet` 中，添加通配方式处理 `extra_property_<configId>__in` 格式的过滤字段——可选方案：为 `IssueFilterSet` 添加 `extra_property__in` 占位 filter，并在视图层预处理中提取动态 configId
- [ ] 4.3 在处理 rich*filters 的视图层（如 `apps/api/plane/app/views/issue/` 相关视图）添加预处理逻辑：识别 `extra_property*<configId>**in`条件，提取 configId 和 option 值列表，转换为`queryset.filter(\*\*{f"extra_properties**{configId}\_\_in": values})` 的 ORM 查询并应用
- [ ] 4.4 验证后端过滤对 `option` 类型 Extra Property 的正确性：选中选项的工作项应出现在结果中，未设置该属性的工作项应被排除

## 5. 验证与收尾

- [ ] 5.1 在浏览器中打开项目 Views 的筛选器面板，确认已绑定 Extra Property 的选项出现在筛选器列表中
- [ ] 5.2 选择一个 Extra Property 选项值进行筛选，确认工作项列表实时更新正确
- [ ] 5.3 将包含 Extra Property 筛选条件的 View 保存后重新打开，确认筛选条件正确恢复
- [ ] 5.4 同时设置 Extra Property 筛选和标准属性（如 state）筛选，确认 AND 组合逻辑正确
- [ ] 5.5 运行 TypeScript 类型检查：`pnpm check:types`，确认无新增类型错误
