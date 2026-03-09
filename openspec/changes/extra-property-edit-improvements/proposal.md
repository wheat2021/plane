## Why

额外属性（Extra Properties）的类型一旦创建便无法修改，但业务需求变化时管理员需要调整属性类型；同时类型变更后已有的不合法值未被清除，导致 Select/Multi-Select 控件显示异常（选项不存在）。这两个问题影响管理员的日常维护效率，需要在功能稳定期集中修复。

## What Changes

- **允许修改属性类型**：编辑模式下开放类型选择器，不再强制 `disabled`
- **类型变更影响检测**：类型变更为不兼容类型时，通过新增后端 API 查询受影响的工作项数量和现有值，并在表单内展示 inline 警告 banner
- **不合法值自动清除**：控件挂载时检测当前值是否符合属性类型约束，不合法则自动清空，让用户重新输入
- **新增后端 API**：`GET /api/workspaces/{slug}/extra-properties/{pk}/values/` 返回使用该属性的工作项数量和不重复的现有值列表

## Capabilities

### New Capabilities

- `extra-property-type-change`：允许修改已有额外属性的类型，包含兼容性检查、影响范围查询、inline 警告展示
- `extra-property-value-validation`：控件初始化时校验现有值的合法性，遇到不合法值时自动清空

### Modified Capabilities

无

## Impact

**后端（apps/api/）**

- `plane/app/views/workspace/extra_property.py`：新增 `ExtraPropertyConfigValuesEndpoint` 视图类
- `plane/api/urls.py` 或 workspace URL 配置：注册新路由
  **前端（apps/web/）**
- `core/services/extra-property-config.service.ts`：新增 `getConfigValues()` 方法
- `core/store/extra-property-config.store.ts`：新增 `fetchConfigValues()` action
- `core/components/workspace/settings/extra-properties/form.tsx`：开放类型选择器 + 类型变更检查逻辑 + warning banner
- `core/components/issues/extra-properties/extra-property-control.tsx`：挂载时值合法性校验

**上游冲突风险**

- `extra_property.py`（视图）、`extra-property-control.tsx`、`form.tsx`、`root.tsx` 均为本地新增文件，上游冲突风险低
- `plane/api/urls.py`：需关注上游是否有 URL 配置变更，属中等风险
