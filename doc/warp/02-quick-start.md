# 快速上手

> 原文: https://docs.warp.dev/agent-platform/cloud-agents/quick-start

**Oz Cloud Agents** 运行在远程环境中，可由事件、定时任务、集成或手动触发。本指南帮助你在约 10 分钟内运行第一个 Cloud Agent。

Cloud Agent 支持两种模式：
- **交互式**：实时引导代理
- **自主式**：作为后台任务运行

每次运行都会创建一个持久化会话，团队可通过 Warp 桌面应用、CLI、Web App 或 API 进行检查、共享和查询。

## 常见用例

- 启动并行 Cloud Agent 进行多线程复杂开发任务
- 自动化重复性开发任务（如 feature-flag 清理、文档更新、修复服务器崩溃）
- 在代理之上构建应用（如 Bug 分类和事件响应系统）

---

## 前置条件

- **Warp 桌面应用** — 从 [warp.dev](https://warp.dev) 下载
- **Warp 账号** — 在 [oz.warp.dev](https://oz.warp.dev) 注册

> 新用户会获得免费积分。运行 Cloud Agent 至少需要 20 积分。

---

## 运行你的第一个 Cloud Agent

### 第 1 步：打开 Warp

下载并登录 Warp 桌面应用。打开后会自动认证到 Warp 服务。

### 第 2 步：运行 `/cloud-agent` 命令

在 Warp 终端输入栏中输入：

```bash
/cloud-agent
```

这会启动一个新的 Cloud Agent。该命令会检查你是否已有环境，如果没有，会引导你创建一个。

### 第 3 步：创建环境

> 已有环境？`/cloud-agent` 命令会使用现有环境。要为不同项目创建额外环境，使用 `/create-environment`。

如果没有环境，设置流程会引导你配置以下内容：

- **名称**：环境标识（必填）
- **仓库**：输入 `owner/repo` 格式或从下拉列表选择。点击 `Auth with GitHub` 连接仓库。
- **Docker 镜像**：运行时环境（如 `python:3.11`、`node:20`）。不确定？点击 `Suggest image` 让 Warp 推荐。
- **启动命令**：准备工作区的命令，如 `pip install -r requirements.txt` 或 `npm ci`。
- **描述**：可选备注。

**原理**：Environment 由 Docker 容器 + Git 仓库 + 启动命令组成，为 Cloud Agent 提供一致的工作区。环境可与团队共享。

### 第 4 步：描述你想让代理做什么

输入 prompt（如："分析测试覆盖率并建议改进"）。代理在云端执行，拥有对环境的完全访问权限。

你可以实时与代理对话、观察进度、并在它自主工作时提供额外指导。

### 第 5 步：查看运行详情

查看代理运行详情（已执行的命令、修改的文件、使用的环境）的方式：

- 在 Warp 应用中打开对话面板
- 点击终端输出中的会话链接
- 前往 [oz.warp.dev](https://oz.warp.dev) 的 `Runs` 标签页
- 通过移动端 Oz Web App 访问

每次运行都会自动被追踪，生成可共享的链接和审计记录。团队成员可以实时观看代理进度。

### 第 6 步：保存为可复用的 Skill（可选）

将成功的运行转化为可复用的 Skill：

```bash
/create-skill
```

创建后可以重新运行、设置定时任务、从 Slack/Linear 触发，或与团队共享。

---

## 下一步

### 自动化定期任务

使用 [定时代理](./07-skills-as-agents.md) 设置 cron 定时任务：

```bash
oz schedule create \
  --name "weekly-dependency-check" \
  --cron "0 10 * * 1" \
  --environment <ENV_ID> \
  --prompt "check for dependency updates and open PR"
```

### 从集成触发代理

- **Slack 集成**：在任何 Slack 频道中 @Oz 获取代码审查、调试或事件响应帮助。结果直接回复到线程。
- **Linear 集成**：连接 Oz 到 Linear 自动化 Bug 分类和修复。在 Issue 上 @Oz 复现 Bug、定位根因、提交修复 PR。
- **GitHub Actions**：在 CI/CD 流水线中运行代理，自动化生成发布说明、安全审计或验证迁移。

> 集成功能需要 Build、Max 或 Business 计划的团队。

### 在 Oz 代理之上构建自动化和应用

使用 [Oz Agent API & SDK](./09-api-sdk.md) 从你自己的系统和工作流中编程式触发代理。

---

## 故障排除

- **环境创建失败**：使用 Docker Hub 官方镜像（如 `node`、`python`、`rust`）。避免使用 Alpine/musl 镜像，Warp 运行时需要 glibc。
- **代理无法访问仓库**：检查 GitHub 授权状态，确认仓库已在环境中正确配置。
- **积分不足**：团队需至少 20 积分。在设置中检查积分余额。
