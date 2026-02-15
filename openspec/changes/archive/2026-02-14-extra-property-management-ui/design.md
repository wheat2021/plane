## Context

当前 `ExtraPropertyConfig` 模型通过 `issue_type` FK 绑定到特定 IssueType，API 路径为 `/workspaces/<slug>/issue-types/<type_id>/extra-properties/`。这意味着同一个属性定义（如"截止日期"）如果需要用在多个 issue type 上，必须重复创建。前端 store 也按 `issueTypeId` 索引配置。

目标是将属性定义提升到 workspace 级别统一管理，通过关联模型在项目级别绑定 issue type 与属性的关系。

现有 workspace 设置页面遵循统一的模式：`packages/constants/src/settings/workspace.ts` 定义导航项，`packages/types/src/settings.ts` 定义类型，页面放在 `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/` 下。

## Goals / Non-Goals

**Goals:**

- 将 `ExtraPropertyConfig` 改为 workspace 级别定义，移除 `issue_type` FK
- 新增 `IssueTypeExtraProperty` 关联模型实现项目级别的 issue type - extra property 绑定
- 提供 workspace 设置页面用于 Extra Property 的 CRUD 管理
- 在项目设置 Work Item Types 页面中为每个 item type 提供 Extra Property 绑定选择 UI
- Issue 详情的 extra properties 渲染逻辑适配新的绑定模型

**Non-Goals:**

- 不改变已有的 6 种控件类型或属性值存储格式（`Issue.extra_properties` JSONField 不变）
- 不实现属性值的批量迁移（移除绑定后已有的 extra_properties 值保留在 Issue 中不清理）
- 不实现拖拽排序（排序通过 sort_order 字段手动管理）
- 不新增权限等级（复用现有 ADMIN/MEMBER/GUEST 体系）

## Decisions

### D1: 数据模型 — 移除 issue_type FK，新增绑定模型

**选择**: 从 `ExtraPropertyConfig` 移除 `issue_type` FK，新增 `IssueTypeExtraProperty(project, issue_type, extra_property_config)` 关联模型。

**理由**: 属性定义与 issue type 解耦后，同一属性可被多个 issue type 使用。绑定在项目级别建立，因为不同项目可能为同一 issue type 启用不同的属性集。

**替代方案**:

- 保留 `issue_type` FK 不变，改用 M:N 直接关联 → 但这仍然是 workspace 级绑定而非项目级，无法支持项目差异化
- 用 JSONField 在 `ProjectIssueType` 上存储绑定的属性 ID 列表 → 缺乏引用完整性，且查询不便

**唯一约束变更**: 原 `(issue_type, key)` 改为 `(workspace, key)`，确保同一 workspace 下属性 key 唯一。

### D2: API 路径重构

**选择**: Extra Property CRUD 端点改为 workspace 作用域。

| 操作           | 旧路径                                                            | 新路径                                      |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| 列表/创建      | `/workspaces/<slug>/issue-types/<type_id>/extra-properties/`      | `/workspaces/<slug>/extra-properties/`      |
| 详情/更新/删除 | `/workspaces/<slug>/issue-types/<type_id>/extra-properties/<id>/` | `/workspaces/<slug>/extra-properties/<id>/` |

绑定管理端点为新增：
| 操作 | 路径 |
|------|------|
| 获取项目某 issue type 的绑定列表 | `GET /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` |
| 添加绑定 | `POST /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/` |
| 移除绑定 | `DELETE /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/<binding_id>/` |

**理由**: CRUD 操作不再依赖 issue type 上下文。绑定端点嵌套在 project + issue-type 下，语义清晰。

### D3: Issue 详情渲染路径适配

**选择**: `WorkItemAdditionalSidebarProperties` 改为查询绑定关系来获取属性配置，而非直接按 issue_type_id 查。

查询流程：

1. 从 `IssueTypeExtraProperty` 获取当前项目 + issue type 的绑定列表
2. 根据绑定的 `extra_property_config_id` 从 `configMap` 获取配置
3. 渲染属性控件

**Store 变更**:

- `ExtraPropertyConfigStore` 新增 `workspaceConfigsMap`（workspace 级别索引）替代 `issueTypeConfigsMap`
- 新增 `IssueTypeExtraPropertyStore` 管理绑定关系，状态为 `bindingMap[projectId][issueTypeId] → configId[]`
- `getConfigsByIssueType()` 不再直接查 store，改为先查绑定再查配置

### D4: Workspace 设置页面位置

**选择**: 放在 `WORKSPACE_SETTINGS_CATEGORY.FEATURES` 分类下，key 为 `"extra-properties"`。

**理由**: 这是功能性配置而非管理性操作。FEATURES 分类当前为空，Extra Properties 适合作为首个功能设置项。

### D5: 项目设置 UI 扩展方式

**选择**: 在现有 `WorkItemTypeItem` 卡片上添加展开区域，展开后显示可选的 Extra Property 列表（checkbox 多选模式）。

**替代方案**:

- 为每个 item type 单独创建子页面 → 增加导航深度，体验差
- 用 Modal 弹窗选择 → 可行但不如展开式直观

### D6: 迁移策略

**选择**: 分步迁移。

1. 新建 `IssueTypeExtraProperty` 模型
2. 从 `ExtraPropertyConfig` 移除 `issue_type` FK（ALTER TABLE DROP COLUMN）
3. 修改唯一约束从 `(issue_type, key)` 到 `(workspace, key)`
4. 数据迁移：对于已有的 ExtraPropertyConfig 记录，由于移除了 issue_type FK，不需要数据转换。已有的 Issue.extra_properties 值保持不变（key 对应关系仍然有效）

**回滚**: 不支持自动回滚。如需回滚需手动恢复 `issue_type` 列并重建约束。

## Risks / Trade-offs

**[BREAKING API] 旧 API 路径失效** → 所有前端代码同步更新，无外部消费者依赖此 API（仅内部使用）。

**[数据一致性] 移除绑定后的孤立属性值** → 设计上不清理 `Issue.extra_properties` 中对应的值。重新绑定后值自动恢复显示。Trade-off: 数据不会丢失但可能存在冗余。

**[上游同步] workspace.py URL 文件冲突** → 中风险。通过追加到文件末尾减少冲突概率。

**[性能] 绑定查询额外开销** → Issue 详情渲染需额外查询绑定关系。通过 store 缓存 + SWR 缓解。绑定数据量小（每个 project × type 仅几条），性能影响可忽略。
