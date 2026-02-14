## 1. 后端数据模型变更

- [ ] 1.1 修改 `ExtraPropertyConfig` 模型：移除 `issue_type` FK，修改唯一约束从 `(issue_type, key)` 到 `(workspace, key)`，更新 `__str__` 和 Meta
- [ ] 1.2 新建 `IssueTypeExtraProperty` 模型：字段 project(FK), issue_type(FK), extra_property_config(FK), sort_order(FloatField)；唯一约束 `(project, issue_type, extra_property_config)` with deleted_at=null
- [ ] 1.3 在 `apps/api/plane/db/models/__init__.py` 注册新模型
- [ ] 1.4 创建 Django 数据库迁移文件

## 2. 后端 API — Extra Property CRUD 重构

- [ ] 2.1 修改 `ExtraPropertyConfigSerializer`：移除 issue_type 相关字段，改为从 URL context 获取 workspace_id
- [ ] 2.2 修改 `ExtraPropertyConfigEndpoint` (list/create)：移除 `issue_type_id` URL 参数，改为按 workspace 查询
- [ ] 2.3 修改 `ExtraPropertyConfigDetailEndpoint` (get/patch/delete)：移除 `issue_type_id` URL 参数
- [ ] 2.4 更新 `apps/api/plane/app/urls/workspace.py`：将 extra-properties 路由从 `/issue-types/<type_id>/extra-properties/` 改为 `/extra-properties/`

## 3. 后端 API — 绑定管理端点

- [ ] 3.1 创建 `IssueTypeExtraPropertySerializer` 序列化器，包含嵌套的 extra_property_config detail
- [ ] 3.2 创建 `IssueTypeExtraPropertyEndpoint` 视图（list/create），路径为 `/projects/<pid>/issue-types/<type_id>/extra-properties/`
- [ ] 3.3 创建 `IssueTypeExtraPropertyDetailEndpoint` 视图（delete），路径为 `/projects/<pid>/issue-types/<type_id>/extra-properties/<id>/`
- [ ] 3.4 在 `apps/api/plane/app/urls/project.py` 添加绑定管理路由
- [ ] 3.5 在 `apps/api/plane/app/views/__init__.py` 和 `serializers/__init__.py` 注册新增的视图和序列化器

## 4. 前端类型定义更新

- [ ] 4.1 更新 `packages/types/src/extra-property.ts`：从 `TExtraPropertyConfig` 移除 `issue_type` 字段
- [ ] 4.2 新增 `TIssueTypeExtraProperty` 类型定义（id, project, issue_type, extra_property_config, extra_property_config_detail, sort_order）
- [ ] 4.3 更新 `packages/types/src/settings.ts`：在 `TWorkspaceSettingsTabs` 联合类型中添加 `"extra-properties"`

## 5. 前端 Service 层更新

- [ ] 5.1 修改 `ExtraPropertyConfigService`：API 路径从 `/issue-types/<typeId>/extra-properties/` 改为 `/extra-properties/`，方法签名移除 `issueTypeId` 参数
- [ ] 5.2 新建 `IssueTypeExtraPropertyService`：提供 getBindings(slug, projectId, issueTypeId)、createBinding(slug, projectId, issueTypeId, configId)、deleteBinding(slug, projectId, issueTypeId, bindingId) 方法

## 6. 前端 Store 层更新

- [ ] 6.1 修改 `ExtraPropertyConfigStore`：将 `issueTypeConfigsMap` 替换为 `workspaceConfigsMap`（workspaceSlug → configId[]），更新 fetch/create/update/delete actions
- [ ] 6.2 新建 `IssueTypeExtraPropertyStore`：管理 `bindingMap[projectId][issueTypeId] → binding[]`，提供 fetchBindings、createBinding、deleteBinding actions
- [ ] 6.3 在 `root.store.ts` 注册新 store，创建对应的 `useIssueTypeExtraProperty` hook

## 7. Workspace 设置页面 — Extra Properties

- [ ] 7.1 在 `packages/constants/src/settings/workspace.ts` 添加 `"extra-properties"` 设置项配置到 FEATURES 分类
- [ ] 7.2 在 sidebar item-icon.tsx 添加 extra-properties 图标映射
- [ ] 7.3 创建页面目录 `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/extra-properties/`，包含 page.tsx 和 header.tsx
- [ ] 7.4 创建 `ExtraPropertySettingsRoot` 组件：列表展示所有 workspace extra properties
- [ ] 7.5 创建 `ExtraPropertyForm` 组件：支持创建和编辑属性（label, key, type, description, required, options 等）
- [ ] 7.6 创建 `ExtraPropertyItem` 组件：单个属性卡片，含编辑和删除操作
- [ ] 7.7 添加删除确认对话框

## 8. 项目设置页面 — Extra Property 绑定 UI

- [ ] 8.1 修改 `WorkItemTypeItem` 组件：添加展开/折叠控制和展开区域
- [ ] 8.2 创建 `ExtraPropertyBindingList` 组件：在展开区域中展示 workspace 所有 extra properties 的 checkbox 列表
- [ ] 8.3 实现 checkbox 切换逻辑：勾选调用 createBinding，取消勾选调用 deleteBinding
- [ ] 8.4 处理边界情况：workspace 无属性时的空状态提示、非 admin 只读模式、未启用的 item type 不可展开

## 9. Issue 详情渲染适配

- [ ] 9.1 修改 `WorkItemAdditionalSidebarProperties`：从按 issueTypeId 获取配置改为按 project + issueType 获取绑定关系，再从绑定获取配置
- [ ] 9.2 更新 `ExtraPropertyRenderer` 的数据源逻辑（如需要）

## 10. 国际化和验证

- [ ] 10.1 在 i18n translations 中添加 workspace extra property settings 相关的翻译 key
- [ ] 10.2 在 i18n translations 中添加 project binding UI 相关的翻译 key
- [ ] 10.3 运行 `pnpm check:types` 验证 TypeScript 类型检查通过
- [ ] 10.4 运行 `ruff check .` 和 `ruff format .` 验证后端代码规范
