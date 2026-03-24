## 1. 提交变更文档

- [ ] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）

## 2. 实现 build_import_csv.py

- [x] 2.1 创建 `jira_data/build_import_csv.py` 脚本框架（参数解析、常量定义、入口函数）
- [x] 2.2 实现工号→UUID 映射表（从 Dev Django Shell 查询所有用户 employee_id 与 UUID）
- [x] 2.3 实现标准格式解析函数 `parse_standard_xlsx(filepath, cycle_name)`（处理 0131/0307/0328/0523）
- [x] 2.4 实现 0425 特殊格式解析函数 `parse_0425_xlsx(filepath, cycle_name)`
- [x] 2.5 实现 `make_description_html(text)` 将多行文本转为 HTML 段落
- [x] 2.6 实现合并写入逻辑：5 个解析结果合并写入 `requirements_import_ready.csv`
- [x] 2.7 运行脚本，检查输出 CSV（行数、字段完整性、JSON 格式正确性）

## 3. 实现 import_users.py

- [x] 3.1 创建 `jira_data/import_users.py` 脚本
- [x] 3.2 实现读取 `prod_user_import.json` 并通过 Django Shell 批量创建 User（按 email 幂等）
- [x] 3.3 实现将用户加入 workspace（WorkspaceMember，按 role 字段）
- [x] 3.4 实现统计报告输出（已创建/跳过/失败）
- [x] 3.5 在 Dev 环境测试幂等性（运行两次，第二次全部跳过）

## 4. 实现 reimport_all.py

- [x] 4.1 创建 `jira_data/reimport_all.py` 脚本框架（`--env`、`--clean` 参数解析，环境配置表）
- [x] 4.2 实现 `--clean` 逻辑：通过 Django Shell 删除所有 Requirement type issues
- [x] 4.3 实现 Cycle lookup-or-create（5 个 Cycles，含 start/end 日期）
- [x] 4.4 实现 Module lookup-or-create（从 `Jira modules.csv` 读取，含 Assignee 工号→UUID 映射）
- [x] 4.5 实现从 `requirements_import_ready.csv` 逐行导入 Issue（POST API）
- [x] 4.6 实现 Cycle 关联（POST /cycle-issues/）
- [x] 4.7 实现 Module 关联（POST /module-issues/，跳过 module_name 为空的行）
- [x] 4.8 实现完成报告（总数、成功、失败、各迭代分布）

## 5. 提交实现代码

- [ ] 5.1 提交所有新增脚本：`#FICC-9999# feat: 新增需求数据重新导入脚本（build_import_csv/import_users/reimport_all）`

## 6. 用户验证（Dev 环境）

- [ ] 6.1 运行 `python build_import_csv.py`，确认 `requirements_import_ready.csv` 生成，检查行数（预期 ~200 行）
- [ ] 6.2 人工抽查 CSV：选取 0425 和 0523 各一行，验证 extra_properties JSON 结构正确、req_source 有值
- [ ] 6.3 运行 `python reimport_all.py --env dev`，确认 5 个 Cycles 和 10 个 Modules 已创建
- [ ] 6.4 检查 Dev Plane 界面：Requirement issues 总数 = CSV 行数，每条 issue 有正确的 cycle 关联
- [ ] 6.5 抽查 3 条 issue：req_source、it_pm、techLead、Module 关联均正确
- [ ] 6.6 用户确认 Dev 验证通过

## 7. 生产环境导入（用户确认后执行）

- [ ] 7.1 运行 `python import_users.py --env prod`，确认 93 个用户全部导入
- [ ] 7.2 运行 `python reimport_all.py --env prod`
- [ ] 7.3 验证生产环境数据与 Dev 一致（issue 总数、抽查 extra_properties）
