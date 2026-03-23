## ADDED Requirements

### Requirement: Requirement 类型新增 14 个业务 extra properties

系统 SHALL 为 FICC 项目的 Requirement 工作项类型绑定以下 14 个 extra properties，均为非必填。

| key                   | label        | 类型     | 备注                         |
| --------------------- | ------------ | -------- | ---------------------------- |
| `department`          | 所属部门     | select   | 6个选项                      |
| `domestic_overseas`   | 境内/外类别  | select   | 境内、境外                   |
| `category_l1`         | 一级分类     | select   | 12个选项（品种分类）         |
| `category_l2`         | 二级分类     | select   | 17个选项（品种子类型）       |
| `category_l3`         | 三级分类     | select   | 12个选项（模块）             |
| `center`              | 所属中心     | select   | 8个选项                      |
| `team`                | 所属团队     | select   | 15个选项                     |
| `biz_pm`              | 固收产品经理 | text     | 非 Plane 成员，存中文姓名    |
| `biz_priority`        | 业务优先级   | text     | 原始值不规范，保留原始字符串 |
| `it_pm`               | IT产品经理   | member   | IT PM 均在 Plane 成员列表中  |
| `in_delivery`         | 是否纳入交付 | checkbox | 是→true，否→false            |
| `estimated_iteration` | 预估迭代     | select   | 6个选项                      |
| `delivery_content`    | 交付内容     | text     | 本迭代交付内容描述           |
| `remarks`             | 备注         | text     | 补充说明                     |

#### Scenario: 创建 select 类型 extra property

- **WHEN** 通过 Django Shell 创建 `ExtraPropertyConfig`，`type="select"`，`config={"options": [...]}`
- **THEN** 配置对象持久化，`IssueTypeExtraProperty` 绑定到 Requirement type 和 FICC 项目

#### Scenario: 创建 member 类型 extra property（it_pm）

- **WHEN** 创建 `ExtraPropertyConfig`，`key="it_pm"`，`type="member"`，`config={"member_color": "#10b981"}`
- **THEN** IT产品经理字段支持从 Plane 成员中选择，与现有 `techLead` 字段并列

#### Scenario: 创建 checkbox 类型 extra property（in_delivery）

- **WHEN** 创建 `ExtraPropertyConfig`，`key="in_delivery"`，`type="checkbox"`
- **THEN** 字段在 issue 详情页显示为开关，导入时"是"映射为 true，"否"映射为 false

#### Scenario: 不与已有 extra properties 冲突

- **WHEN** 创建完成后查询 Requirement 的所有 extra properties
- **THEN** 共 16 个属性（原有 2 个 + 新增 14 个），无重复 key
