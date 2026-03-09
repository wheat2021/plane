## 1. 提交变更文档

- [x] 1.1 提交所有 openspec 文档（proposal.md、design.md、specs、tasks.md）到 itemtype 分支

## 2. 后端：新增属性使用情况查询 API

- [x] 2.1 在 `plane/app/views/workspace/extra_property.py` 新增 `ExtraPropertyConfigValuesEndpoint` 视图类，实现 `GET` 方法，查询 `extra_properties__has_key=<key>` 并返回 `{count, distinct_values}`
- [x] 2.2 在 workspace URL 配置中注册新路由 `/api/workspaces/<slug>/extra-properties/<pk>/values/`，权限限制为 ADMIN
- [x] 2.3 用 ruff 检查并修复后端代码格式（`ruff check . && ruff format .`）

## 3. 前端 Service & Store 层

- [x] 3.1 在 `core/services/extra-property-config.service.ts` 新增 `getConfigValues(workspaceSlug, configId)` 方法，调用 `/values/` 端点，返回 `{count: number, distinct_values: string[]}`
- [x] 3.2 在 `core/store/extra-property-config.store.ts` 新增 `fetchConfigValues(workspaceSlug, configId)` action，调用 service 层方法

## 4. 前端：类型变更检查逻辑（form.tsx）

- [x] 4.1 移除类型选择器的 `disabled={isEditMode}` 限制，编辑模式下类型选择器保持可用
- [x] 4.2 实现静态兼容性判断函数 `isTypeCompatible(from, to)`，依据 design.md 中的兼容性矩阵返回 `true/false`
- [x] 4.3 在 `watch("type")` 变化时（且处于编辑模式），若 `isTypeCompatible` 返回 `false`，调用 `fetchConfigValues()` 查询影响范围
- [x] 4.4 在类型选择器下方新增 inline 警告 banner，展示 `count` 和 `distinct_values`；count === 0 时不展示 banner；查询中展示加载状态
- [x] 4.5 banner 样式使用黄色警告风格（与项目现有 warning UI 一致），不阻断提交操作

## 5. 前端：控件初始化值校验（extra-property-control.tsx）

- [x] 5.1 实现 `isValueValid(config, value)` 纯函数，依据 spec 中的校验规则判断值合法性
- [x] 5.2 实现 `sanitizeValue(config, value)` 纯函数，用于 multiselect 的部分过滤（过滤不合法元素，全部不合法返回 `null`）
- [x] 5.3 在 `ExtraPropertyControl` 中添加 `useEffect(fn, [])`，挂载时检查值合法性，不合法时调用 `onChange(null)` 或过滤后值；仅在 `!disabled` 时执行

## 6. 提交实现代码

- [x] 6.1 提交后端变更：`#FICC-9999# feat(api): 新增 extra-property values 查询接口`（包含视图和 URL 配置）
- [x] 6.2 提交前端 service/store 变更：`#FICC-9999# feat(store): 新增 extra-property values 查询 action`
- [x] 6.3 提交前端 UI 变更：`#FICC-9999# feat(extra-properties): 编辑表单位置调整、类型变更检查、值合法性校验`（包含 root.tsx、form.tsx、extra-property-control.tsx）

## 7. 用户验证

- [ ] 7.1 **类型变更（兼容）**：编辑一个 select 属性，将类型改为 multiselect，确认无警告 banner，可正常保存
- [ ] 7.2 **类型变更（不兼容，有数据）**：编辑一个已有工作项使用的 text 属性，将类型改为 select，确认展示警告 banner，显示受影响数量和现有值，仍可提交
- [ ] 7.3 **类型变更（不兼容，无数据）**：编辑一个未被任何工作项使用的属性，变更为不兼容类型，确认不展示 banner
- [ ] 7.4 **不合法值清除**：在工作项中为一个 select 属性选择值，再到设置中删除该选项，重新打开工作项详情，确认该属性值已被清空（显示占位文字）
- [ ] 7.5 **multiselect 部分过滤**：为 multiselect 属性选择多个值，删除其中一个选项，重新打开工作项，确认只有被删除的值消失，其余值保留
- [ ] 7.6 **只读模式不清除**：在非编辑状态下查看工作项，确认即使有不合法值也不会被清除（可通过 network 面板确认无 PATCH 请求）
