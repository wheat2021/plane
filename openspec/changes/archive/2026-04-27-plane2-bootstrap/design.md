## Context

迁移工程的起点。三个目录的角色：

```
/opt/code/run/plane     ← fork（itemtype），日常使用 / 维护，只读对待 plane2 工作
/opt/refcode/plane      ← 上游纯净参考（preview），graphify 校验源，禁止开分支
/opt/code/run/plane2    ← 本变更新建（itemtype-v2），所有新 OpenSpec changes 落在这里
```

## Goals / Non-Goals

**Goals**

- 启动一个独立工作区，承载 docs/migration.md 中 Phase 1.x 起的全部后续 OpenSpec changes
- 把 fork 中真正与上游解耦的工程价值（Dockerfile 多阶段缓存、.claude/skills、文档）原样带过去
- 保证 plane / plane2 / refcode 三者代码、引用、运行时三维互不污染
- 保证回滚成本接近零

**Non-Goals**

- 不迁移任何业务代码（自定义 EP / IssueType / Editor 块等留给 Phase 1 起的后续 changes）
- 不迁移 fork 的 .env 真实凭据 / 数据库数据 / 上传文件（全新部署）
- 不修改本仓库（`/opt/code/run/plane`）任何源码
- 不为 plane2 配置端口错开（采用场景 P 约定，不并行运行）
- 不把 fork 的 33 个 specs 加入 plane2 的 OpenSpec 工作流（采用选项 Y，仅作 _legacy 参照）

## Decisions

### D1：plane2 来源采用「方案 B —— 直连 GitHub 克隆」

`git clone https://github.com/makeplane/plane /opt/code/run/plane2`

**理由**

- origin 直接指向 `makeplane/plane`，后续 `git fetch origin && git rebase preview` 链路最短最干净
- 不引入「refcode → plane2」的本地链式依赖（如果走方案 A，refcode 必须先 fetch 才能让 plane2 拿到新提交，多一步出错风险）
- 一次性几百 MB 下载在可接受范围

**替代方案**

- 方案 A（`git clone /opt/refcode/plane plane2`）：磁盘略省但耦合 refcode；需立即 `git remote set-url origin https://github.com/makeplane/plane`
- 方案 C（`git worktree add`）：共享 .git 违反「引用隔离」精神，否决

### D2：运行时隔离采用「场景 P —— 不并行 + 项目名前缀」

切换工作区前先 `docker compose -f compose.dev.yml down`，端口表完全复用。

**理由**

- 「日常使用」实际是低频「偶尔起来验证 / fix」的工作模式，不是「常驻运行」
- 场景 Q（端口全错开）成本是中等量级（compose / .env / setup.sh / 前端 dev server 默认端口都要改），且每次 rebase 上游 compose / Dockerfile 改动都要手工 reapply 端口偏移 —— 长期维护成本高
- compose.dev.yml 经检查**没有 `container_name:` 硬编码**，仅有 `image:`，意味着 Compose 项目名前缀（`-p plane` vs `-p plane2`）会自动隔离 networks / volumes / containers
- 如果未来确实需要并行运行（例如演示），升级到场景 Q 本身可以是一个独立的 OpenSpec change，不会被本变更的决策锁死

**约定**

- plane 默认 `docker compose -p plane -f compose.dev.yml up`
- plane2 默认 `docker compose -p plane2 -f compose.dev.yml up`
- 切换前必 down

**替代方案**

- 场景 Q（端口全错开）：见 proposal 中端口分配草案。若将来需要长期并行再迁移过去

### D3：OpenSpec 资产采用「选项 Y —— _legacy 只读参照」

`fork/openspec/specs/` 全部 33 个复制到 `plane2/openspec/_legacy/specs/`；`plane2/openspec/changes/` 与 `plane2/openspec/specs/` 保持空，由后续 Phase 1 起的 changes 重新写入。

**理由**

- 33 个旧 specs 是基于旧分支语境，直接进入 `openspec list` 会让人误以为「已经实现」（与本次「在新分支重新落地」的精神冲突）
- 但它们承载完整业务真相，要保留可查阅
- `_legacy/` 作为「显式约定的非工作流目录」最简单 —— `openspec list` 默认不会读它

**替代方案**

- 选项 X（全部复制进 specs/）：会污染新工作流，否决
- 选项 Z（不带过去）：每次需要查业务真相要 cd 切换，体验差

### D4：本变更的归档位置在当前 fork

`plane2-bootstrap` 这个 change 创建于 `/opt/code/run/plane/openspec/changes/`，归档后留在这里。Phase 1.1 起所有后续 changes 都创建在 `/opt/code/run/plane2/openspec/changes/`。

**理由**

- 此变更的输入是「fork 现状」，输出才是「plane2 启动」—— 提案的真相之源在 fork
- 归档在 fork 也是迁移启动的可追溯记录
- plane2 的 OpenSpec 工作流从一张白纸开始，与「在新基础上重建」精神契合

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| Compose 项目名遗忘加 `-p`，污染对方数据 | README.local.md 顶部置顶启停命令；考虑在 plane2 设置 `COMPOSE_PROJECT_NAME=plane2` 写入 .env |
| .claude/skills/ 中端口或路径硬编码遗漏 | T2 任务里包含一次 grep 全量替换 + 跑一次 skill 自检 |
| 一次性磁盘 / 流量增长 | 预期内成本，文档里明示 |
| 用户后续误把 plane2 的 commit push 到了 fork 的 itemtype 远端 | plane2 的 origin 直连上游 makeplane/plane（无 push 权限），物理阻断 |

## Migration Plan

无数据迁移。无服务停机。本变更对 plane / refcode 都是只读。
