# Extra Properties

## 概述

支持不同工作项类型定义各自的自定义属性（Extra Properties）。属性配置与 IssueType 关联，属性值以 JSON 形式存储在 Issue 记录中。切换工作项类型时，详情面板自动渲染对应类型的属性表单。

## 功能范围

### 1. 属性配置管理

- 每个 IssueType 可定义多个属性配置（ExtraPropertyConfig）
- 配置包含：key（唯一标识）、label（显示名）、type（控件类型）、是否必填、排序、选项等
- 通过 Workspace 级 API 管理配置

### 2. 支持的控件类型

| 类型          | 说明     | 特殊配置                                               |
| ------------- | -------- | ------------------------------------------------------ |
| `text`        | 单行文本 | `default_value`                                        |
| `textarea`    | 多行文本 | `default_value`                                        |
| `select`      | 单选下拉 | `options: [{value, label?, isDefault?}]`               |
| `multiselect` | 多选下拉 | 同 select                                              |
| `checkbox`    | 复选框   | `true_value`（默认 "Yes"）、`false_value`（默认 "No"） |
| `markdown`    | 富文本   | 使用 LiteTextEditor，存储 HTML 格式                    |

### 3. 属性值存储与展示

- Issue.extra_properties 为 JSONField，键为 config.key，值为对应类型的值
- 详情侧边栏 Additional Properties 区域自动渲染
- 按 sort_order 排序显示
- 失焦时自动保存（blur-on-save 模式）

### 4. postProcessor 支持

- 属性配置可附带 `postProcessor` 函数名
- 用于对字段值进行自定义后处理（如格式转换、计算）

## 数据模型

### ExtraPropertyConfig（Workspace 级，关联 IssueType）

| 字段        | 类型           | 说明                                                     |
| ----------- | -------------- | -------------------------------------------------------- |
| id          | UUID           | PK                                                       |
| workspace   | FK → Workspace | 所属工作空间                                             |
| issue_type  | FK → IssueType | 关联的工作项类型                                         |
| key         | CharField(100) | 属性标识符（同类型内唯一）                               |
| label       | CharField(255) | 显示名称                                                 |
| type        | CharField      | 控件类型（6 种之一）                                     |
| description | TextField      | 属性描述                                                 |
| required    | BooleanField   | 是否必填                                                 |
| sort_order  | FloatField     | 排序权重（默认 65535）                                   |
| config      | JSONField      | 类型特定配置（options, default_value, true/false_value） |

**约束**: `(issue_type, key)` 在未软删除时唯一。

### Issue 扩展字段

| 字段             | 类型                    | 说明                         |
| ---------------- | ----------------------- | ---------------------------- |
| extra_properties | JSONField(default=dict) | `{config_key: value}` 键值对 |

值类型对应关系：

| 控件类型    | 值类型     | 示例                                  |
| ----------- | ---------- | ------------------------------------- |
| text        | `string`   | `"some text"`                         |
| textarea    | `string`   | `"multi\nline"`                       |
| select      | `string`   | `"option_value"`                      |
| multiselect | `string[]` | `["val1", "val2"]`                    |
| checkbox    | `boolean`  | `true`                                |
| markdown    | `string`   | `"<p>rich <strong>text</strong></p>"` |

## API 端点

| 方法             | 路径                                                              | 说明               |
| ---------------- | ----------------------------------------------------------------- | ------------------ |
| GET/POST         | `/workspaces/<slug>/issue-types/<type_id>/extra-properties/`      | 获取/创建属性配置  |
| GET/PATCH/DELETE | `/workspaces/<slug>/issue-types/<type_id>/extra-properties/<id>/` | 配置详情/更新/删除 |

属性值通过 Issue 的标准 PATCH 端点更新 `extra_properties` 字段。

## 前端架构

### TypeScript 类型（`packages/types/src/extra-property.ts`）

- `TExtraPropertyType` — 6 种控件类型联合
- `TExtraPropertyConfig` — 完整配置定义
- `TExtraPropertyConfigLite` — 轻量版
- `TExtraPropertyValue` — `string | string[] | boolean | null`
- `TIssueExtraProperties` — `Record<string, TExtraPropertyValue>`
- `TExtraPropertyOption` — 下拉选项 `{value, label?, isDefault?}`

### Store（`apps/web/core/store/extra-property-config.store.ts`）

MobX store，注册于 `root.store.ts`：

- **状态**: `configMap`（id → config）、`issueTypeConfigsMap`（typeId → configId[]）、`fetchedMap`
- **计算属性**: `getConfigById()`, `getConfigsByIssueType()`（按 sort_order 排序）
- **操作**: `fetchConfigsForIssueType()`（带缓存）、`createConfig()`, `updateConfig()`, `deleteConfig()`

### Service（`apps/web/core/services/extra-property-config.service.ts`）

Axios 封装，对应上述 API 端点。

### 关键 UI 组件

| 组件                  | 路径                                                                  | 用途                            |
| --------------------- | --------------------------------------------------------------------- | ------------------------------- |
| ExtraPropertyRenderer | `core/components/issues/extra-properties/extra-property-renderer.tsx` | 按类型加载配置并渲染所有属性    |
| ExtraPropertyControl  | `core/components/issues/extra-properties/extra-property-control.tsx`  | 根据 config.type 分发到具体控件 |
| TextControl           | `controls/text.tsx`                                                   | 单行文本输入                    |
| TextareaControl       | `controls/textarea.tsx`                                               | 多行文本输入                    |
| SelectControl         | `controls/select.tsx`                                                 | 单选下拉                        |
| MultiSelectControl    | `controls/multi-select.tsx`                                           | 多选下拉                        |
| CheckboxControl       | `controls/checkbox.tsx`                                               | 复选框                          |
| MarkdownControl       | `controls/markdown.tsx`                                               | LiteTextEditor 富文本           |

### 集成点

- `ce/components/issues/issue-details/additional-properties.tsx` — 详情页渲染入口
- 依赖 `work-item-types` spec 中的 IssueType store 获取当前类型

## 数据库迁移

| 序号 | 文件                                                      | 内容                                                      |
| ---- | --------------------------------------------------------- | --------------------------------------------------------- |
| 0121 | `add_extra_property_config_and_issue_extra_properties.py` | 创建 ExtraPropertyConfig 表 + Issue.extra_properties 字段 |

## 上游差异

### 高风险

| 文件                                      | 你的改动                                     | 上游动态                                                    |
| ----------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `apps/api/plane/app/serializers/issue.py` | 新增 extra_properties 字段到 IssueSerializer | WEB-5845 重构了同文件（与 work-item-types spec 共享此风险） |
| `packages/types/src/issues/issue.ts`      | 新增 extra_properties 字段                   | 同上                                                        |

### 中风险

| 文件                                                                    | 你的改动                        | 说明                              |
| ----------------------------------------------------------------------- | ------------------------------- | --------------------------------- |
| `apps/api/plane/db/models/issue.py`                                     | 新增 extra_properties JSONField | 与 description 重构在不同区域     |
| `apps/api/plane/app/urls/workspace.py`                                  | 新增 extra-properties URL       | 路由追加，与 work-item-types 共享 |
| `apps/api/plane/app/views/__init__.py`                                  | 新增 import                     | 注册入口                          |
| `apps/api/plane/app/serializers/__init__.py`                            | 新增 import                     | 注册入口                          |
| `apps/web/ce/components/issues/issue-details/additional-properties.tsx` | 修改渲染逻辑                    | 上游 UI 重构可能影响              |
| `apps/web/core/store/root.store.ts`                                     | 注册 extraPropertyConfig store  | 与 work-item-types 共享           |

### 迁移序号

0121 依赖 0118-0120（work-item-types 的迁移）。与上游的迁移序号冲突风险同 work-item-types spec 中的分析。
