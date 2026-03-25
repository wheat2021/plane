## 1. 改造 reimport_all.py

- [x] 1.1 移除 `requests` 依赖和 `api_post` 函数，移除 `import_issues` 中的 REST API 调用和限流重试逻辑
- [x] 1.2 新增 `import_issues_django` 函数：将 CSV 数据序列化为 JSON，通过单次 Django Shell 调用完成 Issue `bulk_create`（含 closed 终态逻辑）
- [x] 1.3 在 Django Shell 脚本中实现：查询 `group='cancelled'` state，对 0131/0307/0328/0425 的行覆盖 state_id
- [x] 1.4 在 Django Shell 脚本中实现：`CycleIssue.objects.bulk_create()` 和 `ModuleIssue.objects.bulk_create()`，收集并打印各 Cycle/Module 关联数量
- [x] 1.5 更新脚本顶部注释，移除 `requests` import

## 2. 更新 plane-migrate 技能文档

- [x] 2.1 在 `plane-migrate/SKILL.md` 的"已知 API 限制"章节后新增"Phase 5 替代方案：Django Shell 全量导入"章节
- [x] 2.2 补充适用场景对比表（REST API vs Django Shell）和核心代码模式

## 3. 验证

- [x] 3.1 运行 `python3 reimport_all.py --env dev --clean`，确认无限流错误，189 条全部成功
- [x] 3.2 验证 0131~0425 的 issue state 为 Cancelled（158 条），0523 的 issue state 为 Backlog（31 条）
- [x] 3.3 验证无 Cycle 关联缺失（无 Cycle 关联的 issue = 0）
- [x] 3.4 提交：`#FICC-9999# refactor: reimport_all 改用 Django Shell bulk_create，0131-0425 使用 Cancelled 终态`
