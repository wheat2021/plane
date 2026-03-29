# plane-data Skill 创建计划

## 目标

将 plane-api + plane-migrate 合并重构为 plane-data，形成分层发现的数据操作知识库。

## 文件清单

| #   | 文件                     | 行数目标 | 内容来源                             | 依赖      |
| --- | ------------------------ | -------- | ------------------------------------ | --------- |
| 1   | `SKILL.md`               | ~200     | 新写 + plane-api 环境配置            | 无        |
| 2   | `refs/model.md`          | ~150     | 从代码库提取模型字段                 | 无        |
| 3   | `refs/pitfalls.md`       | ~100     | 合并三个 skill 的已知坑 + 本次新发现 | 无        |
| 4   | `refs/ops-schema.md`     | ~120     | 本次实战代码提炼                     | model.md  |
| 5   | `refs/ops-issue.md`      | ~150     | 本次实战 + plane-migrate 代码提炼    | model.md  |
| 6   | `refs/ops-user.md`       | ~80      | 本次实战代码提炼                     | model.md  |
| 7   | `refs/migrate-jira.md`   | ~300     | plane-migrate 精简搬入               | ops-\*.md |
| 8   | `refs/migrate-custom.md` | ~150     | 本次策略导入经验提炼                 | ops-\*.md |

## 执行顺序

### Step 1: 基础层（无依赖）

- [x] 创建目录结构
- [x] 1.1 `SKILL.md` — 入口、环境配置、场景路由、执行规则、数据文件规范 (163行)
- [x] 1.2 `refs/model.md` — 数据模型速查 (126行)
- [x] 1.3 `refs/pitfalls.md` — 已知坑合集 (46行)

### Step 2: 操作模板层（依赖 model.md）

- [x] 2.1 `refs/ops-schema.md` — Schema 操作（IssueType/EP/State/Label）(123行)
- [x] 2.2 `refs/ops-issue.md` — Issue 操作（CRUD/批量/关联）(170行)
- [x] 2.3 `refs/ops-user.md` — 用户操作 (100行)

### Step 3: 场景层（依赖 ops-\*.md）

- [x] 3.1 `refs/migrate-jira.md` — Jira 迁移流程 (139行)
- [x] 3.2 `refs/migrate-custom.md` — 自定义数据源迁移 (105行)

### Step 4: 收尾

- [x] 4.1 创建 symlink `.kiro/skills/plane-data -> .claude/skills/plane-data`
- [x] 4.2 验证文件结构（8 个文件，共 972 行）
- [x] 4.3 标记 plane-api / plane-migrate 为 deprecated
