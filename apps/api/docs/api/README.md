# 内部研发管理平台 API 文档

> **版本**：v1 | **认证方式**：API Token（`X-Api-Key` header）

## 目录

- [认证方式](#认证方式)
- [内部术语对照表](#内部术语对照表)
- [API 基础信息](#api-基础信息)
- [文档索引](#文档索引)

---

## 认证方式

### 创建 API Token

1. 登录平台后，点击右上角头像 → **Profile（个人资料）**
2. 进入 **API Tokens** 页面
3. 点击 **「创建 Token」**，填写名称（如 `ci-cd`），选择有效期
4. 复制生成的 token（只显示一次）

### 使用 Token

在所有 API 请求的 Header 中加入：

```
X-Api-Key: <your-token>
```

**curl 示例：**

```bash
curl -H "X-Api-Key: <your-token>" \
  http://localhost:8000/api/v1/workspaces/<slug>/projects/
```

---

## 内部术语对照表

> API 路径使用 Plane 原始术语，下表说明与内部称呼的对应关系。

| API 术语              | 路径示例                                                   | 内部称呼 | 说明                    |
| --------------------- | ---------------------------------------------------------- | -------- | ----------------------- |
| `workspace`           | `/api/v1/workspaces/<slug>/`                               | 工作区   | 整个系统，唯一实例      |
| `project`             | `/api/v1/workspaces/<slug>/projects/<id>/`                 | 空间     | 对应内部「空间」        |
| `module`              | `/api/v1/workspaces/<slug>/projects/<id>/modules/<id>/`    | 项目     | 对应内部「项目」        |
| `cycle`               | `/api/v1/workspaces/<slug>/projects/<id>/cycles/<id>/`     | 迭代     | 对应内部「迭代/Sprint」 |
| `work-item` / `issue` | `/api/v1/workspaces/<slug>/projects/<id>/work-items/<id>/` | 工作项   | 任务、Bug、里程碑等     |

---

## API 基础信息

| 项目         | 值                                                                        |
| ------------ | ------------------------------------------------------------------------- |
| Base URL     | `http://localhost:8000`（本地）；生产地址通过 `API_BASE_URL` 环境变量配置 |
| API 版本     | `v1`（路径前缀 `/api/v1/`）                                               |
| 响应格式     | JSON                                                                      |
| 分页方式     | cursor-based（响应包含 `next_cursor` / `prev_cursor`）                    |
| OpenAPI 文档 | `GET /api/v1/schema/` 下载 YAML                                           |
| Swagger UI   | `GET /api/v1/schema/swagger/`                                             |

---

## 文档索引

| 文档                                                         | 内容                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| [extra-properties.md](./extra-properties.md)                 | 扩展属性配置（工作区级 CRUD）、项目绑定、工作项读写     |
| [issue-types.md](./issue-types.md)                           | 工作项类型管理（含 Milestone / Report），创建时指定类型 |
| [scenarios/ci-cd-workflow.md](./scenarios/ci-cd-workflow.md) | CI/CD 典型场景完整 curl 步骤                            |
