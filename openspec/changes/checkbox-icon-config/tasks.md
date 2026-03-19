## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）
  ```
  git add openspec/changes/checkbox-icon-config/
  git commit -m "#FICC-9999# docs: 新增 checkbox-icon-config 变更文档"
  ```

## 2. 后端：扩展序列化器

- [x] 2.1 在 `apps/api/plane/app/serializers/extra_property.py` 的 `ExtraPropertyConfigSerializer` 中，新增四个可选字段声明：`true_icon`、`true_icon_color`、`false_icon`、`false_icon_color`（均为 `CharField(required=False, allow_null=True, allow_blank=True)`）
- [x] 2.2 在 `to_representation` 方法中，新增四个字段的读取（从 config JSON 读取，无值时输出 `None`）
- [x] 2.3 在 `to_internal_value` 方法中，新增四个字段的写入（有值时写入 config，并在末尾 pop 掉以防重复）
- [x] 2.4 在 `Meta.fields` 列表中新增四个字段
- [x] 2.5 在 `apps/api/plane/db/models/extra_property.py` 的 `ExtraPropertyConfig` 模型中，新增四个 `@property`（读取 config JSON：`true_icon`、`true_icon_color`、`false_icon`、`false_icon_color`，无值返回 `None`）

## 3. 前端类型：扩展 TExtraPropertyConfig

- [x] 3.1 在 `packages/types/src/extra-property.ts` 的 `TExtraPropertyConfig` 接口中，新增四个可选字段：
  ```typescript
  true_icon?: string
  true_icon_color?: string
  false_icon?: string
  false_icon_color?: string
  ```

## 4. 配置表单：新增图标选择 Popover

- [x] 4.1 在 `apps/web/core/components/workspace/settings/extra-properties/form.tsx` 的 `FormValues` 类型中，新增四个字段：`true_icon`、`true_icon_color`、`false_icon`、`false_icon_color`（均可选 string | undefined）
- [x] 4.2 在 `useForm` 的 `defaultValues` 中，新增上述四个字段的初始值（`undefined`）
- [x] 4.3 在 `useEffect` 的 `existingConfig` 重置逻辑中，读取并填充四个图标字段
- [x] 4.4 在 `onSubmit` 的 `showCheckboxValues` 分支中，将四个图标字段写入 payload（有值才写入，无值保持 undefined）
- [x] 4.5 在 `showCheckboxValues` 区块的表单 JSX 中，在两列标签输入框（true_value/false_value）下方，新增 "True 图标" 和 "False 图标" 两行选择器，各自使用 Popover 包裹 `IconColorPicker`
  - 触发按钮：已选图标时渲染对应 lucide 图标（带颜色）+ 图标名 tooltip；未选时渲染虚线边框 + Plus 图标
  - Popover 内 `IconColorPicker` 的 `value` 和 `onChange` 使用 Controller + `true_icon`/`true_icon_color` 联动
  - 提供"清除"按钮（x 图标），点击后将对应图标字段置为 undefined
- [x] 4.6 从 `apps/web/core/components/workspace/settings/work-item-types/` 导入 `IconColorPicker`（需确认是否已 export，如未导出则添加 export）

## 5. 紧凑视图：条件渲染自定义图标

- [x] 5.1 在 `apps/web/core/components/issues/extra-properties/compact-controls/compact-checkbox.tsx` 中，导入 lucide `icons` 对象（用于动态查找图标组件）和 `Plus` 图标（备用）
- [x] 5.2 新增工具函数 `getLucideIcon(name: string): LucideIcon | null`，通过 PascalCase 转换查找 `icons` 命名空间，找不到时返回 `null`
- [x] 5.3 修改渲染逻辑：
  - `isChecked` 且 `config.true_icon` 存在且能找到图标组件 → 渲染自定义图标（颜色 `config.true_icon_color ?? "#6b7280"`）
  - `isChecked` 且无自定义图标 → 保持原有 `SquareCheck`（`text-accent-primary`）
  - `!isChecked` 且 `config.false_icon` 存在且能找到图标组件 → 渲染自定义图标（颜色 `config.false_icon_color ?? "#6b7280"`）
  - `!isChecked` 且无自定义图标 → 保持原有 `Square`（`text-tertiary`）
- [x] 5.4 自定义图标渲染时 className 保持 `"h-4 w-4 flex-shrink-0"`，与原图标尺寸一致

## 6. 提交实现代码

- [x] 6.1 提交后端变更
  ```
  git add apps/api/plane/app/serializers/extra_property.py apps/api/plane/db/models/extra_property.py
  git commit -m "#FICC-9999# feat: 序列化器支持 checkbox 图标配置字段"
  ```
- [x] 6.2 提交前端类型和紧凑视图变更
  ```
  git add packages/types/src/extra-property.ts apps/web/core/components/issues/extra-properties/compact-controls/compact-checkbox.tsx
  git commit -m "#FICC-9999# feat: 前端类型扩展及紧凑 checkbox 自定义图标渲染"
  ```
- [x] 6.3 提交配置表单变更
  ```
  git add apps/web/core/components/workspace/settings/extra-properties/form.tsx
  git commit -m "#FICC-9999# feat: checkbox 属性配置表单支持图标选择"
  ```

## 7. 用户验证

- [x] 7.1 进入工作区设置 → Extra Properties，编辑（或新建）一个 checkbox 类型的属性
  - 预期：在 true/false 标签输入框下方看到 "True 图标" 和 "False 图标" 两个触发按钮，初始显示虚线边框 + Plus 图标
- [ ] 7.2 点击 "True 图标" 触发按钮，弹出 Popover，搜索并选择一个图标（如 "check-circle"），选择绿色（#22c55e），关闭 Popover
  - 预期：触发按钮显示绿色的 check-circle 图标；同样为 "False 图标" 配置红色 x-circle
- [ ] 7.3 保存配置，进入包含该属性的 issue spreadsheet 视图
  - 预期：checkbox 列中，true 状态显示绿色 check-circle，false 状态显示红色 x-circle
- [ ] 7.4 点击紧凑图标切换 checkbox 值
  - 预期：图标在两个自定义图标间切换，tooltip 内容保持正确
- [ ] 7.5 清除其中一个图标配置并保存，回到 spreadsheet
  - 预期：清除图标的状态 fallback 为默认 Square/SquareCheck，另一状态仍显示自定义图标
- [ ] 7.6 查看未配置图标的旧 checkbox 属性
  - 预期：仍正常显示 Square/SquareCheck，无报错
