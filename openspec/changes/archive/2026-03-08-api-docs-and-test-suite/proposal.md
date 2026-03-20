## Why

`drf-spectacular` 已集成且 `/api/v1/` 的 OpenAPI 框架已建立，但大量视图缺少 `@extend_schema` 注解，定制开发的 extra-properties 和 issue-types 端点完全不在 v1 规范内，也没有 API 测试套件——导致 CI/CD 集成者和自动化脚本编写者无法获取可信的接口文档，且权限定制的正确性没有回归覆盖。

## What Changes

- **完善 v1 OpenAPI 规范**：补全缺失的 `@extend_schema` 注解（intake、asset、user 等视图），将 `SPECTACULAR_SETTINGS` 定制为内部实例（标题、服务器 URL、内部术语说明）
- **新增定制扩展 API 文档**：为 extra-properties（工作区级扩展字段配置）和 issue-types（工作项类型管理）编写独立的 OpenAPI YAML 片段 + Markdown 说明，解释如何在工作项 CRUD 中读写 `extra_properties` 字段
- **新增场景驱动 pytest 测试套件**：覆盖 8 个核心自动化场景（认证、迭代查询、工作项 CRUD、extra_properties 读写、里程碑查询、权限边界），使用独立 fixture 空间隔离测试数据，测试后自动清理

## Capabilities

### New Capabilities

- `api-docs`: v1 OpenAPI 规范完善——补全注解、定制内部配置（SERVERS 指向内部实例、DESCRIPTION 说明内部术语映射：空间=project, 项目=module, 迭代=cycle）
- `api-extension-docs`: 定制扩展 API 文档——extra-properties 配置与绑定 API、issue-types 管理 API、工作项 `extra_properties` 字段读写说明
- `api-test-suite`: pytest 场景测试套件——基于 Option B 独立 fixture 空间，涵盖 CI/CD 典型工作流和权限边界验证

### Modified Capabilities

（无已有规范变更）

## Impact

- `apps/api/plane/api/views/` — 补充 @extend_schema 注解（intake.py, asset.py, user.py，以及现有视图的缺失操作）
- `apps/api/plane/settings/openapi.py` — 更新 SPECTACULAR_SETTINGS（TITLE, DESCRIPTION, SERVERS, TAGS 定制）
- `apps/api/tests/api/` — 新建测试目录，包含 conftest.py 和各场景测试模块
- `docs/api/` — 新建内部扩展 API 文档（extra-properties, issue-types, extra_properties 字段使用指南）
- 依赖：pytest、requests/httpx（测试套件），运行需要可访问的 Plane 实例和 Admin API token
