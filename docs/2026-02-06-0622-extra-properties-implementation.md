# Extra Properties 功能实现

## 目标

为不同的工作项类型 (Work Item Type) 支持不同的额外属性 (Extra Properties)，这些属性以 JSON 形式存储，并在工作项详情视图中展示和编辑。

## 方案选择

- **类型复用**: 仅复用 aurora-prompt-core 的类型定义（不引入包依赖）
- **存储方案**: 独立 ExtraPropertyConfig Django 模型（与 IssueType 一对多关系）
- **输入类型**: text, textarea, select, multiselect, checkbox, markdown
- **配置管理**: 暂通过 API/数据库直接配置

---

## 开发日志

### 2026-02-06 06:22 - Phase 1: 后端基础

#### 1.1 创建 ExtraPropertyConfig 模型

- **文件**: `apps/api/plane/db/models/extra_property.py`
- 字段: workspace, issue_type, key, label, type, description, required, sort_order, config (JSON)
- 支持类型: text, textarea, select, multiselect, checkbox, markdown
- config JSON 存储: options, default_value, true_value, false_value

#### 1.2 修改 Issue 模型

- **文件**: `apps/api/plane/db/models/issue.py`
- 添加 `extra_properties = models.JSONField(default=dict, blank=True)` 字段

#### 1.3 创建序列化器

- **文件**: `apps/api/plane/app/serializers/extra_property.py`
- ExtraPropertyConfigSerializer: 扁平化 config 中的 options/default_value
- 修改 IssueSerializer 添加 extra_properties 字段

#### 1.4 创建 API 视图

- **文件**: `apps/api/plane/app/views/workspace/extra_property.py`
- 端点:
  - `GET/POST /api/workspaces/{slug}/issue-types/{issue_type_id}/extra-properties/`
  - `GET/PATCH/DELETE /api/workspaces/{slug}/issue-types/{issue_type_id}/extra-properties/{pk}/`

---

### 2026-02-06 06:35 - Phase 2: 前端类型和状态管理

#### 2.1 TypeScript 类型定义

- **文件**: `packages/types/src/extra-property.ts`
- 类型: TExtraPropertyType, TExtraPropertyOption, TExtraPropertyConfig, TExtraPropertyValue, TIssueExtraProperties

#### 2.2 修改 TBaseIssue

- **文件**: `packages/types/src/issues/issue.ts`
- 添加 `extra_properties?: TIssueExtraProperties`

#### 2.3 API Service

- **文件**: `apps/web/core/services/extra-property-config.service.ts`
- 方法: getConfigsForIssueType, createConfig, updateConfig, deleteConfig

#### 2.4 MobX Store

- **文件**: `apps/web/core/store/extra-property-config.store.ts`
- observables: configMap, issueTypeConfigsMap, fetchedMap
- actions: fetchConfigsForIssueType, createConfig, updateConfig, deleteConfig

#### 2.5 Store Hook

- **文件**: `apps/web/core/hooks/store/use-extra-property-config.ts`

---

### 2026-02-06 06:50 - Phase 3: 前端组件

#### 3.1 额外属性控件目录

- **目录**: `apps/web/core/components/issues/extra-properties/`

#### 3.2 控件组件

- `controls/text.tsx`: 文本输入
- `controls/textarea.tsx`: 多行文本
- `controls/select.tsx`: 单选下拉
- `controls/multi-select.tsx`: 多选下拉
- `controls/checkbox.tsx`: 复选框 (ToggleSwitch)
- `controls/markdown.tsx`: Markdown 编辑器 (LiteTextEditor 富文本)

#### 3.3 核心组件

- `extra-property-control.tsx`: 控件分发器
- `extra-property-renderer.tsx`: 渲染所有额外属性

#### 3.4 集成到详情视图

- **文件**: `apps/web/ce/components/issues/issue-details/additional-properties.tsx`
- 实现 WorkItemAdditionalSidebarProperties 组件
- 自动根据 issue type 加载和渲染额外属性

---

## 文件清单

> 以下仅列出业务代码、迁移及类型文件，不含 CLAUDE.md 辅助文档及本文档自身。

### 新建文件 (18 个)

| 路径                                                                                        | 说明            |
| ------------------------------------------------------------------------------------------- | --------------- |
| `apps/api/plane/db/models/extra_property.py`                                                | Django 模型     |
| `apps/api/plane/db/migrations/0121_add_extra_property_config_and_issue_extra_properties.py` | 数据库迁移      |
| `apps/api/plane/app/serializers/extra_property.py`                                          | DRF 序列化器    |
| `apps/api/plane/app/views/workspace/extra_property.py`                                      | API 视图        |
| `packages/types/src/extra-property.ts`                                                      | TypeScript 类型 |
| `apps/web/core/services/extra-property-config.service.ts`                                   | API 服务        |
| `apps/web/core/store/extra-property-config.store.ts`                                        | MobX Store      |
| `apps/web/core/hooks/store/use-extra-property-config.ts`                                    | Store Hook      |
| `apps/web/core/components/issues/extra-properties/index.ts`                                 | Barrel export   |
| `apps/web/core/components/issues/extra-properties/extra-property-renderer.tsx`              | 渲染器          |
| `apps/web/core/components/issues/extra-properties/extra-property-control.tsx`               | 控件分发        |
| `apps/web/core/components/issues/extra-properties/controls/index.ts`                        | 控件导出        |
| `apps/web/core/components/issues/extra-properties/controls/text.tsx`                        | 文本控件        |
| `apps/web/core/components/issues/extra-properties/controls/textarea.tsx`                    | 多行文本控件    |
| `apps/web/core/components/issues/extra-properties/controls/select.tsx`                      | 单选控件        |
| `apps/web/core/components/issues/extra-properties/controls/multi-select.tsx`                | 多选控件        |
| `apps/web/core/components/issues/extra-properties/controls/checkbox.tsx`                    | 复选框控件      |
| `apps/web/core/components/issues/extra-properties/controls/markdown.tsx`                    | Markdown 控件   |

### 修改文件 (10 个)

| 路径                                                                    | 修改内容                              |
| ----------------------------------------------------------------------- | ------------------------------------- |
| `apps/api/plane/db/models/__init__.py`                                  | 导出 ExtraPropertyConfig              |
| `apps/api/plane/db/models/issue.py`                                     | 添加 extra_properties 字段            |
| `apps/api/plane/app/serializers/__init__.py`                            | 导出新序列化器                        |
| `apps/api/plane/app/serializers/issue.py`                               | IssueSerializer 添加 extra_properties |
| `apps/api/plane/app/views/__init__.py`                                  | 导出新视图                            |
| `apps/api/plane/app/urls/workspace.py`                                  | 添加 URL 路由                         |
| `packages/types/src/index.ts`                                           | 导出 extra-property 类型              |
| `packages/types/src/issues/issue.ts`                                    | TBaseIssue 添加 extra_properties      |
| `apps/web/core/store/root.store.ts`                                     | 添加 extraPropertyConfig store        |
| `apps/web/ce/components/issues/issue-details/additional-properties.tsx` | 实现渲染逻辑                          |

---

## 待完成工作

（全部已完成）

---

## API 使用示例

### 创建额外属性配置

```bash
curl -X POST /api/workspaces/{slug}/issue-types/{issue_type_id}/extra-properties/ \
  -H "Content-Type: application/json" \
  -d '{
    "key": "severity",
    "label": "Severity",
    "type": "select",
    "required": false,
    "options": [
      {"value": "critical", "label": "Critical"},
      {"value": "high", "label": "High"},
      {"value": "medium", "label": "Medium"},
      {"value": "low", "label": "Low"}
    ],
    "default_value": "medium"
  }'
```

### 更新工作项的额外属性

```bash
curl -X PATCH /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/ \
  -H "Content-Type: application/json" \
  -d '{
    "extra_properties": {
      "severity": "high"
    }
  }'
```

---

## 验证结果

### 后端验证 (2026-02-06 08:03)

- 数据库迁移 `0121_add_extra_property_config_and_issue_extra_properties` 已成功应用
- ExtraPropertyConfig 模型正常加载，表名 `extra_property_configs`
- 创建了 4 个测试配置（Severity/select, Affected Version/text, Reproducible/checkbox, Custom Tags/multiselect）
- 序列化器正确扁平化 config 字段为 options/default_value/true_value/false_value
- Issue.extra_properties JSON 字段读写正常验证通过

### 前端验证

- TypeScript 类型检查通过 (`pnpm --filter=web check:types`)
- ESLint 检查通过（0 errors, 仅 warnings）

### 浏览器 UI 验证 (2026-02-06 16:30)

- 额外属性在工作项 peek overview 中正确渲染（位于标准属性下方）
- 4 种控件类型均已验证通过：
  - **Select** (Severity): 下拉选择 Critical/High/Medium/Low，修改后 PATCH 204 成功
  - **Text** (Affected Version): 文本输入，blur 后自动保存，PATCH 204 成功
  - **Checkbox** (Reproducible): ToggleSwitch 切换 Yes/No，点击后立即保存
  - **Multi-select** (Custom Tags): 多选下拉 Frontend/Backend/Database/DevOps，选中后显示逗号分隔
- 数据持久化验证：关闭并重新打开 peek view 后所有值正确保留
- API 调用链路：组件加载时 fetch extra-properties 配置 → 编辑时 PATCH issue 更新 extra_properties JSON

### Markdown 编辑器升级 (2026-02-06 21:15)

- 将 `controls/markdown.tsx` 从简单 textarea 升级为 LiteTextEditor 富文本编辑器
- 使用项目现有的 `@/components/editor/lite-text` wrapper，`variant="none"` 无工具栏模式
- 支持富文本格式化（加粗、斜体、列表等），通过键盘快捷键操作
- 通过 `useWorkspace` 获取 workspaceId，通过 `useEditorAsset` 获取文件上传/复制处理器
- 内容以 HTML 格式存储到 extra_properties JSON 字段
- Blur 时自动保存，使用容器级 onBlur 事件检测焦点离开
- TypeScript 类型检查和 ESLint 检查均通过
- 浏览器验证：
  - Release Notes (markdown) 字段正确渲染 LiteTextEditor
  - 富文本输入和格式化（Cmd+B 加粗）功能正常
  - Blur 触发 PATCH 204 保存成功
  - 关闭重新打开 peek view 后内容（含格式）正确保留

## Summary

成功实现了 Extra Properties 功能的完整后端和前端代码。该功能允许为不同的工作项类型配置不同的额外属性，支持 6 种输入类型（text, textarea, select, multiselect, checkbox, markdown）。额外属性会在工作项详情侧边栏（peek overview 和全屏详情页）中自动渲染，用户可以直接编辑。所有控件类型（select, text, checkbox, multiselect, markdown）均已在浏览器中验证通过，数据正确持久化到后端。Markdown 控件已升级为 LiteTextEditor 富文本编辑器，支持格式化编辑。
