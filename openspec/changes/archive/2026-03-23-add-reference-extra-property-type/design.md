## Context

extra property 系统允许工作区管理员在工作空间层面定义自定义属性，并将其绑定到 issue type。目前支持 6 种类型（text、textarea、select、multiselect、checkbox、member）。值统一存储在 `issue.extra_properties` JSONField（`Record<key, TExtraPropertyValue>`）中。

当前 `TExtraPropertyValue = string | string[] | boolean | null`，无法表达结构化的链接对象。reference 类型需要存储 `{display: string, url: string}[]`，这要求扩展联合类型——这是本次变更唯一的 **破坏性** 设计决策。

## Goals / Non-Goals

**Goals:**

- 新增 reference 类型，支持存储和展示外部链接列表
- Normal 模式支持 Popover 内编辑（增删改链接）
- Compact 模式只读导航（点击展开链接列表，点击跳转）
- 与现有 extra property 系统完全兼容（同等的后端校验、前端渲染路由）

**Non-Goals:**

- URL 格式校验（不强制 http/https 协议头）
- 链接数量限制
- reference 类型与其他类型互相转换时的值保留
- 链接的排序/拖拽功能

## Decisions

### 决策 1：扩展 TExtraPropertyValue 联合类型（而非序列化方案）

**选择**：扩展 `TExtraPropertyValue` 为 `string | string[] | boolean | TReferenceItem[] | null`

**理由**：

- 类型安全，TypeScript 可以在编译期捕获类型错误
- JSON 原生支持对象数组，无需额外序列化/反序列化
- 与现有 `extra_properties` JSONField 存储方式完全兼容

**代价与缓解**：

- `Array.isArray(value)` 检查不再能区分 `string[]` 和 `TReferenceItem[]`
- **缓解**：引入类型守卫函数 `isReferenceArray(v)` 和 `isStringArray(v)`，审查所有使用 `Array.isArray(value)` 的代码路径（主要在 `extra-property-control.tsx` 的 `isValueValid` 和 `sanitizeValue`）

**否决方案**：JSON string 编码（`'[{"display":"...","url":"..."}]'`）——破坏类型系统语义；`string[]` 编码（`display::url`）——脆弱的格式假设，无法处理 URL 内含 `::`。

---

### 决策 2：Popover 编辑器使用"每条独立保存"模式

**选择**：Popover 内每条链接的编辑有独立的 [取消]/[保存] 按钮；新增链接同理；Popover 关闭时提交当前已保存的完整列表给父组件。

**理由**：

- 避免编辑中间状态（半填写的 url 字段）触发 `onChange` 写入 issue
- 与其他 field 的 onBlur 语义一致：只有明确确认才写入
- 用户体验明确：保存 = 确认这条链接，关闭 Popover = 离开编辑器

**Popover 实现**：使用 `@plane/ui` 的 `Popover` 组件（基于 HeadlessUI + Popper.js），挂载在属性行上。

---

### 决策 3：Compact 模式使用自定义只读导航 Dropdown

**选择**：不使用现有 `SingleSelectDropdown`，直接使用 HeadlessUI `Popover` 渲染自定义链接列表。

**理由**：

- Compact 模式的链接点击语义是"导航到 URL"（`<a target="_blank">`），不是"选择值"
- `SingleSelectDropdown` 的 onChange 回调与导航语义不匹配
- 自定义 Popover 更轻量，无需适配 dropdown 的选项数据格式

---

### 决策 4：图标颜色状态

- 有链接时：蓝色（`text-blue-500` 或等效 design token）
- 无链接时：灰色（`text-secondary`）
- Normal 模式和 Compact 模式的图标状态保持一致

---

### 决策 5：display 字段必填

**选择**：display 字段 UI 层强制非空（表单保存时校验）。

**理由**：保证 Normal 模式的逗号分隔展示总有可读文本，避免显示裸 URL 的截断问题。

**后端**：serializer 同步校验 `display` 非空字符串。

---

### 决策 6：reference 与其他类型不兼容

reference 的值类型（`TReferenceItem[]`）与其他类型（`string`、`string[]`、`boolean`）之间无合理的转换语义。在 `isTypeCompatible` 矩阵中，reference 与所有其他类型互不兼容，类型转换时值清空。

## Risks / Trade-offs

**[风险 1] `Array.isArray` 区分性问题**
→ 现有代码中存在 `Array.isArray(value)` 后直接当 `string[]` 处理的模式（`sanitizeValue`、multiselect 的校验路径）。若漏改，`TReferenceItem[]` 会被误处理。
→ **缓解**：实现前逐一 grep 审查所有 `Array.isArray(value)` 用例；引入类型守卫，替换裸 `Array.isArray` 检查。

**[风险 2] 上游 rebase 冲突**
→ `form.tsx`、`extra-property-control.tsx` 是被 member 类型改动过的文件，上游可能同步更新。
→ **缓解**：改动尽量局部化，避免大段重写；rebase 时优先解决这两个文件的冲突。

**[风险 3] Popover 嵌套层叠（z-index）**
→ reference 控件在 issue 详情侧边栏中，Popover 弹出时可能被上层容器截断。
→ **缓解**：使用 Popper.js `strategy: "fixed"` 或确认现有 Popover 组件的 z-index 策略与侧边栏兼容（参考 member 类型的 MemberDropdown 处理方式）。

## Migration Plan

1. 先合并后端改动（migration + serializer），无破坏性
2. 合并 TypeScript 类型扩展，更新类型守卫
3. 合并前端控件，此时 reference 类型在 UI 上可用
4. 无需数据迁移（新类型，无历史数据）
5. 回滚：删除 migration，恢复 TYPE_CHOICES 和前端代码；已有 reference 值的 issue 会在 serializer 校验失败（需提前清理或容忍）

## Open Questions

（无。所有决策已在 Explore 阶段与用户确认。）
