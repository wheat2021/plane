# Oz 平台

> 原文: https://docs.warp.dev/agent-platform/cloud-agents/platform

Cloud Agent 和集成构建在 Oz 平台之上，包括 CLI、API/SDK、编排、环境和执行、管理和可观测性。

## 核心流程

大多数生产环境遵循相同的流程：

1. **触发器触发**：定时、集成事件、CI 步骤、webhook、API 调用或手动运行
2. **编排层创建任务**：Warp 的编排层创建一个 Cloud Agent 任务并追踪其生命周期
3. **代理执行**：代理在宿主机上执行，可选地运行在 Environment 中，使用所需的配置和凭证
4. **持久化记录**：任务产生状态、元数据、会话记录和输出，供团队审查和管理

---

## 核心概念

- **触发器（Trigger）**：启动工作的事件（如 cron、Slack @提及、PR 打开、CI 失败、手动运行）
- **任务（Task）**：Warp 追踪的工作单元。包含输入、状态、元数据和执行记录（在哪里运行、做了什么、产出了什么）
- **上下文（Context）**：附加到任务的额外输入（如 Slack 消息、PR 元数据、CI 日志、仓库 diff）
- **输出（Outputs）**：任务产出的内容（如创建 PR、回复 Slack、生成报告或会话记录 + 摘要）

> 实践中：**触发器创建任务 → 任务在宿主机上执行（可选在 Environment 中）→ 任务产出输出**。

---

## Oz CLI

[Oz CLI](./08-oz-cli.md) 是以非交互模式运行 Warp 代理的无头接口，常用于 CI、脚本和服务器环境。

关键特性：**云端连接**。即使代理在本地机器或 CI 中启动，它也会向 Warp 服务器报告进度，实现团队可见性、会话共享和通过 API 的程序化追踪。

### 使用场景

- 在任何地方运行代理（本地、CI runner、远程开发机、服务器）
- 外部系统编排运行（如 GitHub Actions、自定义自动化、事件工具）
- 无需 Warp 桌面应用即可获得任务可观测性和审计

### 无 Environment 的示例

```bash
oz agent run --prompt "重构这个函数以提高可读性"
```

---

## Warp 编排器

编排层管理 Cloud Agent 任务的生命周期。

### 编排器的职责

- 运行在 Warp 服务器上（云控制面）
- 触发器触发时创建任务（集成、定时、API 调用或显式启动）
- 追踪生命周期状态（`created → running → completed/failed`）及相关元数据
- 通过 Oz CLI 和 REST API 暴露任务生命周期操作
- 为 TypeScript/Python SDK 提供编程接口

### 团队何时使用 API/SDK

- 从自定义内部系统触发代理（事件工具、机器人、内部自动化）
- 构建内部仪表盘或监控（成功率、运行时间、失败原因）
- 协调大量运行（扇出、分片、排队、重试、应用层限流）
- 创建将任务作为构建块的高级工作流

---

## 环境（Environments）

[Environment](./05-environments.md) 定义代理应在其中运行的执行上下文。

**典型的 Environment 包含：**

- Docker 镜像（工具链和运行时）
- 一个或多个仓库（或工作区定义）
- 启动命令和配置（设置步骤、依赖安装、引导）
- 可选的环境变量和其他运行时设置

> Environment 是团队使代理运行在不同触发器（Slack、CI、定时）和不同宿主机间保持一致的方式。

### 何时使用

- 代理需要一致的工具链（linter、构建工具、语言运行时）
- 需要在 CI 和云端执行间保持可重现性
- 需要团队标准化执行（相同的仓库规则、相同的设置步骤）
- 减少跨任务的"在我机器上能跑"的差异

---

## Oz Agent API 和 SDK

[Oz Agent API](./09-api-sdk.md) 是 Oz 平台的 HTTP 接口。

### API 能力

- **运行代理**：提交 prompt 和可选配置（模型、环境、MCP 服务器等）
- **监控执行**：列出任务并追踪状态转换（`QUEUED → INPROGRESS → SUCCEEDED/FAILED`）
- **检查结果和出处**：获取任务完整详情，包括原始 prompt、创建者元数据、会话链接和解析后的代理配置

### 官方 SDK

Oz 提供官方 [Python](https://github.com/warpdotdev/warp-python-sdk) 和 [TypeScript](https://github.com/warpdotdev/warp-typescript-sdk) SDK：

- 类型化的请求/响应（自动补全，减少 schema 错误）
- 内置重试和超时（支持按请求覆盖）
- 一致的错误类型映射到 API 状态码
- 原始响应辅助方法（获取 header/状态/自定义解析）

**SDK vs 原生 REST**：
- 使用 SDK：需要强类型、标准化错误处理和便捷的并发模式
- 使用原生 REST：需要最小依赖或对 HTTP 客户端的完全控制

---

## 执行宿主机

宿主机描述代理实际执行的位置。

### Warp 托管执行（默认）

- Warp 在 Warp 管理的基础设施上运行环境
- 适合希望简单设置、不需要在自有网络边界内执行的团队

### 自托管执行

- 你提供基础设施（在你的云或网络中的 runner）
- 适合有合规或安全要求、需要代码和执行保留在网络边界内的团队
- 企业级功能，需要 Enterprise 计划

---

## 管理与可观测性

Oz 平台提供多种方式管理和监控 Cloud Agent：

- **Oz Web App**（[oz.warp.dev](https://oz.warp.dev)）：管理运行、定时任务、环境和集成的可视化界面
- **会话共享**：授权的团队成员可连接到运行中的任务进行监控或引导
- **API/SDK**：用于构建自定义仪表盘、监控和工作流自动化
