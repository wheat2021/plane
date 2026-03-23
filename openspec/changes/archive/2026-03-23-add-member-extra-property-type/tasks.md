## 1. 提交变更文档

- [x] 1.1 将 openspec/changes/add-member-extra-property-type/ 下所有文档（proposal.md、design.md、specs/、tasks.md）提交到 itemtype 分支，提交信息：`#FICC-9999# docs: 新增 member 类型 extra property 变更文档`

## 2. 后端实现

- [x] 2.1 检查最新 migration 编号（当前最新：0130），确认新 migration 编号为 0131
- [x] 2.2 在 `apps/api/plane/db/models/extra_property.py` 的 `ExtraPropertyConfig.TYPE_CHOICES` 中新增 `("member", "Member")`
- [x] 2.3 在 `ExtraPropertyConfig` 中新增 `member_color` property（从 `self.config.get("member_color")` 读取）
- [x] 2.4 创建 migration `0131_add_member_type_to_extra_property.py`，仅更新 `type` 字段的 choices（无 schema 变更，使用 `AlterField`）
- [x] 2.5 在 extra_property serializer（`apps/api/plane/app/serializers/extra_property.py`）中，为 `member` 类型新增值校验：值必须为合法的 workspace member user_id 或 null/""

## 3. 类型包扩展（@plane/types）

- [x] 3.1 在 `packages/types/src/extra-property.ts` 中，`TExtraPropertyType` 联合类型新增 `"member"`
- [x] 3.2 在 `TExtraPropertyConfig` 接口新增可选字段 `member_color?: string`
- [x] 3.3 执行 `pnpm --filter=@plane/types run build` 确认类型包编译通过

## 4. 前端控件实现

- [x] 4.1 新建 `apps/web/core/components/issues/extra-properties/controls/member.tsx`，实现 `MemberControl` 组件：
  - 使用 `MemberDropdown`（workspace 成员列表，不传 `projectId`）
  - 接收 `config.member_color` 并在已选成员头像上渲染颜色边框
  - 支持清除（设为 null）
  - `disabled` 时只读展示
- [x] 4.2 在 `apps/web/core/components/issues/extra-properties/controls/index.ts` 导出 `MemberControl`
- [x] 4.3 在 `extra-property-control.tsx` 的 `switch(config.type)` 中新增 `case "member"` → 渲染 `MemberControl`，同时在 `isValueValid` 校验中新增 `member` 类型规则（值为 string 或 null/null-like）
- [x] 4.4 在 `extra-property-renderer.tsx` 的 `getPropertyIcon()` 中新增 `member` 类型 → 使用 `User`（lucide-react）图标

## 5. 前端配置界面

- [x] 5.1 在 `apps/web/core/components/workspace/settings/extra-properties/form.tsx` 的 `PROPERTY_TYPES` 数组中新增 `{ value: "member", label: "Member" }`
- [x] 5.2 在 form.tsx 中，当 `type === "member"` 时：
  - 隐藏 options 配置区域
  - 展示颜色选择器（复用现有 `IconColorPicker` 组件），绑定到 `config.member_color`
- [x] 5.3 在 form.tsx 的 `isTypeCompatible` 兼容矩阵中新增 `member` 规则：`member → text`、`member → textarea` 为兼容，其余不兼容

## 6. 提交实现代码

- [x] 6.1 提交后端改动：`#FICC-9999# feat: 新增 member 类型 extra property（后端模型、校验、migration）`
  - `apps/api/plane/db/models/extra_property.py`
  - `apps/api/plane/app/serializers/extra_property.py`
  - `apps/api/plane/db/migrations/0131_add_member_type_to_extra_property.py`
- [x] 6.2 提交类型包改动：`#FICC-9999# feat: 扩展 TExtraPropertyType 支持 member 类型`
  - `packages/types/src/extra-property.ts`
- [x] 6.3 提交前端控件和配置界面改动：`#FICC-9999# feat: 新增 member 类型 extra property 前端控件和配置界面`
  - `apps/web/core/components/issues/extra-properties/controls/member.tsx`（新文件）
  - `apps/web/core/components/issues/extra-properties/controls/index.ts`
  - `apps/web/core/components/issues/extra-properties/extra-property-control.tsx`
  - `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`
  - `apps/web/core/components/workspace/settings/extra-properties/form.tsx`

## 8. 补充实现：Compact 视图控件（List / Board / Spreadsheet）

> 原实现仅覆盖详情侧边栏渲染路径，列表/看板/电子表格视图使用独立的 CompactExtraPropertyControl 路径，缺少 member 类型支持，导致选中值无法展示。

- [x] 8.1 新建 `apps/web/core/components/issues/extra-properties/compact-controls/compact-member.tsx`，实现 `CompactMemberControl` 组件：
  - h-5 pill 样式（与其他 compact 控件一致）
  - 有值时：Avatar（含 member_color 边框）+ 成员名截断
  - 无值时：显示 "—" 占位
  - 降级处理：userId 存在但 userDetails 不存在时显示 UserX 图标
  - 使用 MemberDropdown 打开选择器，`button` prop 传入自定义 pill
  - Tooltip 显示字段 label 和成员名
  - `e.stopPropagation()` + `e.preventDefault()` 阻止行/卡片点击穿透
  - `disabled` 时只读不可交互
- [x] 8.2 在 `compact-controls/index.ts` 中导出 `CompactMemberControl`
- [x] 8.3 在 `compact-extra-property-control.tsx` 的 switch 中新增 `case "member"` → 渲染 `CompactMemberControl`
- [x] 8.4 在 `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx` 的 `getPropertyIcon` 中新增 `case "member"` → 使用 `User`（lucide-react）图标
- [x] 8.5 提交 compact 控件改动：`#FICC-9999# feat: 补充 member 类型 compact 视图控件支持（list/board/spreadsheet）`
  - `apps/web/core/components/issues/extra-properties/compact-controls/compact-member.tsx`（新文件）
  - `apps/web/core/components/issues/extra-properties/compact-controls/index.ts`
  - `apps/web/core/components/issues/extra-properties/compact-controls/compact-extra-property-control.tsx`
  - `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`

## 7. 用户验证

- [x] 7.1 **后端 API 验证**：
  - 通过 Django shell 创建一个 `type=member` 的 ExtraPropertyConfig，确认创建成功
  - 通过 PATCH issue API 更新 `extra_properties`，写入合法 user_id，确认返回 200
  - 写入非 workspace member 的 user_id，确认返回 400（发现 bug：workspace_id 未传入 context 导致校验不执行，已修复：从 instance.workspace_id 推导）
  - 写入 null，确认清除成功
- [x] 7.2 **配置界面验证**：
  - 进入 Settings → Extra Properties，点击新建，选择类型"Member"
  - 确认 options 区域消失，颜色选择器出现
  - 选择颜色 #6366f1，保存，确认配置成功创建
- [x] 7.3 **控件渲染验证**：
  - 将 member 类型 Extra Property 绑定到 Requirement work item type
  - 打开一个 Requirement 工作项详情，侧边栏中应显示该字段（User 图标）
  - 点击字段，下拉显示 workspace 成员列表，选择成员后显示头像+姓名
  - 确认头像整体背景色为配置的颜色（如紫色 #6366f1），与默认 assignee 绿色明显区分
  - List/Board/Spreadsheet 视图中仅显示彩色背景头像图标（无姓名），Tooltip 显示字段名和成员名
  - 确认 disabled 状态下不可交互
- [x] 7.4 **降级验证**：
  - 将一个已离职/移除的 user_id 手动写入 extra_properties，刷新页面确认前端不崩溃，显示降级状态
