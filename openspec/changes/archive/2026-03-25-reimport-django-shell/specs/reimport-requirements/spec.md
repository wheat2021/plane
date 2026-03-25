## MODIFIED Requirements

### Requirement: 从 CSV 批量导入 Requirement issues

**原始要求**：逐行 REST POST 创建 Issue，sleep 0.8s 防限流，指数退避重试 429。

**更新后**：通过 Django Shell `bulk_create` 批量创建，无需限流控制，无需重试逻辑。

#### Scenario: 成功导入所有 Requirement

- **WHEN** CSV 包含 189 行有效数据
- **THEN** 通过单次 Django Shell 调用批量创建所有 Issue，关联 Cycle 和 Module，无限流风险

#### Scenario: module_name 为空时跳过 Module 关联

- **WHEN** CSV 行的 module_name 为空（0425 迭代）
- **THEN** 创建 Issue 并关联 Cycle，不创建 ModuleIssue 记录

#### Scenario: API 失败时记录错误继续（已移除）

- **Reason**：改用 Django Shell 后不再有 HTTP 错误，ORM 异常通过 try/except 捕获
- **Migration**：Django Shell 脚本内部捕获异常，记录错误行后继续

## ADDED Requirements

### Requirement: plane-migrate 技能补充 Django Shell 全量导入模式

`plane-migrate` 技能文档 SHALL 新增"Phase 5 替代方案：Django Shell 全量导入"章节，说明：

- 适用场景：批量迁移导入（>50 条）、存在已完成 Cycle、无 webhook 需求
- 不适用场景：需要触发通知/活动日志、无 Docker 访问权限
- 核心代码模式：`Issue.objects.bulk_create()` + `CycleIssue.objects.bulk_create()`
