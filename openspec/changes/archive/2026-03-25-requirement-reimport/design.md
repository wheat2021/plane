## Context

本次变更不涉及 Plane 源码修改，所有操作通过 Plane REST API 完成。数据来源为 `jira_data/` 目录下的 5 个 XLSX 文件（5 个迭代周期），目标是将这些数据规范导入 Dev 和 Prod 两个环境。

**当前状态：**

- Dev 和 Prod 环境均为空（无 Cycles、无 Modules、无 Requirement issues）
- Dev 有 93 个用户；Prod 尚无用户数据
- 现有 import_ready CSV 均为旧格式（external_id 列），需废弃
- `jira_data/prod_user_import.json` 已导出（93 用户，含 password hash）

**XLSX 格式差异：**

| 迭代 | 格式     | Module 字段        | req_id 字段   |
| ---- | -------- | ------------------ | ------------- |
| 0131 | 标准 v1  | col16 重点项目标签 | col2 需求编号 |
| 0307 | 标准 v1  | col16 重点项目标签 | col2 需求编号 |
| 0328 | 标准 v1  | col16 重点项目标签 | col2 需求编号 |
| 0523 | 标准 v2  | col16 重点项目标签 | col2 需求编号 |
| 0425 | 特殊格式 | 不绑定 module      | col3 需求编号 |

## Goals / Non-Goals

**Goals:**

- 生成一份可审查的 `requirements_import_ready.csv`（单一黄金数据源）
- 支持 Dev/Prod 环境通用导入（`--env` 参数切换）
- 脚本幂等：重复运行不产生重复 Cycle/Module（按名称 lookup-or-create）
- Module 导入时保留 Assignee（从 `Jira modules.csv` 读取工号 → 查找 User UUID）

**Non-Goals:**

- 不修改 Plane 源码
- 不处理 Story/Report 类型数据（仅处理 Requirement）
- 不实现增量同步（全量清空重导）

## Decisions

**决策 1：两阶段导入（转换 + 导入分离）**

- 原因：中间 CSV 文件提供人工审查节点，发现问题可在导入前修正，不需要重跑 XLSX 解析
- 方案 A（选择）：`build_import_csv.py` → `requirements_import_ready.csv` → `reimport_all.py`
- 方案 B（放弃）：边解析 XLSX 边导入，无中间节点

**决策 2：Cycle/Module 按名称 lookup-or-create（不硬编码 UUID）**

- 原因：Dev 和 Prod 的同名对象 UUID 不同，硬编码会导致一个环境的脚本无法在另一环境运行
- 实现：先 GET /cycles/?name=xxx，存在则用现有 ID，不存在则 POST 创建

**决策 3：Module Assignee 通过 employee_id 匹配**

- `Jira modules.csv` Assignee 列存储工号（如 023824）
- 查 User 表 `employee_id` 字段匹配，获取 UUID 后写入 Module 的 `lead` 字段
- 未匹配时跳过（不报错，打印 warning）

**决策 4：0425 不绑定 Module**

- 0425 的"产品模块"（交易/估值及风险计量/...）与其他迭代的项目级 Module 语义不同，不做映射
- 0425 的 module_id 留空

**决策 5：extra_properties 字段映射（v1.3 格式）**

- req_source：需求编号列（不写入 external_id 字段）
- admission：需求是否准入 → "是" = true，否则 false
- in_delivery：是否纳入交付 → "是" = true，否则 false
- **it_pm（IT产品经理）→ issue 的 `assignees` 字段**（UUID 数组），不写入 extra_properties
- techLead：IT技术负责人 → extra_properties.techLead（UUID）
- 其余字段按 extra property key 直接映射

## Risks / Trade-offs

- **[风险] 0425 列结构与标准格式不同** → 在 `build_import_csv.py` 中为 0425 单独实现解析函数，与标准格式解析函数隔离
- **[风险] it_pm / techLead 工号未匹配** → 未匹配时 extra_properties 跳过该字段（不写入），打印 warning，不中断导入
- **[风险] Prod 用户导入顺序** → `import_users.py` 必须在 `reimport_all.py` 之前运行，否则 it_pm/techLead 字段无法解析
- **[风险] API Token 不同** → Dev 使用 `plane_api_7ad39eb392a542f59bcc59e8fcb92b9d`，Prod 需要单独配置

## Migration Plan

**Dev 环境（验证）：**

1. `python build_import_csv.py` → 生成 `requirements_import_ready.csv`
2. 人工检查 CSV 数据质量
3. `python reimport_all.py --env dev`
4. 验证：检查 issue 总数、req_source、cycle/module 关联

**Prod 环境（确认 Dev 验证通过后）：**

1. `python import_users.py --env prod`（导入 93 用户）
2. `python reimport_all.py --env prod`
3. 验证同上
