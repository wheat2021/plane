# Oz CLI

> 原文: https://docs.warp.dev/reference/cli/cli

Oz CLI 是从任何地方运行 Cloud Agent 的命令行工具，包括终端、脚本、自动化系统或服务。

## 功能

- 在本地运行代理进行开发和调试
- 在远程机器上运行代理
- 连接代理到 MCP 服务器（如 GitHub、Linear）
- 配置连接代理到 Slack、Linear 和其他触发面的集成

---

## 快速上手（5 分钟）

### 1. 安装 CLI

如果已安装 Warp 桌面应用，CLI 已内置并在 Warp 终端中可用。

否则参见下方的独立安装方式。

### 2. 认证

使用 `oz login` 命令进行交互式认证（macOS 示例）：

```bash
oz login
```

会在终端中打印一个 URL，在浏览器中打开即可登录。凭证将安全存储供后续使用。

### 3. 运行代理

从任何目录运行：

```bash
oz agent run --prompt "分析这个仓库的测试覆盖率"
```

**执行过程：**
- Warp 启动新的 Cloud Agent 会话
- 代理获得对当前工作目录的访问
- 代理自主执行命令并将输出流式传输到终端

### 4. 添加 GitHub 上下文（可选）

如果目录是 Git 仓库，可以使用 GitHub 作为 MCP 服务器：

```bash
oz agent run --prompt "审查最近的 PR" --mcp github
```

### 5. 下一步

- 使用 [Agent Profile](https://docs.warp.dev/agent-platform/capabilities/profiles-and-permissions) 自定义行为
- 使用 `--saved-prompt` 复用 prompt
- 使用 MCP 服务器连接外部系统
- 使用 API Key 在自动化环境中认证

---

## 安装方式

### 随 Warp 一起安装

Oz CLI 随 Warp 桌面应用自动分发。要使 CLI 全局可用，添加到 `PATH`：

- **macOS**：打开命令面板（`CMD+P`），搜索并选择 `Install Oz CLI Command`
- **Windows**：在 Warp 安装器中选择 `Add Warp to PATH`
- **Linux**：通过包管理器安装时 CLI 已在系统 PATH 上

### 独立安装

**macOS（推荐 Homebrew）：**

```bash
brew install warpdotdev/warp/oz-cli
```

**Linux（apt/yum/pacman）：**

```bash
# apt 示例
sudo apt install oz-stable
```

> 注意：包名（`oz-stable`）与 CLI 命令（`oz`）不同。安装后使用 `oz` 命令。

**Windows**：目前没有独立 CLI 包，需安装 Warp 应用。

---

## 运行 CLI

CLI 命令取决于操作系统和安装方式：

- **macOS/Linux 独立或内置**：`oz`（稳定版）/ `oz-preview`（预览版）
- **Windows 内置**：`oz` / `oz-preview`

---

## 认证方式

### 交互式登录（本地机器）

适合已安装 Warp 或可打开浏览器的机器：

```bash
oz login
```

如果已在 Warp 中登录，CLI 自动复用现有凭证。

### API Key 认证

适合 CI 流水线、无头服务器、VM、Codespace 或容器等自动化环境：

```bash
export WARP_API_KEY="your-api-key"
oz agent run --prompt "运行测试"
```

---

## 运行代理

### 本地运行：`oz agent run`

在你的当前目录运行代理：

```bash
oz agent run --prompt "重构这个模块"
```

**常用标志：**

- `--cwd <PATH>` — 从不同目录运行
- `--share` — 与队友共享会话
- `--profile <ID>` — 使用特定 Agent Profile
- `--model <MODEL_ID>` — 覆盖默认模型
- `--skill <SPEC>` — 使用 Skill 作为基础 prompt

**适用场景：**
- 本地开发，需要即时反馈
- 需要代理处理当前目录文件
- 实时检查和修改代理工作
- 调试或迭代 prompt

### 云端运行：`oz agent run-cloud`

将任务分发到远程环境：

```bash
oz agent run-cloud \
  --environment <ENV_ID> \
  --prompt "运行完整测试套件并修复失败"
```

**适用场景：**
- 代理在远程机器或标准化环境中运行
- 从 CI/CD 或自动化系统触发代理工作
- 代理独立于本地会话运行
- 委托不需要即时关注的工作

---

## 最佳实践

- 验证环境有正确的仓库和上下文
- 检查 Profile 允许所需的命令和 MCP 服务器
- 确保环境变量设置在环境中，而非本地 shell
- 将有效的 prompt 保存在 Warp Drive 中复用
