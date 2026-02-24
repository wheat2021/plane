# 技能即代理（Skills as Agents）

> 原文: https://docs.warp.dev/agent-platform/cloud-agents/skills-as-agents

你可以基于 **Skill（技能）** 启动代理 — 一组可复用的指令，定义代理应做什么。Skill 提供基础 prompt 和行为，你为每次运行提供额外上下文。

Skill 同时适用于**本地代理**（在你的机器上运行）和**Cloud Agent**（在 Warp 基础设施上运行）。

## 适用场景

- **一致的行为**：相同的 Skill 每次产生相同的工作流，无论谁触发或在哪运行
- **可重复的自动化**：在定时任务中运行 Skill，用于代码清理、依赖更新或 Issue 分类等维护任务
- **可共享的工作流**：Skill 存储在仓库中，团队可以版本控制、审查和协作

---

## Skill 的发现方式

### 本地代理

使用 `oz agent run` 时，Skill 从当前仓库自动发现。Warp 按优先顺序扫描以下目录：

- `.claude/skills/`
- `.codex/skills/`
- `.warp/skills/`
- `.agents/skills/`
- `.agent/skills/`

也可以使用完全限定格式指定来自任何可访问仓库的 Skill：`owner/repo:skill-name`

### Cloud Agent

使用 `oz agent run-cloud` 时，Skill 从环境中配置的仓库发现。

**发现流程：**

1. 在仓库中**创建 Skill**
2. 将仓库**添加到环境**
3. Skill 出现在 Oz Web App 的 Agents 列表中

> 也可以使用 `GET /agent` 端点以编程方式列出可用 Skill。

---

## 运行基于 Skill 的代理

### Oz Web App

在 [oz.warp.dev](https://oz.warp.dev) 的 Web App 中：

- 在 **Agents** 页面浏览环境中所有可用的 Skill
- 查看 Warp 公共 oz-skills 仓库中的推荐代理
- 选择 Skill、环境和 prompt 启动新运行
- 创建按 cron 定时运行 Skill 的定时代理

### CLI

使用 `--skill` 标志：

```bash
# 本地运行
oz agent run --skill "owner/repo:skill-name" --prompt "额外上下文"

# 云端运行
oz agent run-cloud \
  --environment <ENV_ID> \
  --skill "owner/repo:skill-name" \
  --prompt "额外上下文"
```

### API & SDK

使用 `skill_spec` 参数创建运行：

```json
{
  "prompt": "本次运行的额外上下文",
  "config": {
    "environment_id": "<ENV_ID>",
    "skill_spec": "owner/repo:skill-name"
  }
}
```

---

## 定时运行 Skill

Skill 最强大的用法之一是按定时运行。适合的场景：

- **死代码清理**：每周扫描未使用的代码或过期 feature flag
- **依赖更新**：每日/每周检查安全更新
- **Issue 分类**：定期分类和优先排序 open issue
- **文档刷新**：定期更新使文档与代码保持同步

### 创建定时 Skill 代理

```bash
oz schedule create \
  --name "Weekly Code Cleanup" \
  --cron "0 10 * * 1" \
  --environment <ENV_ID> \
  --prompt "扫描死代码和未使用的 feature flag。提交清理 PR。"
```

也可以从 Oz Web App 使用 **New schedule** 操作创建定时任务。

---

## 推荐 Skill

Oz Web App 展示来自公共 [warpdotdev/oz-skills](https://github.com/warpdotdev/oz-skills) 仓库的推荐代理。这些是预构建的 Skill，展示常见用例，可作为你自己工作流的起点。

推荐 Skill 在 Agents 页面的 **Suggested** 筛选下显示。

---

## 相关资源

- [环境配置](./05-environments.md) — 为 Cloud Agent 配置仓库和运行时上下文
- [Oz CLI](./08-oz-cli.md) — 运行代理的命令行接口
- [API 与 SDK](./09-api-sdk.md) — Cloud Agent 的编程式访问
