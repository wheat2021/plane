# API 测试套件规范

## Purpose

定义针对 Plane 内部实例的集成测试套件结构和场景要求，通过真实 HTTP 请求验证 API 行为，覆盖认证、核心资源 CRUD、权限边界等关键场景。

## Requirements

### Requirement: pytest 测试套件基础设施

测试套件 SHALL 在 `apps/api/tests/api/` 目录下组织，使用 pytest + requests 库（不依赖 Django test client），通过真实 HTTP 请求验证 API 行为。

conftest.py SHALL 提供 session-scope fixtures：

- `api_client`：封装 `requests.Session`，预设 `X-Api-Key` header 和 `BASE_URL`，从环境变量 `PLANE_TEST_API_TOKEN` 和 `PLANE_TEST_BASE_URL` 读取
- `test_space`：创建名为 "API Test Space [timestamp]" 的测试空间，yield `project_id`，teardown 时删除该空间
- `test_module`：在 `test_space` 内创建测试项目（module），yield `module_id`
- `test_cycle`：创建包含今天日期的活动迭代（cycle），yield `cycle_id`

测试 SHALL 标记为 `@pytest.mark.integration`，可通过 `-m integration` 选择性运行。

#### Scenario: 测试套件在未配置 token 时跳过而非报错

- **WHEN** 环境变量 `PLANE_TEST_API_TOKEN` 未设置
- **THEN** 测试 SHALL 以 `pytest.skip` 跳过，不产生 ERROR

#### Scenario: 测试结束后清理 fixture 数据

- **WHEN** 测试套件运行完毕（无论成功或失败）
- **THEN** 在 Plane 实例中创建的 "API Test Space" SHALL 被删除
- **THEN** 不留下残留的测试数据

---

### Requirement: 场景 S1 — 认证验证

`test_auth.py` SHALL 验证 API token 认证的基本行为。

#### Scenario: 有效 token 可获取当前用户信息

- **WHEN** 使用有效 API token 调用 `GET /api/users/me/`
- **THEN** 响应状态码 SHALL 为 200
- **THEN** 响应体 SHALL 包含 `id` 和 `email` 字段

#### Scenario: 无效 token 返回 401

- **WHEN** 使用无效 token（`X-Api-Key: invalid`）调用任意需认证端点
- **THEN** 响应状态码 SHALL 为 401

---

### Requirement: 场景 S2 — 查询活动迭代

`test_cycles.py` SHALL 验证迭代查询 API。

#### Scenario: 可获取空间内的活动迭代

- **WHEN** 调用 `GET /api/v1/workspaces/{slug}/projects/{project_id}/cycles/`
- **THEN** 响应状态码 SHALL 为 200
- **THEN** 响应体 SHALL 是包含迭代对象的数组

#### Scenario: 活动迭代包含必要字段

- **WHEN** 获取当前活动迭代（`status=current`）
- **THEN** 每个迭代对象 SHALL 包含 `id`、`name`、`start_date`、`end_date` 字段

---

### Requirement: 场景 S3-S4 — 工作项创建与状态更新

`test_work_items.py` SHALL 验证 CI/CD 典型的工作项生命周期操作。

#### Scenario: 可在指定迭代和项目(module)下创建工作项

- **WHEN** 调用 `POST /api/v1/workspaces/{slug}/projects/{project_id}/work-items/`，请求体包含 `name`、`cycle_id`、`module_id`
- **THEN** 响应状态码 SHALL 为 201
- **THEN** 响应体 SHALL 包含新建工作项的 `id`

#### Scenario: 可更新工作项状态

- **WHEN** 调用 `PATCH /api/v1/workspaces/{slug}/projects/{project_id}/work-items/{work_item_id}/`，请求体包含 `state_id`
- **THEN** 响应状态码 SHALL 为 200
- **THEN** 响应体中 `state_id` SHALL 等于请求中指定的值

---

### Requirement: 场景 S5 — extra_properties 读写

`test_work_items.py` SHALL 验证自定义扩展字段的完整读写周期。

#### Scenario: 创建工作项时可写入 extra_properties

- **WHEN** 调用 `POST .../work-items/`，请求体包含 `extra_properties: {"source": "ci-cd"}`
- **THEN** 响应状态码 SHALL 为 201
- **THEN** 响应体 `extra_properties` SHALL 包含 `source: "ci-cd"`

#### Scenario: GET 响应包含已写入的 extra_properties

- **WHEN** 调用 `GET .../work-items/{id}/` 获取含 extra_properties 的工作项
- **THEN** 响应体 `extra_properties` SHALL 等于创建时写入的值

---

### Requirement: 场景 S6 — 项目(module)里程碑查询

`test_modules.py` SHALL 验证按工作项类型过滤的查询能力。

#### Scenario: 可查询项目(module)内的工作项列表

- **WHEN** 调用 `GET /api/v1/workspaces/{slug}/projects/{project_id}/modules/{module_id}/issues/`
- **THEN** 响应状态码 SHALL 为 200
- **THEN** 响应体 SHALL 是工作项数组

---

### Requirement: 场景 S8 — 权限边界验证

`test_permissions.py` SHALL 验证权限定制后 API 的访问控制正确性。

#### Scenario: Member 角色 token 无法创建空间

- **WHEN** 使用 Member 角色的 API token 调用 `POST /api/workspaces/{slug}/projects/`
- **THEN** 响应状态码 SHALL 为 403

#### Scenario: 未认证请求返回 401

- **WHEN** 不携带 `X-Api-Key` header 调用任意需认证端点
- **THEN** 响应状态码 SHALL 为 401
