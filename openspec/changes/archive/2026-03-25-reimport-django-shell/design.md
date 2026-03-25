## Context

`reimport_all.py` 当前架构：Cycle/Module 创建用 Django Shell，issue 创建用 REST API，Cycle 关联用 Django Shell（修复后）。REST API 创建 issue 存在两个已知问题：

1. 限流（429）：每 ~60 条触发一次，指数退避最多等待 32s 仍可能失败
2. 无法关联已完成 Cycle：API 返回 400 CYCLE_COMPLETED

探索阶段已确认：`extra_properties` 是 `Issue` 表上的 `JSONField`，Django Shell 可直接写入；issue 创建触发的 `issue_activity` 和 `model_activity` Celery 任务对迁移场景无实际影响（无 webhook 配置，活动日志非必须）。

**项目 State 映射（Dev 环境，Prod 同结构）：**

| State 名称 | UUID                                 | group     |
| ---------- | ------------------------------------ | --------- |
| Backlog    | 4657dc96-1572-41e3-becd-0ba3d4ff8e22 | backlog   |
| Done       | ecca640d-654d-4704-811b-8d73a62bf891 | completed |
| Cancelled  | a3b8c918-98cc-4bc1-8de0-6713296e1f77 | cancelled |

**Closed 终态策略：** 0131/0307/0328/0425 四个已结束迭代使用 `Cancelled` state（group=cancelled），0523 保持 CSV 中的原始 state_id（Backlog）。

## Goals / Non-Goals

**Goals:**

- 全流程改用 Django Shell，消除限流和 Cycle 状态限制
- 0131~0425 迭代的 Requirement 以 Cancelled 终态导入
- 保持 `--env dev/prod` 和 `--clean` 参数不变

**Non-Goals:**

- 不修改 `build_import_csv.py`（CSV 格式不变）
- 不处理 state 的环境差异（Prod 环境需在运行时查询 Cancelled state UUID）

## Decisions

**决策 1：全流程 Django Shell，移除 REST API 调用**

Issue 创建、CycleIssue 关联、ModuleIssue 关联全部改为 Django Shell ORM。

```
旧流程：
  REST POST /issues/ × 189  →  Django Shell bulk CycleIssue  →  REST POST /module-issues/

新流程：
  Django Shell bulk_create Issue × 189
  Django Shell bulk_create CycleIssue
  Django Shell bulk_create ModuleIssue
```

**决策 2：单次 Django Shell 调用完成所有 issue 创建 + 关联**

将 CSV 数据序列化为 JSON 传入 Django Shell，一次调用完成全部操作，避免多次 `docker exec` 开销。

**决策 3：Closed 终态通过 state group 查询，不硬编码 UUID**

```python
# 运行时查询，兼容 Dev/Prod 环境
closed_state = State.objects.filter(project=proj, group='cancelled').first()
```

0523 cycle 的 issue 使用 CSV 中的 state_id（Backlog），其余 cycle 覆盖为 closed_state.id。

**决策 4：plane-migrate 技能补充 Django Shell 全量导入模式**

在技能文档中新增"Phase 5 替代方案：Django Shell 全量导入"章节，说明适用场景（迁移/批量导入）和注意事项。

## Risks / Trade-offs

- **绕过业务校验**：Django Shell 不经过 serializer 校验，需自行保证数据格式正确（extra_properties JSON 结构、UUID 有效性）
- **无活动日志**：导入的 issue 无 "created" 活动记录，对审计无影响（迁移数据）
- **Prod 环境 state UUID 不同**：通过 `group='cancelled'` 动态查询解决
