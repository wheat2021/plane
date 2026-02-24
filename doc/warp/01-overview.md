# Cloud Agents 概览

> 原文: https://docs.warp.dev/agent-platform/cloud-agents/overview

Oz Cloud Agents 是运行在 [Oz 平台](./03-oz-platform.md) 上的云端后台代理。

## 适用场景

Cloud Agents 适合以下情况：

- **持续运行的工程基础设施**：定时维护任务、集成驱动的自动化流程
- **高并发**：在云端并行运行多个代理任务，对整个仓库级任务进行分片，或将同一任务分发到多个目标
- **团队可观测性**：查看运行了什么、何时运行、执行了什么操作
- **事件响应**：响应崩溃、Bug 报告、Slack 消息、定时任务或 CI 步骤

---

## 什么是 Cloud Agent 运行？

一次 Cloud Agent 运行表示为一个**任务（Task）**。触发器触发时（如 webhook 事件、定时任务）或用户手动启动时，会创建一个任务。

每个任务包含：

- **持久化记录**：状态、元数据和会话记录，任务完成后可随时回溯
- **生命周期状态**：`created → running → completed / failed`
- **执行上下文**（可选）：一个 [Environment](./05-environments.md) 定义了代码仓库、镜像和启动命令
- **输入**：一个 prompt，以及来自触发系统的附加上下文（如 Slack 消息、PR 元数据、CI 日志）

> **判断是否适合用 Cloud Agent**：能否定义 (1) 什么触发它；(2) 需要什么上下文；(3) 团队如何检查/验证输出。

---

## 工作原理

Cloud Agent 运行在 Oz 平台上，该平台提供以下基础能力：

1. **触发器**：某个事件发生（定时、集成事件、CI、webhook、API 调用、手动运行）
2. **编排层**：Warp 的编排器创建任务并追踪其生命周期
3. **执行**：代理在宿主机上执行，可选地运行在 [Environment](./05-environments.md) 中，使用所需的配置和凭证
4. **持久记录**：每次运行产生状态、元数据、会话记录和输出，供团队审查和管理

---

## 默认提供的能力

### 可观测性与可操控性

- **管理界面**：展示任务状态和历史
- **会话记录**：每次运行生成完整的执行记录
- **会话共享**：授权的团队成员可以连接到运行中的任务，监控进度，甚至在支持的情况下实时引导代理

### 集中化配置

Cloud Agent 工作流通常依赖共享配置：MCP 服务器、规则、保存的 prompt、环境变量和 [密钥](./06-secrets.md)。

Warp 支持集中配置，使同一工作流在不同触发方式（Slack、CI、定时任务等）下表现一致，无需在每个系统中重复设置。

### API 访问任务

通过 [Oz Agent API 和 SDK](./09-api-sdk.md)，团队可以：

- 构建内部仪表盘或监控（成功率、运行时间、失败原因）
- 获取任务元数据和结果
- 查询正在运行或已运行的任务

---

## 使用方式

Cloud Agent **不需要** Warp 桌面客户端。团队可以通过以下方式操作：

- **[Oz CLI](./08-oz-cli.md)**：从脚本、CI 或终端运行代理
- **[API 和 SDK](./09-api-sdk.md)**：编程式访问，用于自定义集成
- **Oz Web App**：可视化界面，管理运行、定时任务、环境和集成（支持移动端）
- **Agent Session Sharing**：连接到运行中的任务进行监控或引导
- **Agent Management UX**：查看代理活动和运行历史

如果团队同时使用 Warp 终端，还可以将 CLI 启动的任务交接到交互式会话中进行审查、编辑或继续。

---

## 计费和计划要求

Cloud Agent 和集成运行在 Oz 平台控制面上，使用 **Credits（积分）** 计费。

> **注意**：不支持 BYOK（自带 API Key）。BYOK 密钥存储在本地设备上，云端代理无法访问。所有 Cloud Agent 运行消耗 Warp 积分。

### CLI/API 方式的 Cloud Agent

- 个人用户无需加入团队即可运行 Cloud Agent
- 自托管代理需要团队订阅
- Cloud Agent 运行在 Warp 托管的基础设施上
- 需要至少 **20 积分**（普通积分、Cloud Agent 积分或 Build 计划积分均可）

### 集成（Slack/Linear）

- 需要加入 [Warp 团队](https://app.warp.dev)
- 团队需至少 20 积分
- 支持的计划：**Build、Max、Business**
- 不支持：Pro、Turbo、Lightspeed、旧版 Business

> **警告**：积分余额归零后，Cloud Agent 运行将无法执行，直到积分补充。

---

## 延伸阅读

- [快速上手](./02-quick-start.md) — 10 分钟跑通第一个 Cloud Agent
- [Oz 平台](./03-oz-platform.md) — CLI、API/SDK、编排、任务、环境、宿主机、集成等
- [部署模式](./04-deployment-patterns.md) — 常见部署架构对比
- [环境配置](./05-environments.md) — 为代理任务提供运行时上下文
- [密钥管理](./06-secrets.md) — 安全存储、限定范围并注入凭证
- [技能即代理](./07-skills-as-agents.md) — 基于可复用技能定义运行代理
- [Oz CLI](./08-oz-cli.md) — 从 CI、脚本或远程机器运行代理
- [API 与 SDK](./09-api-sdk.md) — 编程式创建、查询和监控代理任务
