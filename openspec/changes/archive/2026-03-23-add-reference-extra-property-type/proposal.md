## Why

工作项（Issue）的 extra property 系统目前支持 text、textarea、select、multiselect、checkbox、member 六种类型，缺少存储外部链接列表的能力。在实际项目管理中，用户经常需要将需求文档（Confluence）、任务跟踪（Jira）、代码评审（GitHub PR）等外部资源与工作项关联，目前只能手动填写在描述文字里，无法结构化存储和一键跳转。

## What Changes

- 新增 `reference` 类型的 extra property，支持存储一个或多个外部链接
- 每条链接包含 `display`（显示文本，必填）和 `url`（链接地址）两个字段
- Normal 模式下，以逗号分隔的可点击链接形式展示；点击属性区域弹出 Popover 编辑器，支持增删改链接条目
- Compact 模式下，显示链接图标（有链接时蓝色，无链接时灰色）；点击展开只读导航 Dropdown，列出所有链接供点击跳转
- 扩展 `TExtraPropertyValue` 联合类型，新增 `TReferenceItem[]` 分支
- `reference` 类型与其他任何类型均不兼容（类型转换时清空值）
- 配置界面无额外 config 字段，仅需 label/key

## Capabilities

### New Capabilities

- `reference-extra-property-type`：reference 类型 extra property 的完整实现，涵盖后端模型/校验/migration、TypeScript 类型扩展、Normal 模式控件（Popover 编辑器）、Compact 模式控件（只读导航 Dropdown）及配置界面集成

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

**后端**

- `apps/api/plane/db/models/extra_property.py` — `TYPE_CHOICES` 新增 `reference`
- `apps/api/plane/app/serializers/extra_property.py` — 新增 reference 值校验
- `apps/api/plane/db/migrations/` — 新建 migration（AlterField）

**前端**

- `packages/types/src/extra-property.ts` — 新增 `TReferenceItem` 接口，扩展 `TExtraPropertyValue` 和 `TExtraPropertyType`
- `apps/web/core/components/issues/extra-properties/controls/reference.tsx` — 新建
- `apps/web/core/components/issues/extra-properties/compact-controls/compact-reference.tsx` — 新建
- `apps/web/core/components/issues/extra-properties/extra-property-control.tsx` — 新增 case
- `apps/web/core/components/issues/extra-properties/compact-controls/compact-extra-property-control.tsx` — 新增 case
- `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx` — 新增图标映射
- `apps/web/core/components/workspace/settings/extra-properties/form.tsx` — 新增类型选项和兼容矩阵条目

**上游冲突风险**

- `extra-property.ts`（types 包）：低风险，自定义扩展
- `extra_property.py`（后端模型）：低风险，仅追加 choices
- `form.tsx`（配置界面）：中等风险，上游可能同步修改此文件
