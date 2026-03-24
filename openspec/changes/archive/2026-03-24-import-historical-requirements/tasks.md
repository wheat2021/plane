## 1. 提交变更文档

- [x] 1.1 提交 import-historical-requirements 变更文档（proposal/design/specs/tasks）到 git

## 2. 准备工作

- [x] 2.1 确认 Plane API 可访问（GET /api/v1/workspaces/ficc/projects/ 返回 200）
- [x] 2.2 查询并记录 FICC 项目 Requirement 工作项类型 ID
- [x] 2.3 查询并记录 FICC 项目默认 State ID（Backlog/Todo）
- [x] 2.4 查询并记录已有 Cycle UUID：`大象-常规-26-0328`、`大象-常规-26-0425`
- [x] 2.5 查询并记录所有 Module UUID（10 个）及其名称映射
- [x] 2.6 查询并记录 14 个 extra property 的 UUID 和 key 映射
- [x] 2.7 查询并记录所有 IT_PM 成员 display_name → UUID 映射

## 3. 创建历史 Cycle

- [x] 3.1 通过 REST API 创建 Cycle `大象-常规-26-0131`（start=2026-01-03，end=2026-01-31）
- [x] 3.2 记录 0131 Cycle UUID
- [x] 3.3 通过 REST API 创建 Cycle `大象-常规-26-0307`（start=2026-02-07，end=2026-03-07）
- [x] 3.4 记录 0307 Cycle UUID

## 4. 生成 import_ready CSV

- [x] 4.1 编写 Python 脚本处理 0131 Excel：列映射（含 IT_PM col12、当前交付 col17）、标题加 `[0131]` 后缀，输出 `jira_data/26-0131_import_ready.csv`
- [x] 4.2 编写 Python 脚本处理 0307 Excel：列映射（含 IT_PM col14、优先级 col13、当前交付 col19）、`钱高翔/朱泓飞` 取朱泓飞、标题加 `[0307]` 后缀，输出 `jira_data/26-0307_import_ready.csv`
- [x] 4.3 编写 Python 脚本处理 0328 Excel：列映射（含 IT_PM col14、重点项目标签 col16、当前交付 col21）、Module 精确匹配、标题加 `[0328]` 后缀，输出 `jira_data/26-0328_import_ready.csv`
- [x] 4.4 人工抽查三个 CSV 各5行，确认标题格式、IT_PM UUID、列映射正确

## 5. 导入 0131 需求

- [x] 5.1 逐行 POST 创建 Issue（约 32 条），收集 Issue UUID 列表，保存至 `/tmp/0131_imported_issues.json`
- [x] 5.2 验证创建数量：查询 Plane API 确认 Issue 数量与 CSV 行数一致
- [x] 5.3 批量关联 Issue 至 Cycle `大象-常规-26-0131`

## 6. 导入 0307 需求

- [x] 6.1 逐行 POST 创建 Issue（约 45 条），收集 Issue UUID 列表，保存至 `/tmp/0307_imported_issues.json`
- [x] 6.2 验证创建数量
- [x] 6.3 批量关联 Issue 至 Cycle `大象-常规-26-0307`

## 7. 导入 0328 需求

- [x] 7.1 逐行 POST 创建 Issue（约 43 条），收集 Issue UUID 列表，保存至 `/tmp/0328_imported_issues.json`
- [x] 7.2 验证创建数量（0328 Cycle 新增 43 条，含原有 35 条预存 Issue 共 78 条）
- [x] 7.3 批量关联 Issue 至 Cycle `大象-常规-26-0328`
- [x] 7.4 提取有重点项目标签的 Issue，批量关联对应 Module（6条）

## 8. 提交实现代码

- [x] 8.1 提交导入脚本和生成的 CSV 文件：`#FICC-9999# chore: 添加历史迭代需求导入脚本（0131/0307/0328）`
- [x] 8.2 提交 tasks.md 更新（标记完成状态）：`#FICC-9999# chore: 完成历史迭代需求导入`

## 9. 用户验证

- [x] 9.1 在 Plane UI 中打开 `大象-常规-26-0131` Cycle，确认约 32 条 Requirement Issue 存在且标题含 `[0131]`
- [x] 9.2 在 Plane UI 中打开 `大象-常规-26-0307` Cycle，确认约 45 条 Issue，抽查复合 IT_PM 行（FICCHEADS-1082 等）的 it_pm 为朱泓飞
- [x] 9.3 在 Plane UI 中打开 `大象-常规-26-0328` Cycle，确认约 43 条 Issue，有重点项目标签的 Issue 已关联 Module
- [x] 9.4 在 Plane UI 中验证同一 FICCHEADS 需求（如 FICCHEADS-1167 TARF平台建设）在不同 Cycle 下各有独立 Issue，描述（当前交付内容）不同
- [x] 9.5 确认 0425 已有数据未受影响（Issue 数量不变）
