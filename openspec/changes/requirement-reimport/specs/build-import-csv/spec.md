## ADDED Requirements

### Requirement: 统一转换 XLSX 为单一导入 CSV

脚本 `build_import_csv.py` SHALL 读取 5 个迭代 XLSX 文件，将所有有效需求行转换为统一格式并合并输出到 `jira_data/requirements_import_ready.csv`。

#### Scenario: 成功转换所有迭代

- **WHEN** 运行 `python build_import_csv.py`
- **THEN** 在 `jira_data/` 目录生成 `requirements_import_ready.csv`，包含来自所有 5 个迭代的有效需求行（预计 ~200 行）

#### Scenario: 跳过空行

- **WHEN** XLSX 中某行的需求名称为空
- **THEN** 该行被跳过，不写入 CSV，控制台打印跳过数量

### Requirement: CSV 使用 v1.3 格式（req_source 写入 extra_properties）

输出 CSV 的列结构 SHALL 为：`name, description_html, type_id, state_id, priority, assignees, extra_properties, cycle_name, module_name`

其中 `extra_properties` SHALL 为 JSON 字符串，包含：`req_source`（需求编号）、`department`、`domestic_overseas`、`category_l1/l2/l3`、`center`、`team`、`biz_pm`、`biz_priority`、`techLead`（UUID）、`admission`（bool）、`in_delivery`（bool）、`estimated_iteration`、`delivery_content`、`remarks`

**注意**：

- `it_pm`（IT产品经理）SHALL 写入 CSV 的 `assignees` 字段（JSON UUID 数组），**不**写入 `extra_properties`
- 使用 `cycle_name` 和 `module_name`（名称字符串）而非 UUID，由导入脚本在运行时按名称查找 ID

#### Scenario: req_source 字段正确写入

- **WHEN** XLSX 行的需求编号列有值（如 FICCHEADS-1180）
- **THEN** extra_properties JSON 中包含 `"req_source": "FICCHEADS-1180"`

#### Scenario: it_pm 工号转换为 assignee UUID

- **WHEN** XLSX 行的 IT产品经理列有工号（如 023824）且该工号在用户表中存在
- **THEN** CSV 的 `assignees` 字段为 `["<UUID>"]`，extra_properties 中**不包含** `it_pm` 键

#### Scenario: it_pm 工号未匹配

- **WHEN** IT产品经理工号在用户表中不存在
- **THEN** `assignees` 为空数组 `[]`，控制台打印 warning，不影响其他字段

### Requirement: 标准格式（0131/0307/0328/0523）列映射

标准格式 XLSX（4 个迭代）SHALL 按以下规则解析（0523 为同列结构）：

| CSV 字段            | XLSX 列                                                |
| ------------------- | ------------------------------------------------------ |
| req_source          | col2 需求编号                                          |
| name                | col3 需求名                                            |
| description_html    | col4 需求描述（转 HTML 段落）                          |
| domestic_overseas   | col5 境内/外类别                                       |
| category_l1         | col6 一级分类                                          |
| category_l2         | col7 二级分类                                          |
| category_l3         | col8 三级分类                                          |
| center              | col9 所属中心                                          |
| team                | col10 所属团队                                         |
| biz_pm              | col12 固收产品经理                                     |
| biz_priority        | col13 优先级                                           |
| assignees           | col14 IT产品经理（工号→UUID，写入 assignees 数组）     |
| techLead            | col15 IT技术负责人（工号→UUID，写入 extra_properties） |
| module_name         | col16 重点项目标签                                     |
| admission           | col17 需求是否准入（"是"→true）                        |
| in_delivery         | col18 是否纳入交付（"是"→true）                        |
| estimated_iteration | col19 预估迭代                                         |
| delivery_content    | col20 交付内容                                         |
| remarks             | col21 备注                                             |

#### Scenario: 标准格式行正确解析

- **WHEN** 0523 XLSX 的一行有完整数据
- **THEN** CSV 行包含正确的所有字段，extra_properties JSON 结构正确

### Requirement: 0425 特殊格式列映射

0425 XLSX SHALL 按以下规则解析（列偏移不同）：

| CSV 字段          | XLSX 列                                               |
| ----------------- | ----------------------------------------------------- |
| domestic_overseas | col1 境内/境外                                        |
| department        | col2 所属部门                                         |
| req_source        | col3 需求编号                                         |
| name              | col4 概要                                             |
| center            | col5 所属中心                                         |
| team              | col6 所属业务台                                       |
| assignees         | col8 IT产品经理（工号→UUID，写入 assignees 数组）     |
| techLead          | col9 IT技术负责人（工号→UUID，写入 extra_properties） |
| module_name       | 空（不绑定 module）                                   |
| biz_priority      | col13 优先级                                          |
| delivery_content  | col14 需求内容                                        |

#### Scenario: 0425 不绑定 module

- **WHEN** 处理 0425 迭代的任意一行
- **THEN** CSV 行的 `module_name` 字段为空字符串

### Requirement: 每行携带 cycle_name

每个来自不同迭代的行 SHALL 携带对应的 cycle_name：

| 迭代 | cycle_name        |
| ---- | ----------------- |
| 0131 | 大象-常规-26-0131 |
| 0307 | 大象-常规-26-0307 |
| 0328 | 大象-常规-26-0328 |
| 0425 | 大象-常规-26-0425 |
| 0523 | 大象-常规-26-0523 |

#### Scenario: cycle_name 正确附加

- **WHEN** 处理 0307 XLSX 的某行
- **THEN** 该行 CSV 的 `cycle_name` 为 `"大象-常规-26-0307"`
