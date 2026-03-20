## 1. zh-CN 翻译：project → 空间

- [x] 1.1 将顶层导航和侧边栏区域标题 `projects: "项目"` 改为 `"空间"`（L3, L297）
- [x] 1.2 将所有 `create_project`、`add_project`、`open_project` 等操作类 key 的「项目」改为「空间」
- [x] 1.3 将 `project_name`、`project_id`、`project_lead`、`project_description_placeholder` 等字段 key 的「项目」改为「空间」
- [x] 1.4 将 `project_created_successfully`、`project_added_to_favorites` 等反馈消息中的「项目」改为「空间」
- [x] 1.5 将 `projects_and_issues`、`total_projects`、`project_insights` 等统计/聚合 key 的「项目」改为「空间」
- [x] 1.6 将 `leave_project`、`publish_project`、`join_the_project_to_rearrange` 等操作 key 改为「空间」
- [x] 1.7 重写 L1324/L1455/L1466 中「项目可以是产品路线图、营销活动或新车发布」为内部开发语境描述
- [x] 1.8 重写 L1450 中「将每个项目视为目标导向工作的父级……」的长描述文本
- [x] 1.9 更新 `settings/projects/` 相关 key（L839 `projects: "项目"` 等）改为「空间」
- [x] 1.10 检查并修正所有含「项目」且语境为 Plane Project 的剩余 key（搜索确认无遗漏）

## 2. zh-CN 翻译：module → 项目

- [x] 2.1 将 `modules: "模块"` 改为 `"项目"`（L14, L367, L645, L646）
- [x] 2.2 将 `create_module`、`update_module`、`archive_module`、`restore_module`、`delete_module`、`add_module` 的「模块」改为「项目」
- [x] 2.3 将 `total_modules`、`no_module`、`module_delete` 等统计/错误 key 改为「项目」
- [x] 2.4 将 `toggle_title: "启用模块"`、`toggle_description` 中的「模块」改为「项目」
- [x] 2.5 重写 module empty state 描述文本（L2208–2215），替换「购物车模块、底盘模块」等举例为内部开发语境
- [x] 2.6 将归档相关描述（L2230–2231、L2239–2241）中的「模块」改为「项目」
- [x] 2.7 检查并修正所有含「模块」的剩余 key（搜索确认无遗漏）

## 3. zh-CN 翻译：cycle → 迭代

- [x] 3.1 将 `cycles: "周期"` 改为 `"迭代"`（L13, L366, L643, L644）
- [x] 3.2 将 `create_cycle`、`update_cycle`、`add_cycle` 等操作 key 的「周期」改为「迭代」
- [x] 3.3 将 `active_cycle`、`active_cycles`、`active_cycles_description` 中的「周期」改为「迭代」（活动迭代）
- [x] 3.4 将 `total_cycles`、`no_cycle`、`only_completed_cycles_can_be_archived` 等 key 改为「迭代」
- [x] 3.5 重写 cycle empty state 描述文本（L2141–2142），更新「冲刺、迭代或您用于每周或每两周跟踪工作的任何其他术语都是一个周期」→ 直接说明迭代概念
- [x] 3.6 更新 active cycle、upcoming cycle、completed cycle 的 label（L2062、L2073、L2076）改为「活动迭代」「即将到来的迭代」「已完成的迭代」
- [x] 3.7 更新 `cycles_description`（L374）、`active_cycles_description`（L273）等描述文本中的「周期」改为「迭代」
- [x] 3.8 检查并修正所有含「周期」的剩余 key（搜索确认无遗漏）

## 4. zh-CN 翻译：构建验证

- [x] 4.1 执行 `pnpm --filter=@plane/i18n run build`，确认无编译错误
- [x] 4.2 启动开发服务器，切换中文语言，逐一检查以下页面的术语显示： ✅ 2026-03-06
  - 侧边栏导航（空间列表、空间内导航项）
  - 创建/编辑 project、module、cycle 的表单和按钮
  - Project/Module/Cycle 各自的 empty state 页面
  - 操作后的 Toast 提示消息
  - 设置页面的功能开关

## 5. 新增工作项类型（Backend Migration）

- [x] 5.1 新建 `apps/api/plane/db/migrations/0127_add_milestone_report_issue_types.py`
- [x] 5.2 migration 逻辑：遍历所有 workspace，对每个 workspace 检查是否已存在同名类型，不存在则创建 Milestone 和 Report
- [x] 5.3 实现 reverse function：删除由本 migration 创建的 Milestone 和 Report 类型
- [x] 5.4 执行 `python manage.py migrate`，确认迁移成功 ✅ 2026-03-06
- [x] 5.5 登录系统，进入工作区设置 → 工作项类型，确认 Milestone 和 Report 出现在列表中，图标和颜色正确 ✅ 2026-03-06
