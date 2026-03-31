# 已知坑合集

## Django Shell 执行

| 坑                | 说明                                                                 | 正确做法                                                                 |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 中文 unicode 转义 | heredoc 内嵌中文 JSON 时，`display_name` 被存为 `\u82df\u690d\u4e1c` | 将脚本写入 .py 文件，用 `cat script.py \| docker exec -i ... shell` 执行 |
| stdin 冲突        | 脚本通过 stdin 传入时，无法再用 `sys.stdin` 读数据                   | 数据文件用 `docker cp` 放入容器，脚本中 `open('/tmp/data.json')` 读取    |

## Issue 操作

| 坑                      | 说明                                            | 正确做法                                                                                                                          |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `state` vs `state_id`   | REST API 创建 issue 用 `"state": <UUID>`        | ORM 用 `state_id=`，REST 用 `"state":`                                                                                            |
| bulk_create sequence_id | bulk_create 绕过 save()，sequence_id 全为默认值 | 手动分配 + 创建 IssueSequence 记录（见 ops-issue.md）                                                                             |
| extra_properties 更新   | JSONField 需整体赋值                            | `ep = issue.extra_properties or {}; ep['key'] = val; issue.extra_properties = ep; issue.save(update_fields=['extra_properties'])` |
| multiselect 值格式      | 存储为 Python list，不是逗号分隔字符串          | `{"venue": ["中金所", "外汇交易中心"]}`                                                                                           |

## 用户操作

| 坑                | 说明                                                   | 正确做法                                  |
| ----------------- | ------------------------------------------------------ | ----------------------------------------- |
| username 唯一约束 | User.username 有 unique 约束                           | 创建时 `username=email`                   |
| 创建用户三步      | 只创建 User 不够，还需 WorkspaceMember + ProjectMember | 用 get_or_create 三步走（见 ops-user.md） |

## Schema 操作

| 坑                                  | 说明                                           | 正确做法                                          |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| IssueTypeExtraProperty 无 workspace | 继承 BaseModel 不是 ProjectBaseModel           | get_or_create 时不传 workspace                    |
| EP key workspace 级唯一             | `ExtraPropertyConfig(workspace, key)` 唯一约束 | 不同 IssueType 共享同一 config，通过 binding 区分 |
| EP binding 是 project 级            | 同一 IssueType 在不同项目需分别绑定 EP         | 每个目标项目都要创建 IssueTypeExtraProperty       |

## REST API 限制

| 坑                | 说明                               | 正确做法                                         |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| 创建 Cycle/Module | REST 返回 "Project ID is required" | 用 Django Shell                                  |
| 已完成 Cycle 关联 | REST 返回 400 CYCLE_COMPLETED      | 用 Django Shell CycleIssue.objects.create        |
| 限流 429          | 批量 REST 调用触发限流             | sleep 0.3s 间隔，或改用 Django Shell bulk_create |

## 生产环境

| 坑        | 说明                             | 正确做法                 |
| --------- | -------------------------------- | ------------------------ |
| 容器名    | 生产是 `api`，不是 `plane-api-1` | 按环境配置使用正确容器名 |
| API Token | 生产 token 不在配置文件中        | 从 SKILL.md 环境配置获取 |
