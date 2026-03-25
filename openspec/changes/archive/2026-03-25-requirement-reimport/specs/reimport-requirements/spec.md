## ADDED Requirements

### Requirement: 支持 --env 参数切换环境

脚本 `reimport_all.py` SHALL 接受 `--env dev` 或 `--env prod` 参数，对应不同的 API base URL 和 token。

| 参数         | BASE_URL                    | API_TOKEN                                  |
| ------------ | --------------------------- | ------------------------------------------ |
| `--env dev`  | http://localhost:8000       | plane_api_7ad39eb392a542f59bcc59e8fcb92b9d |
| `--env prod` | http://\<prod-server\>:8000 | 从环境变量 `PROD_API_TOKEN` 读取           |

#### Scenario: dev 环境运行

- **WHEN** 运行 `python reimport_all.py --env dev`
- **THEN** 所有 API 请求指向 `http://localhost:8000`

### Requirement: 幂等创建 Cycles（按名称 lookup-or-create）

脚本 SHALL 在导入前确保 5 个 Cycle 存在，通过名称查找，不存在则创建。

| Cycle 名称        | start_date | end_date   |
| ----------------- | ---------- | ---------- |
| 大象-常规-26-0131 | 2026-01-19 | 2026-01-30 |
| 大象-常规-26-0307 | 2026-02-17 | 2026-03-06 |
| 大象-常规-26-0328 | 2026-03-09 | 2026-03-27 |
| 大象-常规-26-0425 | 2026-03-30 | 2026-04-24 |
| 大象-常规-26-0523 | 2026-04-27 | 2026-05-22 |

#### Scenario: Cycle 不存在时自动创建

- **WHEN** Cycle 名称 "大象-常规-26-0523" 在目标环境不存在
- **THEN** 通过 Django Shell 创建该 Cycle，打印 "✅ 创建 Cycle: 大象-常规-26-0523"

#### Scenario: Cycle 已存在时复用

- **WHEN** Cycle 名称已存在
- **THEN** 直接使用已有 Cycle ID，打印 "♻️ 复用 Cycle: <name>"

### Requirement: 从 Jira modules.csv 创建 Modules（含 Assignee）

脚本 SHALL 读取 `jira_data/Jira modules.csv`，为每个 module 按名称 lookup-or-create，并设置 Assignee（lead）。

- Module 名称：CSV 的 `Summary` 列
- external_id：CSV 的 `Issue key` 列（如 FICC-89145）
- lead（负责人）：CSV 的 `Assignee` 列为工号，查找对应 User UUID

#### Scenario: Module 不存在时创建含 Assignee

- **WHEN** "FICC策略平台整合项目" 在目标环境不存在，Assignee 工号 018045 对应 User 存在
- **THEN** 创建 Module，lead 字段设为该 User UUID

#### Scenario: Assignee 工号未找到时仍创建 Module

- **WHEN** Assignee 工号在用户表中不存在
- **THEN** 创建 Module 但 lead 留空，打印 warning

### Requirement: 从 CSV 批量导入 Requirement issues

脚本 SHALL 逐行读取 `jira_data/requirements_import_ready.csv`，为每行创建一个 Requirement issue，并关联 Cycle 和 Module。

#### Scenario: 成功导入单条 Requirement

- **WHEN** CSV 中某行数据完整，cycle_name 和 module_name 均能解析到对应 ID
- **THEN** 创建 Issue → 关联 Cycle（POST /cycle-issues/）→ 关联 Module（POST /module-issues/）

#### Scenario: module_name 为空时跳过 Module 关联

- **WHEN** CSV 行的 module_name 为空（0425 迭代）
- **THEN** 创建 Issue 并关联 Cycle，不执行 Module 关联请求

#### Scenario: API 失败时记录错误继续

- **WHEN** 某行 Issue 创建请求返回非 2xx
- **THEN** 记录该行错误信息，继续处理下一行，不中断整体导入

### Requirement: 导入完成后输出验证报告

脚本 SHALL 在所有行处理完毕后打印摘要。

#### Scenario: 输出报告

- **WHEN** 导入完成
- **THEN** 打印：总处理行数、成功数、失败数，以及各迭代成功数量分布

### Requirement: 支持 --clean 参数清空已有 Requirement issues

脚本 SHALL 支持 `--clean` 可选参数，在导入前清空目标环境所有 Requirement 类型 issues。

#### Scenario: --clean 执行清空

- **WHEN** 运行 `python reimport_all.py --env dev --clean`
- **THEN** 通过 Django Shell 删除所有 Requirement issues，打印删除数量，再执行导入
