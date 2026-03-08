# 扩展功能 API 文档规范

## Purpose

定义内部扩展功能（扩展属性、工作项类型）的 API 文档要求，以及 API 使用入口文档的结构规范。

## Requirements

### Requirement: 扩展属性 API 文档

`docs/api/extra-properties.md` SHALL 文档化以下内容：工作区级 extra-properties 配置端点（CRUD）、项目级与工作项类型的绑定端点，以及工作项 `extra_properties` JSONField 的读写方式。

文档 SHALL 明确说明：服务端对 `extra_properties` 字段内容不做 schema 校验，有效字段 key 需参考工作区设置页面的扩展属性配置。

#### Scenario: 文档包含端点参考和示例

- **WHEN** 用户查阅 `docs/api/extra-properties.md`
- **THEN** 文档 SHALL 包含 `GET /api/workspaces/{slug}/extra-properties/` 的请求/响应示例
- **THEN** 文档 SHALL 包含在工作项 CREATE/PATCH 中传入 `extra_properties` 的 curl 示例
- **THEN** 文档 SHALL 说明 `extra_properties` 键值对结构（`{"<key>": "<value>"}`）

#### Scenario: 文档包含无效字段的行为说明

- **WHEN** 用户通过 API 写入了未在工作区配置中定义的 extra_properties key
- **THEN** 文档 SHALL 说明该值将被存储但不会在 UI 中渲染，建议只写入已配置的 key

---

### Requirement: 工作项类型 API 文档

`docs/api/issue-types.md` SHALL 文档化工作区级和项目级工作项类型端点，包括如何查询可用类型（含 Milestone、Report）、如何在创建工作项时指定类型。

#### Scenario: 文档说明如何获取类型 ID

- **WHEN** 用户需要通过 API 创建 Milestone 类型的工作项
- **THEN** 文档 SHALL 包含先调用 `GET /api/workspaces/{slug}/issue-types/` 获取 Milestone 的 UUID 的步骤
- **THEN** 文档 SHALL 包含在工作项 CREATE 请求体中传入 `type_id` 字段的示例

---

### Requirement: API 使用入口文档

`docs/api/README.md` SHALL 作为所有内部 API 文档的索引，提供认证方式说明、基础概念（内部术语）和各文档入口。

#### Scenario: 文档包含 API token 获取步骤

- **WHEN** 新成员需要配置 API 访问
- **THEN** `README.md` SHALL 说明通过 UI 创建 API token 的路径（Profile → API Tokens）
- **THEN** `README.md` SHALL 说明 `X-Api-Key` header 的使用方式

#### Scenario: 文档包含内部术语对照

- **WHEN** 用户看到 API 端点路径中的 `/projects/`
- **THEN** `README.md` SHALL 说明这对应内部称呼的「空间」
- **THEN** `README.md` SHALL 提供完整对照表：空间(project)、项目(module)、迭代(cycle)、工作项(work-item)
