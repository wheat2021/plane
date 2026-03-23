## 1. 提交变更文档

- [x] 1.1 将 `openspec/changes/add-reference-extra-property-type/` 下所有文档（proposal.md、design.md、specs/、tasks.md）提交到 itemtype 分支，提交信息：`#FICC-9999# docs: 新增 reference 类型 extra property 变更文档`

## 2. 后端实现

- [x] 2.1 确认最新 migration 编号为 0131，新 migration 编号为 0132
- [x] 2.2 在 `apps/api/plane/db/models/extra_property.py` 的 `ExtraPropertyConfig.TYPE_CHOICES` 中新增 `("reference", "Reference")`
- [x] 2.3 创建 migration `0132_add_reference_type_to_extra_property.py`，使用 `AlterField` 更新 `type` 字段的 choices（无 schema 变更）
- [x] 2.4 在 `apps/api/plane/app/serializers/extra_property.py` 中，为 `reference` 类型新增值校验：值必须为 `list[{display: str (非空), url: str}]` 格式或 null/[]

## 3. 类型包扩展（@plane/types）

- [x] 3.1 在 `packages/types/src/extra-property.ts` 中新增 `TReferenceItem` 接口：`{ display: string; url: string }`
- [x] 3.2 在 `TExtraPropertyValue` 联合类型中新增 `TReferenceItem[]` 分支：`string | string[] | boolean | TReferenceItem[] | null`
- [x] 3.3 在 `TExtraPropertyType` 联合类型中新增 `"reference"`
- [x] 3.4 执行 `pnpm --filter=@plane/types run build` 确认类型包编译通过

## 4. 修复 Array.isArray 类型守卫 [UPSTREAM-RISK]

- [x] 4.1 在 `apps/web/core/components/issues/extra-properties/extra-property-control.tsx` 的 `isValueValid` 函数中：
  - 新增 `case "reference"` 分支，校验值为 `TReferenceItem[]`（每项有 display 和 url 字段）
  - 确认 `multiselect` 的 `Array.isArray(value)` 分支不会误匹配 `TReferenceItem[]`（通过检查元素是否为 string 区分）
- [x] 4.2 在 `sanitizeValue` 函数中确认 `config.type !== "multiselect"` 的前置守卫已足够保护（reference 不会进入 multiselect 分支）

## 5. 前端 Normal 模式控件

- [x] 5.1 新建 `apps/web/core/components/issues/extra-properties/controls/reference.tsx`，实现 `ReferenceControl` 组件：
  - disabled 时：显示逗号分隔的 `<a target="_blank">` 链接列表（无链接时显示 "—"）
  - 可编辑时：在只读展示基础上，点击触发 Popover 编辑器
  - Popover 内：列表展示所有链接（viewing 状态），点击 ✏️ 切换单条为 editing 状态（display + url 输入框 + [取消]/[保存]），点击 ✕ 删除，底部有 [+ 添加链接] 按钮
  - 新增链接时：展开空表单，display 必填校验，[取消]/[保存] 按钮
  - Popover 关闭时：将当前 links 状态通过 onChange 提交
- [x] 5.2 在 `apps/web/core/components/issues/extra-properties/controls/index.ts` 中导出 `ReferenceControl`

## 6. 前端 Compact 模式控件

- [x] 6.1 新建 `apps/web/core/components/issues/extra-properties/compact-controls/compact-reference.tsx`，实现 `CompactReferenceControl` 组件：
  - 显示 `Link2`（lucide-react）图标：有链接时 `text-blue-500`，无链接时 `text-secondary`
  - 无链接时不展开（或展示空状态）
  - 有链接时点击：使用 HeadlessUI Popover 展示所有链接，每条为 `<a target="_blank">` 可点击
  - compact 模式始终只读，无编辑功能
- [x] 6.2 在 `apps/web/core/components/issues/extra-properties/compact-controls/compact-extra-property-control.tsx` 中新增 `case "reference"` → 渲染 `CompactReferenceControl` [UPSTREAM-RISK]

## 7. 前端路由与图标注册 [UPSTREAM-RISK]

- [x] 7.1 在 `apps/web/core/components/issues/extra-properties/extra-property-control.tsx` 的 `switch(config.type)` 中新增 `case "reference"` → 渲染 `ReferenceControl`
- [x] 7.2 在 `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx` 的 `getPropertyIcon()` 中新增 `case "reference"` → 使用 `Link2`（lucide-react）图标

## 8. 前端配置界面 [UPSTREAM-RISK]

- [x] 8.1 在 `apps/web/core/components/workspace/settings/extra-properties/form.tsx` 的 `PROPERTY_TYPES` 数组中新增 `{ value: "reference", label: "Reference" }`
- [x] 8.2 在 `form.tsx` 中，当 `type === "reference"` 时：隐藏 options 配置区域（复用现有 member 类型的隐藏逻辑），不显示额外配置字段
- [x] 8.3 在 `form.tsx` 的 `isTypeCompatible` 兼容矩阵中新增 `reference` 规则：`reference` 与所有其他类型均不兼容（双向）

## 9. 提交实现代码

- [x] 9.1 提交后端改动：`#FICC-9999# feat: 新增 reference 类型 extra property（后端模型、校验、migration）`
  - `apps/api/plane/db/models/extra_property.py`
  - `apps/api/plane/app/serializers/extra_property.py`
  - `apps/api/plane/db/migrations/0132_add_reference_type_to_extra_property.py`
- [x] 9.2 提交类型包改动：`#FICC-9999# feat: 扩展 TExtraPropertyType 和 TExtraPropertyValue 支持 reference 类型`
  - `packages/types/src/extra-property.ts`
- [x] 9.3 提交前端控件和配置界面改动：`#FICC-9999# feat: 新增 reference 类型 extra property 前端控件和配置界面`
  - `apps/web/core/components/issues/extra-properties/controls/reference.tsx`（新文件）
  - `apps/web/core/components/issues/extra-properties/controls/index.ts`
  - `apps/web/core/components/issues/extra-properties/compact-controls/compact-reference.tsx`（新文件）
  - `apps/web/core/components/issues/extra-properties/compact-controls/compact-extra-property-control.tsx`
  - `apps/web/core/components/issues/extra-properties/extra-property-control.tsx`
  - `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`
  - `apps/web/core/components/workspace/settings/extra-properties/form.tsx`

## 10. 用户验证

- [x] 10.1 **配置界面**：进入工作空间设置 → Extra Properties → 新建属性 → 类型选择 "Reference" → 确认无额外配置字段，保存成功
- [x] 10.2 **绑定到 issue type**：将 reference 属性绑定到某个 issue type，进入对应 issue，确认侧边栏出现该属性（Link2 图标）
- [x] 10.3 **Normal 模式新增链接**：点击属性值区域 → Popover 弹出 → 点击 [+ 添加链接] → 填写 display 和 url → [保存] → 确认链接出现在列表
- [x] 10.4 **Normal 模式编辑链接**：点击链接的 ✏️ → 修改 display → [保存] → 确认显示更新
- [x] 10.5 **Normal 模式删除链接**：点击链接的 ✕ → 确认链接消失，onChange 触发保存
- [x] 10.6 **Normal 模式只读展示**：在不可编辑状态下，确认链接以逗号分隔展示，点击可跳转，无 Popover 弹出
- [x] 10.7 **Compact 模式有链接**：在 issue 列表视图，确认 reference 属性显示蓝色 Link2 图标；点击展开 Dropdown，点击链接在新标签页打开
- [x] 10.8 **Compact 模式无链接**：确认显示灰色 Link2 图标，点击无效果（或空状态提示）
- [x] 10.9 **display 必填校验**：在 Popover 编辑器中，不填 display 点击 [保存] → 确认错误提示出现，不保存
- [x] 10.10 **类型兼容性**：在配置界面将已有 reference 属性改为 text 类型 → 确认值清空（不保留原链接数据）
