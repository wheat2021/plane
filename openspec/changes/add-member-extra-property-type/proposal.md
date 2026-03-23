## Why

Extra Property 系统目前仅支持文本、下拉、复选框等基础类型，无法直接选择工作区成员。当业务需要记录"技术负责人"等角色人员（区别于默认的 assignee）时，只能用文本框手动输入，失去了成员关联、头像展示和统一查询的能力。新增 `member` 类型，让 Extra Property 可以选择工作区成员，并支持自定义颜色以便在界面上区分不同角色。

## What Changes

- **新增 Extra Property 类型 `member`**：单选工作区成员，存储 user_id，渲染时展示头像和姓名
- **支持颜色配置**：`member` 类型的 config JSON 中新增 `member_color` 字段（hex color），在头像边框/徽章上显示，与默认 assignee 视觉区分
- **后端**：`ExtraPropertyConfig.TYPE_CHOICES` 新增 `member` 选项，serializer 校验 value 必须为合法 user_id 或 null
- **API 支持**：`member` 类型的值通过现有 Extra Property API（创建/查询/修改 issue 时的 `extra_properties` 字段）读写，无需额外端点
- **类型包**：`TExtraPropertyType` 新增 `"member"`，`TExtraPropertyConfig` 新增 `member_color?: string`
- **前端控件**：新建 `MemberControl` 组件，复用现有 `MemberDropdown`
- **前端配置界面**：Extra Property 配置表单新增 `member` 类型选项，以及颜色选择器

## Capabilities

### New Capabilities

- `member-extra-property-type`：member 类型 Extra Property 的完整实现，包括后端模型、API 校验、前端渲染控件和配置界面

### Modified Capabilities

（无现有 spec 需要更改）

## Impact

**后端文件：**

- `apps/api/plane/db/models/extra_property.py` — 新增 TYPE_CHOICES 条目
- `apps/api/plane/db/migrations/` — 新建 migration（仅更新 choices，无 schema 变更）
- `apps/api/plane/app/serializers/extra_property.py` — member 类型 value 校验

**类型包：**

- `packages/types/src/extra-property.ts` — TExtraPropertyType、TExtraPropertyConfig 扩展

**前端文件：**

- `apps/web/core/components/issues/extra-properties/controls/member.tsx` — 新文件
- `apps/web/core/components/issues/extra-properties/controls/index.ts` — 导出新控件
- `apps/web/core/components/issues/extra-properties/extra-property-control.tsx` — 新增 case
- `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx` — 新增图标
- `apps/web/core/components/workspace/settings/extra-properties/form.tsx` — 新增类型和颜色配置

**上游冲突风险：** 低。extra property 系统是本项目自定义功能，不存在于上游 Plane，无 rebase 冲突风险。
