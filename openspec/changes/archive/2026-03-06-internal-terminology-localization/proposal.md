## Why

系统内部采用「workspace=整体系统 / project=工作空间 / module=业务项目 / cycle=迭代」的管理模型，与 Plane 默认中文翻译（项目/模块/周期）存在概念错位，导致团队使用时产生歧义。需通过翻译层统一术语，同时补充内部使用的工作项类型（里程碑、汇报），使工具与管理语言对齐。

## What Changes

- 重映射 zh-CN 所有 `project` 相关译文：「项目」→「空间」（约 100 处）
- 重映射 zh-CN 所有 `module` 相关译文：「模块」→「项目」（约 35 处）
- 重映射 zh-CN 所有 `cycle` 相关译文：「周期」→「迭代」（约 50 处）
- 更新相关描述性文本，使其符合内部开发语境（替换 SaaS 用语如「产品路线图、营销活动」）
- 新增两个默认工作项类型：`Milestone`（里程碑）、`Report`（汇报）

## Capabilities

### New Capabilities

无新增独立能力。

### Modified Capabilities

- `i18n`：zh-CN 翻译映射规则变更——`project`→空间、`module`→项目、`cycle`→迭代；更新描述性文本语境
- `work-item-types`：向所有既有 workspace 追加两个默认工作项类型（Milestone / Report），通过 Django migration 实现

## Impact

**前端**

- `packages/i18n/src/locales/zh-CN/translations.ts`：约 185 行修改，高度集中，无逻辑变更
- `packages/i18n/src/locales/en/translations.ts`：不变（英文术语保持 Plane 原生命名）

**后端**

- `apps/api/plane/db/migrations/`：新增一个 migration，为所有 workspace 补充 Milestone 和 Report 工作项类型

**上游冲突风险**

- `zh-CN/translations.ts`：中等风险，上游会持续增加新 key，但本次修改为已有 key 的 value 修改，rebase 时逐行冲突可控
- 新增 migration 文件：低风险，独立文件无冲突
