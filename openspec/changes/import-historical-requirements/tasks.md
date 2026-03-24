## 1. 提交变更文档

- [ ] 1.1 提交 import-historical-requirements 变更文档（proposal/design/specs/tasks）到 git

## 2. 准备工作

- [ ] 2.1 确认 Plane API 可访问（GET /api/v1/workspaces/ficc/projects/ 返回 200）
- [ ] 2.2 查询并记录 FICC 项目 Requirement 工作项类型 ID
- [ ] 2.3 查询并记录 FICC 项目默认 State ID（Backlog/Todo）
- [ ] 2.4 查询并记录已有 Cycle UUID：`大象-常规-26-0328`、`大象-常规-26-0425`
- [ ] 2.5 查询并记录所有 Module UUID（10 个）及其名称映射
- [ ] 2.6 查询并记录 14 个 extra property 的 UUID 和 key 映射
- [ ] 2.7 查询并记录所有 IT_PM 成员 display_name → UUID 映射

## 3. 创建历史 Cycle

- [ ] 3.1 通过 REST API 创建 Cycle `大象-常规-26-0131`（start=2026-01-03，end=2026-01-31）
- [ ] 3.2 记录 0131 Cycle UUID
- [ ] 3.3 通过 REST API 创建 Cycle `大象-常规-26-0307`（start=2026-02-07，end=2026-03-07）
- [ ] 3.4 记录 0307 Cycle UUID

## 4. 生成 import_ready CSV

- [ ] 4.1 编写 Python 脚本处理 0131 Excel：列映射（含 IT_PM col12、当前交付 col17）、标题加 `[0131]` 后缀，输出 `jira_data/26-0131_import_ready.csv`
- [ ] 4.2 编写 Python 脚本处理 0307 Excel：列映射（含 IT_PM col14、优先级 col13、当前交付 col19）、`钱高翔/朱泓飞` 取朱泓飞、标题加 `[0307]` 后缀，输出 `jira_data/26-0307_import_ready.csv`
- [ ] 4.3 编写 Python 脚本处理 0328 Excel：列映射（含 IT_PM col14、重点项目标签 col16、当前交付 col21）、Module 精确匹配、标题加 `[0328]` 后缀，输出 `jira_data/26-0328_import_ready.csv`
- [ ] 4.4 人工抽查三个 CSV 各5行，确认标题格式、IT_PM UUID、列映射正确

## 5. 导入 0131 需求

- [ ] 5.1 逐行 POST 创建 Issue（约 32 条），收集 Issue UUID 列表，保存至 `/tmp/0131_imported_issues.json`
- [ ] 5.2 验证创建数量：查询 Plane API 确认 Issue 数量与 CSV 行数一致
- [ ] 5.3 批量关联 Issue 至 Cycle `大象-常规-26-0131`

## 6. 导入 0307 需求

- [ ] 6.1 逐行 POST 创建 Issue（约 45 条），收集 Issue UUID 列表，保存至 `/tmp/0307_imported_issues.json`
- [ ] 6.2 验证创建数量
- [ ] 6.3 批量关联 Issue 至 Cycle `大象-常规-26-0307`

## 7. 导入 0328 需求

- [ ] 7.1 逐行 POST 创建 Issue（约 43 条），收集 Issue UUID 列表，保存至 `/tmp/0328_imported_issues.json`
- [ ] 7.2 验证创建数量
- [ ] 7.3 批量关联 Issue 至 Cycle `大象-常规-26-0328`
- [ ] 7.4 提取有重点项目标签的 Issue，批量关联对应 Module

## 8. 提交实现代码

- [ ] 8.1 提交导入脚本和生成的 CSV 文件：`#FICC-9999# chore: 添加历史迭代需求导入脚本（0131/0307/0328）`
- [ ] 8.2 提交 tasks.md 更新（标记完成状态）：`#FICC-9999# chore: 完成历史迭代需求导入`

## 9. 用户验证

- [ ] 9.1 在 Plane UI 中打开 `大象-常规-26-0131` Cycle，确认约 32 条 Requirement Issue 存在且标题含 `[0131]`
- [ ] 9.2 在 Plane UI 中打开 `大象-常规-26-0307` Cycle，确认约 45 条 Issue，抽查复合 IT_PM 行（FICCHEADS-1082 等）的 it_pm 为朱泓飞
- [ ] 9.3 在 Plane UI 中打开 `大象-常规-26-0328` Cycle，确认约 43 条 Issue，有重点项目标签的 Issue 已关联 Module
- [ ] 9.4 在 Plane UI 中验证同一 FICCHEADS 需求（如 FICCHEADS-1167 TARF平台建设）在不同 Cycle 下各有独立 Issue，描述（当前交付内容）不同
- [ ] 9.5 确认 0425 已有数据未受影响（Issue 数量不变）
