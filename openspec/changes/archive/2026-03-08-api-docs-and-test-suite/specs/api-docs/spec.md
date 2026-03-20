## ADDED Requirements

### Requirement: v1 OpenAPI 规范完整性

v1 API（`/api/v1/`）的所有视图 SHALL 通过 `@extend_schema` 或对应的 `*_docs()` 装饰器声明 summary、tags、parameters 和 responses，使 `/api/v1/schema/` 生成的 OpenAPI YAML 包含完整的端点描述。

当前缺失注解的视图文件：`intake.py`、`asset.py`、`user.py`，以及 `cycle.py`、`module.py`、`issue.py`、`project.py` 中尚未注解的操作方法。

#### Scenario: 访问 Swagger UI 可看到所有 v1 端点的说明

- **WHEN** 用户访问 `/api/v1/schema/swagger/`
- **THEN** 所有 v1 端点 SHALL 有 summary 描述，无"No description"占位符
- **THEN** 每个端点 SHALL 归属于正确的 tag（Work Items、Cycles、Modules、Projects 等）

#### Scenario: OpenAPI YAML 包含正确的认证描述

- **WHEN** 客户端下载 `/api/v1/schema/`
- **THEN** 规范 SHALL 声明 `ApiKeyAuth` 安全方案（header: `X-Api-Key`）
- **THEN** 所有需要认证的端点 SHALL 引用该安全方案

---

### Requirement: SPECTACULAR_SETTINGS 内部定制

`SPECTACULAR_SETTINGS` SHALL 支持通过环境变量 `API_BASE_URL` 动态配置服务器地址，并将标题、描述更新为内部版本。

#### Scenario: SERVERS 反映内部实例地址

- **WHEN** 环境变量 `API_BASE_URL` 已设置（例如 `https://plane.company.internal`）
- **THEN** 生成的 OpenAPI 规范 `servers` 字段 SHALL 包含该 URL 作为首选服务器

#### Scenario: DESCRIPTION 包含内部术语说明

- **WHEN** 用户查看 Swagger UI 的 API 简介
- **THEN** 描述 SHALL 包含内部术语映射说明：空间(project)、项目(module)、迭代(cycle)
