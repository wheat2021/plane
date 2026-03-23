## Context

- **数据源**：`jira_data/26-0425迭代需求(业务+内生).xlsx`（Sheet: 0425-需求列表，40行）和 `jira_data/Jira 2026-03-23T17_01_28+0800.csv`（10个周期性报告）
- **目标**：Plane FICC 项目（PROJECT_ID: `18b7ccc8-4b96-4af0-8c6f-76550cba28a7`）
- **现有状态**：Requirement 类型已有 `techLead`（member）和 `refs`（reference）两个 extra property；Module `FICC策略平台整合项目` 已存在（external_id 为空）；Cycle `大象-常规-26-0425` 不存在
- **执行环境**：REST API（X-Api-Key 认证）+ Django Shell（docker exec plane-api-1）

## Goals / Non-Goals

**Goals:**

- 创建 Cycle `大象-常规-26-0425`，日期 2026-03-29 → 2026-04-25
- 将 10 个 Jira 周期性报告导入/更新为 Plane Module，保留 Jira external_id 溯源
- 为 Requirement 新增 14 个 extra properties（8 个 select、2 个 member/text、2 个 text、1 个 checkbox、1 个 select）
- 导入 40 条需求为 Requirement issue，关联 Cycle；5 条有重点项目标签的需求同时关联对应 Module

**Non-Goals:**

- 不修改任何前端/后端代码
- 不处理 xlsx 中全空的"需求提出人"列和无区分价值的"需求是否准入"列
- 不为 Cycle 或 Module 设置成员/负责人（除 Module external_id 外）

## Decisions

### D1：重点项目标签使用 Module 而非 extra property

**决策**：用 Plane Module 代替 `key_project` select 属性。

**理由**：Module 是一等公民，支持进度统计、分组视图、成员关联，而 extra property 的 select 只是标签字符串。10 个项目与 Jira 周期性报告一一对应，迁移后可通过 Module 视图追踪各项目需求完成情况。

### D2：IT产品经理使用 member 类型，固收产品经理使用 text 类型

**决策**：`it_pm` → member，`biz_pm` → text。

**理由**：验证后 IT 产品经理（夏清、刘佩金等6人）全部在 Plane 成员列表中（93名成员），可精确匹配；固收产品经理（褚悦珊、陈思宇等）无 Plane 账号，使用 text 存储姓名字符串。

### D3：业务优先级使用 text 而非 select

**决策**：`biz_priority` → text。

**理由**：xlsx 中优先级列数据不规范（混合"在研-优先级0"和"自营业务中心优先级1"等格式），强制 select 会丢失原始信息。使用 text 保留原始值，后续可人工整理。

### D4：Cycle 日期推断

**决策**：start_date = 2026-03-29，end_date = 2026-04-25。

**理由**：参照已有 Cycle `大象-常规-26-0328`（2026-02-28 → 2026-03-29），约 4 周一个迭代周期。0425 命名意为 4月25日结束，从 0328 结束日顺延即为 2026-03-29 开始。

### D5：已存在 Module 的处理

**决策**：对 `FICC策略平台整合项目`（已存在）执行 PATCH 补充 `external_id: "FICC-71606"`，不重复创建。

### D6：import_ready CSV 结构

生成 `jira_data/26-0425_import_ready.csv`，列：
`external_id, name, description_html, type_id, state_id, external_source, assignees, extra_properties, cycle_id, module_id`

- `cycle_id`：所有行填 0425 cycle UUID
- `module_id`：5 条有重点项目标签的行填对应 module UUID，其余为空
- `assignees`：xlsx 无 assignee 列（需求提出人全空），填 `[]`
- `state_id`：使用项目默认 state（Backlog 或 Todo）

## Risks / Trade-offs

- **xlsx 数据质量**：27/40 行有需求描述，13 行描述为空；25/40 行有分类信息，15 行分类为空。导入后这些字段为空，需人工补充。
- **重复导入保护**：通过 `external_id`（Jira 需求编号）去重，但 40 行中仅 28 行有需求编号，12 行无 Jira key，重复导入时无法自动检测。→ 操作前确认 Requirement issue 数量为 0。
- **Module 名称匹配**：xlsx 重点项目标签与 Jira CSV Summary 完全一致，精确匹配可靠。若未来项目名更改可能失配。

## Migration Plan

1. （Phase 0）创建 Cycle `大象-常规-26-0425`
2. （Phase 1）批量创建 9 个新 Module + PATCH 已有 1 个
3. （Phase 2）Django Shell 创建 14 个 ExtraPropertyConfig + 绑定到 Requirement type
4. （Phase 3）Python 脚本生成 `26-0425_import_ready.csv`
5. （Phase 4）Python 脚本逐行 POST issue，收集 issue UUID 列表
6. （Phase 5）批量关联 Cycle（40条）+ Module（5条）

回滚：无代码改动，数据回滚需手动删除创建的 Cycle、Modules、ExtraPropertyConfigs、Issues。
