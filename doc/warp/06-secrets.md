# 密钥管理（Secrets）

> 原文: https://docs.warp.dev/agent-platform/cloud-agents/secrets

Cloud Agent 常需要与外部系统交互（API、数据库、云提供商、内部工具）。Warp 提供 **Agent Secrets**，一种安全存储、限定范围并将凭证注入 Cloud Agent 运行的方式，不会将密钥值暴露给用户或日志。

## 适用场景

- Cloud Agent 需要调用不支持 OAuth 的 API 或 CLI
- 使用需要静态 token 或密钥的 MCP 服务器
- 代理需要云 CLI、数据库、监控系统或内部服务的凭证
- 需要对代理可访问的凭证进行集中审计和控制

## 常见用例

- 使用只读服务账号对 BigQuery 或 Metabase 运行 SQL 查询
- 调用云/基础设施 CLI 执行预定义的补救步骤（重启服务、扩缩部署、清除阻塞任务）
- 列出和审查 Cloud Agent 可访问的所有 API 密钥、服务账号和 token

---

## 工作原理

Warp 提供一组 CLI 命令用于创建、更新和列出密钥。密钥值安全存储，创建后**无法检索**。

在运行时，**Warp 将相关密钥设置为每次 Cloud Agent 运行的环境变量**，基于谁触发了代理以及如何触发。

> 密钥值仅在执行期间对代理进程（及其派生的子进程）可用，之后**无法查看或检索**。

### 密钥的关键属性

- **限定范围**：团队或个人用户
- 创建后**值不可读**（仅元数据可见）
- Cloud Agent 运行时**自动设置**到范围内的密钥

---

## 密钥范围

### 团队密钥

在整个团队间共享，对所有代表团队运行的 Cloud Agent 可用。

- 始终注入到 Cloud Agent 运行中，无论触发方式（CLI、Slack、Linear、定时运行）
- 对有或没有特定用户上下文的代理均可用
- 适合共享基础设施凭证、服务账号和只读 API 密钥

> **最佳实践**：因为团队密钥广泛可用，应使用**机器人或服务账号**创建，而非绑定到个人的凭证。
>
> 例如：使用 Metabase 服务账号而非个人 API Key；使用最小权限的云服务账号。

### 个人密钥

属于**个人用户**。

- 仅对该用户触发的 Cloud Agent 可用
- 队友或无用户触发器不可访问
- 适合绑定到个人账号的 API 密钥或凭证

---

## 使用 Oz CLI 管理密钥

### 创建团队密钥（交互式）

```bash
oz secret create --team --name "METABASE_API_KEY"
```

会在终端中安全提示输入值。

### 从文件创建个人密钥

```bash
oz secret create --personal --name "METABASE_API_KEY" --value-file api_key.txt
```

适合 JSON 文件或私钥等长值。

### 添加描述

```bash
oz secret create --team \
  --name "MY_SECRET" \
  --description "每 2 周轮换；由平台团队拥有"
```

### 更新密钥

替换值但保持名称和范围：

```bash
oz secret update --team \
  --name "METABASE_API_KEY" \
  --value-file new_api_key.txt
```

这是推荐的凭证轮换方式。

### 列出密钥

```bash
oz secret list
```

输出示例：

```
NAME                         SCOPE      LAST UPDATED
METABASE_API_KEY             team       1 week ago
GCP_SERVICE_ACCOUNT_JSON     team       yesterday
MY_MCP_SERVER_TOKEN          personal   10:00am
```

> 密钥值**永不显示**。

---

## 密钥如何注入到 Cloud Agent

代理启动时，Warp 确定哪些密钥在范围内，并将它们设置为执行环境中的环境变量。例如：

```bash
METABASE_API_KEY=********
```

---

## 不同触发类型的密钥可用性

### 用户触发（Oz CLI、Slack @提及、Linear 更新）

代理接收：
- 所有**团队级密钥**
- 触发用户的**个人密钥**

**不会**接收其他团队成员的个人密钥。

### 无用户上下文触发（定时代理、全自动集成）

代理接收：
- **仅团队级密钥**

> 个人密钥在这些情况下不会被注入。

---

## 审计与安全

- 密钥值创建后不可读取或导出
- 所有密钥明确限定范围到团队或用户
- 工程和安全负责人可列出所有可用密钥
- 通过原地更新密钥实现轮换
- Cloud Agent 仅接收触发范围内的密钥

**团队职责：**

- 为每个密钥选择适当的范围
- 在外部系统上限制权限（如只读 API 密钥）
- 按内部策略轮换凭证
- 管理环境中存在的代理和触发器
