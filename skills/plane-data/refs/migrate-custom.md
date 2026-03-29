# 场景：自定义数据源迁移

> 适用于非 Jira 的数据源：Markdown 表格、Wiki API、内部系统导出、手工整理的清单等。
> 与 Jira 迁移的区别：没有固定字段映射，需要与用户讨论设计 IssueType 和 EP。

## 调用形式

```
/plane-data import <数据描述或文件路径> <work_item_type>
```

---

## 迭代式工作流

### Phase 1: 分析源数据

1. 读取数据（文件或 API）
2. 识别所有字段、值域、数据量
3. 可视化数据结构（ASCII 图表）

### Phase 2: 与用户讨论设计

不要自动决定，与用户讨论：

- IssueType 名称、icon、level
- 哪些字段映射到内置属性（name, assignee, state, description）
- 哪些字段需要 Extra Property（类型、key、options）
- 状态映射方案
- 是否需要创建用户

输出设计方案表格，等待用户确认。

### Phase 3: 准备环境

按确认的方案执行（代码模板见 ops-\*.md）：

1. 创建缺失用户（`ops-user.md`）
2. 创建 IssueType + EP + Binding（`ops-schema.md`）
3. 确认 State 存在

### Phase 4: 导入数据

1. 生成 `data/<任务名>/issues.json`
2. 用 bulk_create 导入（`ops-issue.md`）
3. 创建 Assignee 关联
4. 设置 EP 值（member EP 需要 user UUID）

### Phase 5: 迭代补充（关键差异点）

自定义迁移通常不是一次完成的。预期会有多轮迭代：

```
第 1 轮: 导入基础数据
第 2 轮: 从新数据源补充缺失记录
第 3 轮: 更新状态/EP（如镜像版本）
第 4 轮: 建立 Relation
第 N 轮: 持续维护
```

每轮操作模式：

```python
# 1. 比对（ops-issue.md 数据比对模板）
existing = set(Issue.objects.filter(...).values_list('name', flat=True))
source = set(new_data_names)
to_create = source - existing
to_update = source & existing

# 2. 补充创建
# 3. 批量更新
# 4. 建立 Relation
```

### Phase 6: 验证

```python
# 统计验证
issues = Issue.objects.filter(project=proj, type_id=issue_type.id)
print(f'Total: {issues.count()}')

# 状态分布
from collections import Counter
states = Counter(issues.values_list('state__name', flat=True))
for s, c in states.most_common():
    print(f'  {s}: {c}')

# EP 覆盖率
for key in ['ep1', 'ep2']:
    has = sum(1 for i in issues if i.extra_properties and key in i.extra_properties)
    print(f'  {key}: {has}/{issues.count()}')

# 抽样验证（选几条关键数据人工核对）
```

---

## 实战参考

参见 `data/strategy-import/` — 策略清单迁移的完整案例：

- 源数据：Markdown 表格 + Wiki API
- 两个 IssueType：Strategy（130 条）、BusinessGroup（18 条）
- 多轮迭代：基础导入 → 状态更新 → 镜像版本 → 补充缺失 → Relation
- 涉及：45+6 个用户创建、8+3 个 EP、81 条 Relation、Label
