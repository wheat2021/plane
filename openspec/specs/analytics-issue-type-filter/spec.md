# Spec: analytics-issue-type-filter

## Purpose

支持在自定义洞察（Custom Analytics）中按 Issue Type 过滤数据，替换原来无实质作用的 Y 轴选择器，提供更有意义的数据范围控制能力。

## Requirements

### Requirement: 自定义洞察支持 Issue Type 筛选

自定义洞察的参数选择区域 SHALL 提供 Issue Type 下拉选择器，替换原来无实质作用的 Y 轴选择器。选中某个 issue type 后，图表数据 SHALL 仅统计该类型的工作项；默认值为"全部类型"（即不过滤）。

#### Scenario: 项目分析中展示当前项目的 issue types

- **WHEN** 用户在项目分析侧边栏或全屏页面打开自定义洞察
- **THEN** Issue Type 下拉框 SHALL 列出该项目已配置的所有 issue types，加上"全部类型"选项

#### Scenario: 工作区分析中按名字合并 issue types

- **WHEN** 用户在工作区分析页面打开自定义洞察
- **THEN** Issue Type 下拉框 SHALL 展示有权限的所有项目中 issue types 的合并列表，同名 issue type 显示为同一选项（不重复）

#### Scenario: 选择 issue type 后图表数据更新

- **WHEN** 用户从 Issue Type 下拉框选择一个具体类型
- **THEN** 图表 SHALL 仅统计该 issue type 的工作项，X 轴/分组维度保持不变

#### Scenario: 选择"全部类型"恢复不过滤状态

- **WHEN** 用户从 Issue Type 下拉框选择"全部类型"（默认值）
- **THEN** 图表 SHALL 统计所有类型的工作项（不过滤 issue type）

#### Scenario: 后端按 issue type 过滤数据

- **WHEN** API 请求包含 `issue_type_id` 参数（项目上下文）或 `issue_type_name` 参数（工作区上下文）
- **THEN** 后端 SHALL 仅统计匹配该 issue type 的 Issue 记录
