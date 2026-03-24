## Context

- **数据源**：三个历史迭代 Excel
  - `jira_data/26-0131迭代需求管理（业务+内生）.xlsx`（Sheet: 0131-需求列表，32行，17列）
  - `jira_data/26-0307迭代需求(业务+内生).xlsx`（Sheet: 0307-需求列表，45行，20列）
  - `jira_data/26-0328迭代需求(业务+内生).xlsx`（Sheet: 0328-需求列表，43行，23列）
- **目标**：Plane FICC 项目（PROJECT_ID: `18b7ccc8-4b96-4af0-8c6f-76550cba28a7`）
- **现有状态**：
  - Cycle `大象-常规-26-0328` 已存在（2026-02-28 → 2026-03-28）
  - Cycle `大象-常规-26-0425` 已存在且已导入39条需求
  - 10 个 Module 均已存在（0425 导入时创建）
  - 14 个 extra property 均已存在（0425 导入时创建）
  - Cycle `大象-常规-26-0131`、`大象-常规-26-0307` 不存在，需创建
- **执行环境**：REST API（X-Api-Key 认证）+ Django Shell（docker exec plane-api-1）

## Goals / Non-Goals

**Goals:**

- 创建 Cycle `大象-常规-26-0131`（2026-01-03 → 2026-01-31）
- 创建 Cycle `大象-常规-26-0307`（2026-02-07 → 2026-03-07）
- 全量导入三个 Excel 中的所有需求（含"纳入交付=否"的），共约 120 条 Requirement Issue
- 每条 Issue 标题格式：`{需求名} [{MMDD}]`（例：`TARF平台建设 [0307]`）
- 将 `当前迭代交付内容` 列映射为 Issue description
- 所有 Issue 关联对应 Cycle；0328 中有重点项目标签（非空非"无"）的 Issue 关联对应 Module

**Non-Goals:**

- 不修改任何前端/后端代码
- 不新增 extra property（14 个已在 0425 导入时创建完毕）
- 不新增 Module（10 个已存在，涵盖 0328 所有重点项目标签）
- 不对 0131/0307/0328 的 Issue 做去重处理（同一 FICCHEADS key 在不同 Cycle 对应不同交付工作项）

## Decisions

### D1：Issue 标题加 Cycle 标识后缀

**决策**：标题格式为 `{需求名} [0131]` / `{需求名} [0307]` / `{需求名} [0328]`。

**理由**：同一 FICCHEADS 业务需求（如 TARF平台建设）在多个 Cycle 均有交付项，Plane 列表视图中需区分。若不加后缀，同名 Issue 将造成混淆。

**备选方案**：在 extra property 中存储 cycle 标识 → 增加字段维护成本，且列表视图无法直接区分，放弃。

### D2：external_id 允许重复

**决策**：`external_id` 仍存储 FICCHEADS key，接受多条 Issue 持有相同 external_id。

**理由**：已验证 Plane `Issue.external_id` 字段无唯一约束（`unique: False`）。FICCHEADS key 代表大型业务需求，一个 key 对应多个 Cycle 的分段交付，重复存储是正确语义。

### D3：当前迭代交付内容 → description

**决策**：将各 Excel 的 `当前迭代交付内容` 列作为 Issue description 填充。

**理由**：这是历史存档场景中最有价值的字段——记录该 Cycle 具体交付了什么。其余字段（需求描述、优先级等）已通过 extra property 存储。

### D4：0131 特殊列映射

**决策**：0131 Excel 结构与 0307/0328 不同，单独处理：

- `name`：col3（概要，0307/0328 叫"需求名"）
- `it_pm`：col12（0307/0328 为 col14）
- `description`（当前交付）：col17（0307 为 col19，0328 为 col21）
- 无 `需求描述`、无 `优先级` 列 → 这两个 extra property 留空

### D5：复合 IT_PM 拆分取后者

**决策**：`钱高翔/朱泓飞`（0307 中 1 条）→ 取后者朱泓飞（UUID: b0c16d7f-e6db-46ed-b34e-ff2059b1c211）。

**理由**：用户指定。两人均在 Plane 成员库中，取后者为共同决策中的主要负责人。

### D6：0328 Module 关联

**决策**：0328 `重点项目标签` 列中非空且非"无"的值，精确匹配已有 Module 名称后关联。

**理由**：10 个 Module 均已存在，0328 Excel 中出现的6个标签值（`FICC策略平台整合项目`、`O45迁移项目` 等）与 Module 名称完全一致，可精确匹配，无需新建。

### D7：import_ready CSV 结构

每个 Cycle 生成独立 CSV，列：
`external_id, name, description_html, type_id, state_id, external_source, assignees, extra_properties, cycle_id, module_id`

- `cycle_id`：该 Cycle 所有行填对应 Cycle UUID
- `module_id`：0328 中有有效标签的行填 Module UUID，其余留空
- `assignees`：填 `[]`（Excel 无 assignee 列）
- `external_source`：`jira`

## Risks / Trade-offs

- **0131 大量空行**：32 行中有 4 行无需求编号，可正常导入（external_id 留空）。
- **0328 重复预估迭代列**：col19/col20 均名为"预估迭代"，取 col19 即可，col20 忽略。
- **与 0425 无去重**：0131/0307/0328 的 Issue 与已导入的 0425 Issue 是独立存在的，相同需求在 Plane 中会出现多份（各属不同 Cycle）。这是设计意图（历史存档），不是 bug。
- **回滚**：无代码改动，数据回滚需手动删除创建的 Cycle 和 Issue。

## Migration Plan

1. **Phase 0**：创建 Cycle `大象-常规-26-0131` 和 `大象-常规-26-0307`（REST API）
2. **Phase 1**：Python 脚本生成 `26-0131_import_ready.csv`（含列映射、IT_PM 匹配、标题后缀）
3. **Phase 2**：Python 脚本生成 `26-0307_import_ready.csv`
4. **Phase 3**：Python 脚本生成 `26-0328_import_ready.csv`（含 Module 匹配）
5. **Phase 4**：逐行 POST 创建 Issue（0131 → 0307 → 0328），收集 UUID
6. **Phase 5**：批量关联 Cycle（各 Cycle 分批）+ Module（0328 有标签行）

各 Phase 独立可重试；如 Phase 4 中途失败，可通过 Issue 数量确认已导入行数后从断点续传。
