## Why

当前 Extra Property 的定义绑定在特定 issue type 上（`ExtraPropertyConfig.issue_type` FK），无法跨项目共享。管理员需要在每个 issue type 下重复定义相同的属性。需要将 Extra Property 的定义提升到 workspace 级别统一管理，项目中仅选择某个 item type 使用哪些已定义的 Extra Property，降低配置成本并保证一致性。

## What Changes

- **BREAKING** 将 `ExtraPropertyConfig.issue_type` FK 移除，改为纯 workspace 级别定义。Extra Property 不再绑定到特定 issue type
- 新增 `IssueTypeExtraProperty` 关联模型，用于在项目级别绑定 issue type 与 extra property 的关系
- 新增 workspace 级别设置页面（`/settings/extra-properties/`），提供 Extra Property 的增删改功能，这是定义 Extra Property 的唯一入口
- 修改项目设置的 Work Item Types 页面，支持为每个 item type 选择/取消已有的 Extra Property
- 调整现有 API 端点：Extra Property CRUD 改为 workspace 作用域（不再嵌套在 issue-type 下）
- 新增 API 端点：项目级别的 issue type - extra property 绑定管理

## Capabilities

### New Capabilities

- `extra-property-settings`: Workspace 级别 Extra Property 管理设置页面，包括属性定义的 CRUD 操作界面
- `project-extra-property-binding`: 项目级别的 extra property 与 issue type 绑定机制，包括关联模型、API 端点和项目设置页面中的绑定 UI

### Modified Capabilities

- `extra-properties`: 数据模型变更 — `ExtraPropertyConfig` 移除 `issue_type` FK，API 端点路径从 `/issue-types/<id>/extra-properties/` 改为 `/extra-properties/`，序列化器和 store 相应调整
- `work-item-types`: 项目设置页面扩展 — 每个 work item type 卡片增加 Extra Property 绑定管理功能

## Impact

**后端 (Django)**:

- `apps/api/plane/db/models/extra_property.py` — 模型结构变更，移除 `issue_type` FK
- `apps/api/plane/db/migrations/` — 需要新增迁移文件处理模型变更
- `apps/api/plane/app/views/workspace/extra_property.py` — API 视图路径和查询逻辑调整
- `apps/api/plane/app/urls/workspace.py` — URL 路由变更
- `apps/api/plane/app/serializers/extra_property.py` — 序列化器移除 issue_type 相关逻辑
- 新增：绑定关联模型、视图、序列化器、URL

**前端 (React)**:

- `packages/types/src/extra-property.ts` — 类型定义调整
- `apps/web/core/store/extra-property-config.store.ts` — Store 适配新 API 结构
- `apps/web/core/services/extra-property-config.service.ts` — Service 层 API 路径调整
- `apps/web/core/components/project-work-item-types/` — 扩展 work item type 卡片
- 新增：workspace 设置页面组件、绑定管理组件

**上游同步风险**:

- `extra_property.py` 模型和视图为本地新增文件，与上游无冲突
- `workspace.py` URL 文件为中风险（上游可能新增路由）
- `issue.py` 模型中 `extra_properties` JSONField 的读取逻辑需验证兼容性
