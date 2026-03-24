## ADDED Requirements

### Requirement: 从 0131 Excel 导入全量需求为 Requirement Issue

系统 SHALL 将 `26-0131迭代需求管理（业务+内生）.xlsx` 中所有有效需求（有需求名的行，约 32 条）导入为 FICC 项目的 Requirement 类型 Issue。

列映射规则：

- `name`：col3（概要）+ ` [0131]` 后缀
- `description`：col17（当前迭代交付内容），为空则留空
- `external_id`：col2（需求编号，FICCHEADS-xxxxx），无则留空
- `external_source`：`jira`
- `it_pm` extra property：col12（IT产品经理），匹配 Plane 成员 display_name
- `biz_pm` extra property：col11（固收产品经理），text 类型存储姓名
- `category_l1` extra property：col5（一级分类）
- `category_l2` extra property：col6（二级分类）
- `category_l3` extra property：col7（三级分类）
- `domain` extra property：col4（境内/外类别）
- `team` extra property：col9（所属团队）
- `center` extra property：col8（所属中心）
- `is_included` extra property：col15（是否纳入交付）
- `priority`、`biz_priority`、`schedule_estimate` extra property：留空（0131 无对应列）

#### Scenario: 正常行导入成功

- **WHEN** 处理有需求名的行（如 `TARF平台建设`）
- **THEN** 创建 Issue，标题为 `TARF平台建设 [0131]`，external_id=`FICCHEADS-1167`，关联 0131 Cycle

#### Scenario: 无需求编号的行也正常导入

- **WHEN** 处理 col2（需求编号）为空的行
- **THEN** 创建 Issue，external_id 留空，其余字段正常填充

#### Scenario: IT_PM 匹配成功

- **WHEN** col12 有值且能匹配 Plane 成员 display_name
- **THEN** it_pm extra property 设置为对应成员 UUID

#### Scenario: IT_PM 为空时不填

- **WHEN** col12 为空
- **THEN** it_pm extra property 留空，不报错

### Requirement: 从 0307 Excel 导入全量需求为 Requirement Issue

系统 SHALL 将 `26-0307迭代需求(业务+内生).xlsx` 中所有有效需求（有需求名的行，约 45 条）导入为 FICC 项目的 Requirement 类型 Issue。

列映射规则：

- `name`：col3（需求名）+ ` [0307]` 后缀
- `description`：col19（当前迭代交付内容），为空则留空
- `external_id`：col2（需求编号）
- `external_source`：`jira`
- `biz_priority` extra property：col13（优先级），text 类型（值不规范，原样存储）
- `it_pm` extra property：col14（IT产品经理）；`钱高翔/朱泓飞` 取后者朱泓飞
- `biz_pm` extra property：col12（固收产品经理）
- `category_l1` extra property：col6（一级分类）
- `category_l2` extra property：col7（二级分类）
- `category_l3` extra property：col8（三级分类）
- `domain` extra property：col5（境内/外类别）
- `team` extra property：col10（所属团队）
- `center` extra property：col9（所属中心）
- `is_included` extra property：col17（是否纳入交付）

#### Scenario: 正常行导入成功

- **WHEN** 处理有需求名的行
- **THEN** 创建 Issue，标题含 ` [0307]` 后缀，关联 0307 Cycle

#### Scenario: 复合 IT_PM 取后者

- **WHEN** IT_PM 列值为 `钱高翔/朱泓飞`
- **THEN** it_pm extra property 设置为朱泓飞的 UUID（`b0c16d7f-e6db-46ed-b34e-ff2059b1c211`）

### Requirement: 从 0328 Excel 导入全量需求为 Requirement Issue

系统 SHALL 将 `26-0328迭代需求(业务+内生).xlsx` 中所有有效需求（有需求名的行，约 43 条）导入为 FICC 项目的 Requirement 类型 Issue。

列映射规则：

- `name`：col3（需求名）+ ` [0328]` 后缀
- `description`：col21（当前迭代交付内容），为空则留空
- `external_id`：col2（需求编号）
- `external_source`：`jira`
- `biz_priority` extra property：col13（优先级），text 类型
- `it_pm` extra property：col14（IT产品经理）
- `biz_pm` extra property：col12（固收产品经理）
- `category_l1` extra property：col6（一级分类）
- `category_l2` extra property：col7（二级分类）
- `category_l3` extra property：col8（三级分类）
- `domain` extra property：col5（境内/外类别）
- `team` extra property：col10（所属团队）
- `center` extra property：col9（所属中心）
- `is_included` extra property：col18（是否纳入交付）
- `module_id`：col16（重点项目标签）非空且非"无"时，精确匹配已有 Module 名称

#### Scenario: 有重点项目标签的需求关联 Module

- **WHEN** col16 有非空、非"无"的值（如 `FICC策略平台整合项目`）
- **THEN** Issue 同时关联 0328 Cycle 和对应 Module

#### Scenario: 重点项目标签为"无"或空时不关联 Module

- **WHEN** col16 为"无"或空
- **THEN** Issue 只关联 0328 Cycle，module_id 留空

### Requirement: 所有导入 Issue 关联对应 Cycle

系统 SHALL 将 0131/0307/0328 导入的每条 Issue 分别关联至其所属 Cycle。

#### Scenario: Cycle 关联完成

- **WHEN** 所有 Issue 创建完毕
- **THEN** 0131 Cycle 下有约 32 条 Issue，0307 Cycle 下有约 45 条，0328 Cycle 下有约 43 条

### Requirement: 导入结果可验证

导入完成后 SHALL 输出验证报告，包含：

- 各 Cycle 实际创建 Issue 数量
- IT_PM 未匹配的行列表（若有）
- Module 匹配情况（0328）

#### Scenario: 验证报告输出

- **WHEN** 所有 Phase 完成
- **THEN** 控制台输出各 Cycle Issue 数量、异常行（IT_PM 未匹配等）汇总
