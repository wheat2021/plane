## ADDED Requirements

### Requirement: zh-CN 内部术语映射

zh-CN 翻译文件 SHALL 将以下 Plane 概念映射为内部管理术语，使界面语言与团队管理模型保持一致：

| Plane 概念         | 当前译文 | 新译文 |
| ------------------ | -------- | ------ |
| project / projects | 项目     | 空间   |
| module / modules   | 模块     | 项目   |
| cycle / cycles     | 周期     | 迭代   |

#### Scenario: 侧边栏导航项显示内部术语

- **WHEN** 用户使用中文语言查看项目侧边栏导航
- **THEN** 侧边栏中「周期」条目 SHALL 显示「迭代」
- **THEN** 侧边栏中「模块」条目 SHALL 显示「项目」

#### Scenario: 空间列表区域标题显示「空间」

- **WHEN** 用户使用中文语言查看侧边栏的 project 分组区域标题
- **THEN** 该区域标题 SHALL 显示「空间」，而非「项目」

#### Scenario: 创建/编辑操作按钮使用内部术语

- **WHEN** 用户使用中文语言查看创建 project 的按钮
- **THEN** 按钮文字 SHALL 显示「创建空间」，而非「创建项目」
- **WHEN** 用户使用中文语言查看创建 module 的按钮
- **THEN** 按钮文字 SHALL 显示「创建项目」，而非「创建模块」
- **WHEN** 用户使用中文语言查看创建 cycle 的按钮
- **THEN** 按钮文字 SHALL 显示「创建迭代」，而非「创建周期」

#### Scenario: Toast 和操作反馈消息使用内部术语

- **WHEN** 用户成功创建 project
- **THEN** 成功提示 SHALL 显示「空间创建成功」
- **WHEN** 用户成功创建或删除 module
- **THEN** 操作反馈 SHALL 使用「项目」而非「模块」
- **WHEN** 用户成功创建或归档 cycle
- **THEN** 操作反馈 SHALL 使用「迭代」而非「周期」

#### Scenario: 设置页面功能开关标题使用内部术语

- **WHEN** 用户访问 project 的功能设置页面
- **THEN** 模块功能开关标题 SHALL 显示「启用项目」
- **THEN** 周期功能开关标题 SHALL 显示「启用迭代」

#### Scenario: 空状态（Empty State）描述使用内部语境

- **WHEN** 用户使用中文语言查看 project/module/cycle 的空状态页面
- **THEN** 描述文本 SHALL 不出现面向 SaaS 的举例（如「产品路线图、营销活动、新车发布」）
- **THEN** 描述文本 SHALL 使用内部开发团队适用的表述

#### Scenario: 英文 locale 不受影响

- **WHEN** 用户切换到英文语言
- **THEN** 所有界面文字 SHALL 保持 Plane 原生英文命名（project / module / cycle）
- **THEN** en 翻译文件 SHALL 无任何修改
