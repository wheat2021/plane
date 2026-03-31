# Spec: analytics-extra-property-axis

## Purpose

支持在自定义洞察（Custom Analytics）的 X 轴和分组下拉框中使用 extra properties 作为分析维度，包括前端展示映射与后端分组统计逻辑。

## Requirements

### Requirement: X 轴和分组下拉框支持 extra property 选项

自定义洞察的 X 轴和分组下拉框 SHALL 在静态选项之后追加当前上下文中可用的 `select` 和 `member` 类型 extra properties。这些动态选项 SHALL 按 extra property 的 `label` 字段显示名称。`multiselect` 类型 SHALL NOT 出现在分析维度选项中。

#### Scenario: 项目分析中展示该项目的 extra properties

- **WHEN** 用户在项目分析（侧边栏或全屏）中查看 X 轴或分组下拉框
- **THEN** 下拉框 SHALL 在静态选项后追加该项目所有 issue types 绑定的 `select` 和 `member` 类型 extra properties

#### Scenario: 工作区分析中展示所有项目的 extra properties

- **WHEN** 用户在工作区分析页面查看 X 轴或分组下拉框
- **THEN** 下拉框 SHALL 在静态选项后追加所有有权限项目中 `select` 和 `member` 类型 extra properties 的合并列表（相同 config_key 的属性不重复）

#### Scenario: 选择 extra property 作为 X 轴后图表正确渲染

- **WHEN** 用户选择一个 `select` 类型 extra property 作为 X 轴
- **THEN** 图表 SHALL 按该属性的选项值（option label）分组统计工作项数量；未设置该属性的工作项 SHALL 归入"无"分组

#### Scenario: 选择 extra property 作为分组后图表切换为堆积模式

- **WHEN** 用户同时设置了 X 轴和分组，且其中一个是 extra property
- **THEN** 图表 SHALL 渲染为堆积柱状图，图例使用 extra property 选项的 label

#### Scenario: extra property 选项 ID 在前端映射为可读 label

- **WHEN** 后端返回按 extra property 分组的图表数据，key 为 option_id（UUID）
- **THEN** 前端 SHALL 使用 `ExtraPropertyConfig.options` 将 option_id 映射为对应的 option label 后再渲染

#### Scenario: X 轴与分组互斥

- **WHEN** 用户已选择某个 extra property 作为 X 轴
- **THEN** 该 extra property SHALL NOT 出现在分组下拉框中（反之亦然）

### Requirement: 后端支持 extra_property 作为 x_axis/group_by 参数

后端 `build_chart.py` SHALL 接受 `extra_property:<config_key>` 格式的 x_axis 和 group_by 参数，并使用 `Issue.extra_properties` JSONField 的相应键进行分组统计。

#### Scenario: 后端解析 extra_property 格式参数

- **WHEN** 请求参数 `x_axis` 值为 `extra_property:some_key`
- **THEN** 后端 SHALL 使用 `extra_properties__some_key` 作为 Django ORM annotation 的字段路径

#### Scenario: extra property 值为 null 时归入 None 分组

- **WHEN** Issue 的 extra_properties 中不存在对应 config_key，或值为 null
- **THEN** 后端 SHALL 将该 Issue 归入 key 为 `None` 的分组（与现有 null 处理逻辑一致）
