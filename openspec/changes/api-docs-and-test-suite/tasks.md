## 1. OpenAPI 规范基础配置

- [x] 1.1 修改 `plane/settings/openapi.py`：将 TITLE 改为内部版本，DESCRIPTION 加入术语映射说明（空间/项目/迭代）
- [x] 1.2 修改 `SPECTACULAR_SETTINGS["SERVERS"]`：读取 `os.environ.get("API_BASE_URL", "http://localhost:8000")` 动态设置服务器地址
- [x] 1.3 验证 `/api/schema/` 可成功生成 OpenAPI YAML（实际路径为 `/api/schema/`，非 `/api/v1/schema/`；访问返回 200 确认）

## 2. v1 API 缺失注解补全

- [x] 2.1 为 `plane/api/views/intake.py` 的所有 get/post/patch/delete 方法添加 `@intake_docs()` 注解（summary + responses）
- [x] 2.2 为 `plane/api/views/asset.py` 的端点添加 `@asset_docs()` 注解（重点：presigned URL 上传流程）
- [x] 2.3 为 `plane/api/views/user.py` 的端点添加 `@user_docs()` 注解（重点：GET me、GET session）
- [x] 2.4 审计 `cycle.py`（13个）、`module.py`（8个）、`issue.py`（8个）的现有注解，补全任何缺少 summary 或 responses 的方法
- [x] 2.5 确认 `issue.py` / `work_item.py` 的序列化器注解中 `extra_properties` 字段有描述文本（`OpenApiTypes.OBJECT`）
- [x] 2.6 确认 `project.py` 创建端点的注解中 responses 包含 `403`（Admin only）说明

## 3. 内部扩展 API 文档

- [x] 3.1 创建 `apps/api/docs/api/README.md`：认证说明（如何创建 token，X-Api-Key header 用法）+ 内部术语对照表 + 文档索引
- [x] 3.2 创建 `apps/api/docs/api/extra-properties.md`：工作区级 CRUD 示例（curl）、项目绑定示例、工作项 extra_properties 读写示例、无校验行为说明
- [x] 3.3 创建 `apps/api/docs/api/issue-types.md`：列出工作项类型（含 Milestone/Report）的 curl 示例、创建工作项时指定 type_id 的示例
- [x] 3.4 创建 `apps/api/docs/api/scenarios/ci-cd-workflow.md`：完整 CI/CD 场景（PR 触发 → 创建工作项 → 更新状态 → 写入 extra_properties）的 curl 步骤

## 4. pytest 测试套件基础设施

- [x] 4.1 创建 `apps/api/tests/api/` 目录，添加 `__init__.py`
- [x] 4.2 创建 `apps/api/tests/api/conftest.py`：实现 `api_client`、`workspace_slug`、`test_space`、`test_module`、`test_cycle` fixtures；从 `PLANE_TEST_API_TOKEN` 和 `PLANE_TEST_BASE_URL` 读取配置；token 未设置时 `pytest.skip`
- [x] 4.3 在 `apps/api/pytest.ini`（或 `pyproject.toml`）中注册 `integration` marker

## 5. 场景测试实现

- [x] 5.1 创建 `test_auth.py`：S1 场景（有效 token → 200，无效 token → 401）
- [x] 5.2 创建 `test_cycles.py`：S2 场景（列出迭代 → 200，验证 id/name/start_date/end_date 字段存在）
- [x] 5.3 创建 `test_work_items.py`：S3 场景（创建工作项 → 201，验证 id 在响应中）
- [x] 5.4 在 `test_work_items.py` 中添加 S4 场景（更新状态 → 200，验证 state_id 回写）
- [x] 5.5 在 `test_work_items.py` 中添加 S5 场景（写入 extra_properties → 201，GET 回读验证值相等）
- [x] 5.6 创建 `test_modules.py`：S6 场景（查询 module issues → 200，验证为数组）
- [x] 5.7 创建 `test_permissions.py`：S8 场景（Member token 创建空间 → 403，无 token → 401）

## 6. 验证

- [x] 6.1 运行 `pytest apps/api/tests/api/ -m integration -v`，确认所有场景测试通过（需要 PLANE_TEST_API_TOKEN 和 PLANE_TEST_BASE_URL 已配置）
- [x] 6.2 访问 `/api/v1/schema/swagger/`，验证所有端点有 summary，无 "No description" 占位符
- [x] 6.3 确认 `/api/v1/schema/` 下载的 YAML 中 `servers[0].url` 反映 API_BASE_URL 环境变量值
- [x] 6.4 检查 `docs/api/` 目录，确认 README、extra-properties、issue-types、ci-cd-workflow 文件均已创建且内容完整

## 7. 提交变更

- [x] 7.1 将所有实现文件组织为多个聚焦提交：
  - OpenAPI 配置变更（`apps/api/plane/settings/openapi.py`、`apps/api/pytest.ini`）
  - API 文档文件（`apps/api/docs/`）
  - 测试套件（`apps/api/tests/`）
