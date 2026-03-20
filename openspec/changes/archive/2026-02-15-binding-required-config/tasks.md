## 1. 数据库模型和迁移

- [x] 1.1 在 `IssueTypeExtraProperty` 模型中添加 `is_required = models.BooleanField(default=False)` 字段 (`apps/api/plane/db/models/extra_property.py`)
- [x] 1.2 创建 Django 迁移文件：添加 `is_required` 列到 `issue_type_extra_properties` 表，数据迁移将 `ExtraPropertyConfig.required` 值复制到关联的 `IssueTypeExtraProperty.is_required`，然后移除 `ExtraPropertyConfig.required` 列

## 2. API 序列化器

- [x] 2.1 从 `ExtraPropertyConfigSerializer.Meta.fields` 中移除 `"required"` (`apps/api/plane/app/serializers/extra_property.py`)
- [x] 2.2 从 `ExtraPropertyConfigLiteSerializer.Meta.fields` 中移除 `"required"`
- [x] 2.3 在 `IssueTypeExtraPropertySerializer.Meta.fields` 中添加 `"is_required"`

## 3. API 视图 — 绑定 PATCH 端点

- [x] 3.1 在 `IssueTypeExtraPropertyDetailEndpoint` 中添加 `patch` 方法，支持更新 `is_required` 和 `sort_order` (`apps/api/plane/app/views/project/issue_type_extra_property.py`)
- [x] 3.2 确认 URL 路由已注册 PATCH 方法到 `IssueTypeExtraPropertyDetailEndpoint`（检查 `apps/api/plane/app/urls/project.py`）

## 4. TypeScript 类型定义

- [x] 4.1 从 `TExtraPropertyConfig` 接口中移除 `required` 字段 (`packages/types/src/extra-property.ts`)
- [x] 4.2 从 `TExtraPropertyConfigLite` 的 Pick 类型中移除 `"required"`
- [x] 4.3 在 `TIssueTypeExtraProperty` 接口中添加 `is_required: boolean` 字段
- [x] 4.4 在 `TIssueTypeExtraPropertyPayload` 类型中添加可选的 `is_required?: boolean` 字段

## 5. 前端服务层 — 绑定 PATCH

- [x] 5.1 在 `IssueTypeExtraPropertyService` 中添加 `updateBinding` 方法，调用 PATCH 端点 (`apps/web/core/services/issue-type-extra-property.service.ts`)

## 6. 前端 Store — 绑定更新

- [x] 6.1 在 `IssueTypeExtraPropertyStore` 接口和实现中添加 `updateBinding` 方法，调用服务层 PATCH 并更新 `bindingMap` 中的记录 (`apps/web/core/store/issue-type-extra-property.store.ts`)

## 7. 工作空间设置页面 — 移除 required

- [x] 7.1 从属性表单中移除 required 字段（表单状态、ToggleSwitch 控件、提交 payload）(`apps/web/core/components/workspace/settings/extra-properties/form.tsx`)
- [x] 7.2 从属性列表项中移除 required 徽章显示 (`apps/web/core/components/workspace/settings/extra-properties/item.tsx`)

## 8. 项目设置 — 绑定列表增加 Required 开关

- [x] 8.1 在绑定列表每个已绑定属性行中添加 Required toggle 开关，绑定到 `updateBinding` store 方法 (`apps/web/core/components/project-work-item-types/extra-property-binding-list.tsx`)

## 9. i18n

- [x] 9.1 移除或调整 `workspace_settings.settings.extra_properties.required_badge` 和 `workspace_settings.settings.extra_properties.form.required` 翻译键，添加绑定级别 required toggle 的翻译键 (`packages/i18n/src/locales/en/translations.ts`)
