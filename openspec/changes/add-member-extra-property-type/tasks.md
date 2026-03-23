## 1. 提交变更文档

- [ ] 1.1 将 openspec/changes/add-member-extra-property-type/ 下所有文档（proposal.md、design.md、specs/、tasks.md）提交到 itemtype 分支，提交信息：`#FICC-9999# docs: 新增 member 类型 extra property 变更文档`

## 2. 后端实现

- [ ] 2.1 检查最新 migration 编号（当前最新：0130），确认新 migration 编号为 0131
- [ ] 2.2 在 `apps/api/plane/db/models/extra_property.py` 的 `ExtraPropertyConfig.TYPE_CHOICES` 中新增 `("member", "Member")`
- [ ] 2.3 在 `ExtraPropertyConfig` 中新增 `member_color` property（从 `self.config.get("member_color")` 读取）
- [ ] 2.4 创建 migration `0131_add_member_type_to_extra_property.py`，仅更新 `type` 字段的 choices（无 schema 变更，使用 `AlterField`）
- [ ] 2.5 在 extra_property serializer（`apps/api/plane/app/serializers/extra_property.py`）中，为 `member` 类型新增值校验：值必须为合法的 workspace member user_id 或 null/""

## 3. 类型包扩展（@plane/types）

- [ ] 3.1 在 `packages/types/src/extra-property.ts` 中，`TExtraPropertyType` 联合类型新增 `"member"`
- [ ] 3.2 在 `TExtraPropertyConfig` 接口新增可选字段 `member_color?: string`
- [ ] 3.3 执行 `pnpm --filter=@plane/types run build` 确认类型包编译通过

## 4. 前端控件实现

- [ ] 4.1 新建 `apps/web/core/components/issues/extra-properties/controls/member.tsx`，实现 `MemberControl` 组件：
  - 使用 `MemberDropdown`（workspace 成员列表，不传 `projectId`）
  - 接收 `config.member_color` 并在已选成员头像上渲染颜色边框
  - 支持清除（设为 null）
  - `disabled` 时只读展示
- [ ] 4.2 在 `apps/web/core/components/issues/extra-properties/controls/index.ts` 导出 `MemberControl`
- [ ] 4.3 在 `extra-property-control.tsx` 的 `switch(config.type)` 中新增 `case "member"` → 渲染 `MemberControl`，同时在 `isValueValid` 校验中新增 `member` 类型规则（值为 string 或 null/null-like）
- [ ] 4.4 在 `extra-property-renderer.tsx` 的 `getPropertyIcon()` 中新增 `member` 类型 → 使用 `User`（lucide-react）图标

## 5. 前端配置界面

- [ ] 5.1 在 `apps/web/core/components/workspace/settings/extra-properties/form.tsx` 的 `PROPERTY_TYPES` 数组中新增 `{ value: "member", label: "Member" }`
- [ ] 5.2 在 form.tsx 中，当 `type === "member"` 时：
  - 隐藏 options 配置区域
  - 展示颜色选择器（复用现有 `IconColorPicker` 组件），绑定到 `config.member_color`
- [ ] 5.3 在 form.tsx 的 `isTypeCompatible` 兼容矩阵中新增 `member` 规则：`member → text`、`member → textarea` 为兼容，其余不兼容

## 6. 提交实现代码

- [ ] 6.1 提交后端改动：`#FICC-9999# feat: 新增 member 类型 extra property（后端模型、校验、migration）`
  - `apps/api/plane/db/models/extra_property.py`
  - `apps/api/plane/app/serializers/extra_property.py`
  - `apps/api/plane/db/migrations/0131_add_member_type_to_extra_property.py`
- [ ] 6.2 提交类型包改动：`#FICC-9999# feat: 扩展 TExtraPropertyType 支持 member 类型`
  - `packages/types/src/extra-property.ts`
- [ ] 6.3 提交前端控件和配置界面改动：`#FICC-9999# feat: 新增 member 类型 extra property 前端控件和配置界面`
  - `apps/web/core/components/issues/extra-properties/controls/member.tsx`（新文件）
  - `apps/web/core/components/issues/extra-properties/controls/index.ts`
  - `apps/web/core/components/issues/extra-properties/extra-property-control.tsx`
  - `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`
  - `apps/web/core/components/workspace/settings/extra-properties/form.tsx`

## 7. 用户验证

- [ ] 7.1 **后端 API 验证**：
  - 通过 Django shell 创建一个 `type=member` 的 ExtraPropertyConfig，确认创建成功
  - 通过 PATCH issue API 更新 `extra_properties`，写入合法 user_id，确认返回 200
  - 写入非 workspace member 的 user_id，确认返回 400
  - 写入 null，确认清除成功
- [ ] 7.2 **配置界面验证**：
  - 进入 Settings → Extra Properties，点击新建，选择类型"Member"
  - 确认 options 区域消失，颜色选择器出现
  - 选择颜色 #6366f1，保存，确认配置成功创建
- [ ] 7.3 **控件渲染验证**：
  - 将 member 类型 Extra Property 绑定到 Requirement work item type
  - 打开一个 Requirement 工作项详情，侧边栏中应显示该字段（User 图标）
  - 点击字段，下拉显示 workspace 成员列表，选择成员后显示头像+姓名
  - 确认头像带有配置的紫色边框，与默认 assignee 视觉区分
  - 确认 disabled 状态下不可交互
- [ ] 7.4 **降级验证**：
  - 将一个已离职/移除的 user_id 手动写入 extra_properties，刷新页面确认前端不崩溃，显示降级状态
