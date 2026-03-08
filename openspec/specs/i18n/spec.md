## ADDED Requirements

### Requirement: zh-CN 翻译文件补全

简体中文翻译文件 SHALL 覆盖所有在前端组件中通过 `t()` 调用的翻译 key，不得出现原始 key 字符串显示在界面上。

#### Scenario: 导航自定义弹窗全中文显示

- **WHEN** 用户打开导航自定义弹窗
- **THEN** 弹窗标题显示"自定义导航"，而非 `customize_navigation`
- **THEN** "个人"、"项目"区域标题均为中文
- **THEN** `accordion_navigation_control`、`horizontal_navigation_bar` 等选项文字均为中文

#### Scenario: 工作项类型属性标签中文显示

- **WHEN** 用户查看工作项侧边栏属性面板
- **THEN** "工作项类型" 属性标签显示"工作项类型"，而非 `work_item_type`

#### Scenario: 成员表格列头中文显示

- **WHEN** 用户访问工作区设置或项目设置的成员页面
- **THEN** 表格列头显示"全名"、"显示名称"、"邮箱"、"加入日期"、"角色"，而非 `project_members.full_name` 等原始 key

#### Scenario: 工作区导出页面全中文显示

- **WHEN** 用户访问工作区设置 → 导出页面
- **THEN** 页面标题显示"导出"、描述文字为中文
- **THEN** "导出项目"、"格式"等标签均为中文，而非原始 key

#### Scenario: 额外属性设置页面全中文显示

- **WHEN** 用户访问工作区设置 → 额外属性页面
- **THEN** 页面标题、描述、"添加属性"按钮均为中文，而非 `workspace_settings.settings.extra_properties.*` 系列 key
- **THEN** 属性创建/编辑表单中的字段标签、占位符均为中文

#### Scenario: 项目工作项类型设置页面全中文显示

- **WHEN** 用户访问项目设置 → 工作项类型页面
- **THEN** 页面标题、描述、操作按钮均为中文
- **THEN** 额外属性绑定相关的提示信息均为中文

### Requirement: 项目成员设置页面使用翻译函数

项目设置成员页面的 "Project Lead"、"Default Assignee"、"Guest access" 等文字 SHALL 通过 `t()` 调用，不得硬编码英文字符串。

#### Scenario: 项目设置成员页标题为中文

- **WHEN** 用户访问项目设置 → 成员页面
- **THEN** 页面显示"项目负责人"、"默认受理人"、"访客权限"等中文文字
- **THEN** 各项的描述文字均为中文，不出现英文 hardcoded 字符串

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
