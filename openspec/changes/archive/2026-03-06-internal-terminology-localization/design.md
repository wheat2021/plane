## Context

Plane 的中文翻译（zh-CN）直接使用了原始 Plane 概念的译名：project→项目、module→模块、cycle→周期。
内部管理模型对这些概念做了重新定义：project=工作空间（空间）、module=业务项目（项目）、cycle=Sprint 迭代（迭代）。

翻译层是唯一需要修改的地方——数据模型、API、英文 UI 保持不变，仅 zh-CN locale 文件承载这层语义映射。

工作项类型（IssueType）通过 Django migration 种子化，新增 Milestone（里程碑）和 Report（汇报）两种类型，供团队管理业务项目的里程碑节点和进展汇报。

## Goals / Non-Goals

**Goals:**

- 重映射 zh-CN 三组核心术语，消除 Plane 原始命名与内部管理语言之间的歧义
- 补充 Milestone、Report 两种工作项类型的种子数据
- 不改变任何英文翻译、数据模型或 API 行为

**Non-Goals:**

- 不修改 en 翻译文件（英文保持 Plane 原始命名）
- 不修改后端数据库字段或 API 路径
- 不实现 Epic 路由页面（已评估，当前版本不需要）
- 不修改工作项类型的 UI 行为（仅增加种子数据）

## Decisions

### 决策 1：仅修改 zh-CN，不触碰 en

**选择**：zh-CN 重映射术语，en 保持 Plane 原生命名。

**原因**：

- 内部术语仅在中文语境下有意义；英文命名与上游 Plane 文档保持一致，便于参考官方资料
- 减少上游 rebase 冲突面（en 文件更稳定，修改越少越好）

**备选**：同时修改 en → 放弃，因为无收益且增加冲突风险。

---

### 决策 2：替换顺序——先 project→空间，再 module→项目

**选择**：严格按以下顺序执行字符串替换：

```
步骤 1：zh-CN 中所有「项目」（project 语境）→「空间」
步骤 2：zh-CN 中所有「模块」→「项目」
步骤 3：zh-CN 中所有「周期」→「迭代」
```

**原因**：

- 步骤 1 和步骤 2 不能颠倒——如果先把「模块」改成「项目」，再把「项目」改成「空间」，会把刚改完的「项目」（模块语境）也错误替换成「空间」
- 步骤 3 独立，顺序不影响结果

**实施方式**：手动逐行修改，而非正则批量替换，以避免误伤描述性文本中非术语用法的「项目」字样。

---

### 决策 3：描述性文本按语境重写而非机械替换

**选择**：对 empty state、功能介绍等描述性文本，根据内部语境重写，而非机械替换术语。

**原因**：部分描述文本包含面向 SaaS 用户的举例（「产品路线图、营销活动、新车发布」），在内部开发场景下语义不当，需替换为开发团队熟悉的表述。

**受影响的关键文本**：

- `L1324/L1455/L1466`：project 的用途描述
- `L1450`：project 作为「目标导向工作父级」的长描述
- `L2210`：module 的功能描述（含「里程碑」说法）
- `L2141-2142`：cycle 的定义描述

---

### 决策 4：Milestone / Report 通过 migration 种子化

**选择**：新建一个 Django migration，在所有既有 workspace 中追加 Milestone 和 Report 工作项类型。

**原因**：

- 与现有 `0118_seed_default_issue_types.py` 模式完全一致，无需引入新机制
- migration 幂等执行，已有同名类型时跳过创建
- 不影响已有工作项数据

**类型属性设计**：

| 类型   | name      | 中文显示 | logo icon    | color     | is_default | level |
| ------ | --------- | -------- | ------------ | --------- | ---------- | ----- |
| 里程碑 | Milestone | 里程碑   | `flag`       | `#f59e0b` | false      | 3     |
| 汇报   | Report    | 汇报     | `file-chart` | `#8b5cf6` | false      | 4     |

注：中文显示名通过工作项类型设置页面配置，migration 只写英文 name。

## Risks / Trade-offs

| 风险                                                      | 缓解措施                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 上游 rebase 时 zh-CN 翻译文件产生大量冲突                 | 修改集中在单一文件；每次 rebase 后只需检查新增 key 的 value 是否沿用了旧术语，批量搜索「周期/模块」即可发现 |
| 描述性文本重写后语义偏差                                  | 修改后在浏览器中逐页核查 empty state 显示效果                                                               |
| migration 在已有 Milestone/Report 的 workspace 上重复创建 | migration 逻辑加 `exists()` 检查，已存在则跳过                                                              |

## Migration Plan

1. 修改 `packages/i18n/src/locales/zh-CN/translations.ts`（前端，无需部署后端）
2. 执行 `pnpm --filter=@plane/i18n run build` 重新编译翻译包
3. 新建 Django migration 文件（`0121_add_milestone_report_issue_types.py`）
4. 在测试环境执行 `python manage.py migrate`，确认类型出现在工作项类型设置页

**回滚**：翻译文件 git revert；migration 通过 reverse function 删除新增类型。
