## ADDED Requirements

### Requirement: 将 xlsx 需求批量导入为 Requirement issue

系统 SHALL 将 `26-0425迭代需求(业务+内生).xlsx` 中 40 条需求导入为 FICC 项目的 Requirement 类型 issue，保留 Jira 需求编号作为 `external_id`。

#### Scenario: 标准字段映射

- **WHEN** 读取 xlsx 的 `需求名` 和 `需求描述` 列
- **THEN** 分别映射到 `name`（最多255字符）和 `description_html`（每行包进 `<p>` 标签），`external_source="jira"`，`priority="none"`

#### Scenario: extra properties 填充

- **WHEN** xlsx 中某 extra property 列有非空值
- **THEN** 将该值写入 `extra_properties` JSON，仅包含非空字段；`it_pm` 列通过 display_name 精确匹配 Plane 成员 UUID；`in_delivery` 列"是"映射 `true`，"否"映射 `false`

#### Scenario: 无 assignee

- **WHEN** xlsx 中"需求提出人"列全空
- **THEN** 导入时 `assignees=[]`，不报错

### Requirement: 所有 40 条需求关联至 Cycle 大象-常规-26-0425

系统 SHALL 在所有 issue 创建后，将其全部关联至 Cycle `大象-常规-26-0425`。

#### Scenario: 批量关联 Cycle

- **WHEN** 执行 POST `/cycles/{cycle_id}/cycle-issues/`，携带 40 个 issue UUID 列表
- **THEN** 所有 issue 在 Cycle 视图中可见，HTTP 200

### Requirement: 有重点项目标签的需求关联对应 Module

系统 SHALL 对 xlsx 中 `重点项目标签` 列非"无"且非空的 5 条需求，将其关联至对应名称的 Plane Module。

#### Scenario: 名称精确匹配 Module

- **WHEN** 需求的 `重点项目标签` 值与 Module name 完全一致（如"O45迁移项目"）
- **THEN** 执行 POST `/modules/{module_id}/module-issues/`，将该 issue 关联至对应 Module

#### Scenario: 无标签需求不关联 Module

- **WHEN** 需求的 `重点项目标签` 为"无"或空
- **THEN** 不执行 module-issues 关联，issue 仅存在于 Cycle 中

### Requirement: 生成 import_ready CSV 供导入脚本使用

系统 SHALL 生成 `jira_data/26-0425_import_ready.csv`，包含所有字段的转换结果，供人工核查和批量导入脚本读取。

#### Scenario: CSV 包含必要列

- **WHEN** 生成 import_ready CSV
- **THEN** 包含列：`external_id, name, description_html, type_id, state_id, external_source, assignees, extra_properties, cycle_id, module_id`

#### Scenario: 预览前 3 行

- **WHEN** CSV 生成完毕
- **THEN** 在终端展示前 3 行数据供人工核查，确认后再执行导入
