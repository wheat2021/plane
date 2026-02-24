# Oz Agent API 与 SDK

> 原文: https://docs.warp.dev/reference/api-and-sdk/api-and-sdk

## Oz Agent API

Oz Agent API 允许你通过 HTTP 从任何系统（CI、cron、后端服务、内部工具）创建和检查 Cloud Agent 运行，无需 Warp 桌面应用。

**API 能力：**

- **运行代理**：提交 prompt 和可选配置（模型、环境、MCP 服务器、base prompt 等）
- **监控执行**：列出运行并追踪状态转换（`QUEUED → INPROGRESS → SUCCEEDED/FAILED`）
- **检查结果**：获取运行的完整详情，包括原始 prompt、来源/创建者元数据、会话链接和解析后的代理配置

---

## REST API

### Base URL

```
https://app.warp.dev/api/v1
```

### 核心概念

#### Agent Run（代理运行）

每次代理运行包含：

- 唯一的 `run_id`
- 可读的 `title`
- 代理执行的 `prompt`
- `state`（`QUEUED`、`INPROGRESS`、`SUCCEEDED`、`FAILED`）
- 时间戳（`created_at`、`updated_at`）
- 可选的会话信息（`session_id`、`session_link`）
- 可选的解析后配置（`agent_config`）

#### Agent Configuration（代理配置）

通过 `AmbientAgentConfig` 影响代理运行方式：

- `name` — 用于追踪和过滤
- `model_id` — LLM 选择
- `base_prompt` — 塑造行为
- `environment_id` — 选择 Cloud Environment
- `skill_spec` — 使用 Skill 作为 base prompt（格式：`owner/repo:skill-name`）
- `mcp_servers` — 启用特定 MCP 工具

### 关键端点

- **`POST /agent/run`** — 创建新的代理运行。提交 prompt 和可选配置及标题，返回 `run_id` 和初始状态。
- **`GET /agent/runs`** — 列出运行，支持分页和过滤（state、config_name、model_id、creator、source、creation time）。
- **`GET /agent/runs/{runId}`** — 获取单次运行的完整详情，包括会话链接和解析后的配置。

### Models 参考

API 共享一组可复用的模型：

- `RunAgentRequest` / `RunAgentResponse`
- `ListRunsResponse` / `RunItem`
- `PageInfo` / `RunStatusMessage`
- `RunCreatorInfo` / `RunState` / `RunSourceType`
- `AmbientAgentConfig` / `MCPServerConfig`
- `Error`

---

## Oz Agent SDK

Oz 提供官方 Python 和 TypeScript SDK，封装了 Oz Agent API。

### SDK 共同特性

- **类型化的请求/响应**：编辑器自动补全，减少 schema 错误
- **内置重试和超时**：支持按请求覆盖
- **一致的错误类型**：映射到 API 状态码
- **原始响应辅助**：获取 header/状态/自定义解析

### SDK vs 原生 REST

- **使用 SDK**：需要强类型、标准化错误处理和便捷的并发模式
- **使用原生 REST**：需要最小依赖或对 HTTP 客户端的完全控制

### Python SDK

推荐从 Python 服务和脚本调用 Oz Agent API：

- 同步 + 异步客户端
- 类型化的请求/响应模型
- 可配置的重试/超时和结构化错误

GitHub: [warpdotdev/warp-python-sdk](https://github.com/warpdotdev/warp-python-sdk)

### TypeScript SDK

推荐从 Node.js 服务和现代 TS/JS 运行时调用 Oz Agent API：

- 完全类型化的参数/响应
- 一流的错误处理、重试/超时
- 支持所有 fetch 可用的常见运行时

GitHub: [warpdotdev/warp-typescript-sdk](https://github.com/warpdotdev/warp-typescript-sdk)

---

## 使用示例

### 创建运行（REST）

```bash
curl -X POST https://app.warp.dev/api/v1/agent/run \
  -H "Authorization: Bearer $WARP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "分析代码库中的安全漏洞",
    "config": {
      "environment_id": "<ENV_ID>",
      "model_id": "claude-sonnet"
    }
  }'
```

### 列出运行（REST）

```bash
curl https://app.warp.dev/api/v1/agent/runs \
  -H "Authorization: Bearer $WARP_API_KEY"
```

### 查询特定运行（REST）

```bash
curl https://app.warp.dev/api/v1/agent/runs/<RUN_ID> \
  -H "Authorization: Bearer $WARP_API_KEY"
```
