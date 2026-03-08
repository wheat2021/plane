## Context

项目已集成 `drf-spectacular==0.28.0`，并在 `plane/settings/openapi.py` 中配置了完整的 `SPECTACULAR_SETTINGS`（包含 TAG 定义、认证白名单、枚举覆盖）。v1 API（`/api/v1/`）是文档目标层，已有 `@extend_schema` 装饰器体系（`plane/utils/openapi/`）。大量视图尚未添加注解，定制开发的 extra-properties 和 issue-types 端点位于主 API（`/api/`），不在 v1 schema 覆盖范围内。测试套件目前不存在。

内部管理模型：一个 workspace = 整个系统，project = 空间，module = 项目，cycle = 迭代。

## Goals / Non-Goals

**Goals:**

- 完善 v1 API 的 OpenAPI 规范（缺失注解补全，SERVERS/TITLE 定制为内部实例）
- 为 extra-properties 和 issue-types 提供独立 Markdown + YAML 片段文档，说明其与工作项 `extra_properties` 字段的读写关系
- 建立可在 CI 中运行的 pytest 场景测试套件，覆盖 CI/CD 典型工作流（8 个核心场景）

**Non-Goals:**

- 不将 extra-properties / issue-types 端点加入 v1 schema（它们是内部定制 API，不属于标准 Plane v1 接口）
- 不为所有 200+ 个 `/api/` 主 API 端点编写文档
- 不实现实时 API 文档托管（文档以文件形式维护在仓库中）
- 不做 API 版本升级或重命名

## Decisions

### 决策 1：文档分两层

**选择**：v1 OpenAPI 规范（auto-generated）+ 内部扩展 API Markdown 文档（手写）

**原因**：extra-properties 和 issue-types 是 fork 定制功能，不属于上游 Plane API 契约；将它们加入 v1 schema 需要额外的视图/序列化器工作且在 rebase 时维护成本高。Markdown 文档门槛低、灵活，够用于内部团队。

**备选**：为定制功能写 v1 views → 放弃，工作量不成比例，且 rebase 冲突风险高。

---

### 决策 2：测试套件用场景驱动而非端点覆盖

**选择**：8 个场景测试（对应真实 CI/CD 工作流），而非每个端点写 CRUD 测试。

**原因**：目标是"API 能支撑自动化工作流"，而非代码覆盖率。场景测试更接近真实使用，发现的问题更有价值。

---

### 决策 3：测试环境用 Option B（独立 fixture 空间）

**选择**：测试套件在 conftest.py 中 setup 时自动创建一个测试专用空间（project），测试结束后清理。使用 Admin token（从环境变量读取）。

**原因**：隔离测试数据，不污染真实开发空间；幂等性好，可在 CI 中重复运行。

**实现**：

```
conftest.py session-scope fixtures:
  - api_client: 封装 requests.Session + base_url + auth header
  - test_space: 创建 "API Test Space"，yield project_id，teardown 删除
  - test_module: 在 test_space 内创建测试项目(module)
  - test_cycle: 创建测试迭代(cycle)
  - active_cycle: 确保迭代有 start_date <= today <= end_date
```

---

### 决策 4：SERVERS 通过环境变量配置

**选择**：`SPECTACULAR_SETTINGS["SERVERS"]` 读取 `API_BASE_URL` 环境变量，fallback 到 `http://localhost:8000`。

**原因**：内部实例地址不适合硬编码进代码仓库；env var 方式在 Docker Compose 和 CI 中都易于注入。

---

### 决策 5：内部扩展文档的位置

**选择**：放在 `docs/api/` 目录（相对于 `apps/api/`）。

**文件结构**：

```
apps/api/docs/api/
├── README.md               ← 索引：内部 API 使用入口
├── getting-started.md      ← 认证方式 + 基础概念（内部术语）
├── extra-properties.md     ← 扩展属性 CRUD + extra_properties 字段说明
├── issue-types.md          ← 工作项类型管理
└── scenarios/
    ├── ci-cd-workflow.md   ← CI/CD 典型场景示例（curl）
    └── automation.md       ← 日常运维场景示例
```

## Risks / Trade-offs

| 风险                                                            | 缓解措施                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 测试依赖可访问的 Plane 实例，在纯 CI 离线环境中无法运行         | 将测试标记为 `@pytest.mark.integration`，区分 unit 和 integration 测试      |
| extra-properties API 无 schema 校验，文档描述的行为与实际不一致 | 文档中明确说明"服务端不校验字段 schema，请参考工作区设置页面确认有效 key"   |
| 上游 rebase 后 v1 视图签名变化，导致已有注解失效                | 注解集中在 `@extend_schema` 装饰器层，与业务逻辑无耦合，rebase 冲突容易定位 |
| SERVERS 动态化后 drf-spectacular 缓存可能导致旧地址残留         | `SCHEMA_CACHE_TIMEOUT: 0` 已禁用缓存                                        |
