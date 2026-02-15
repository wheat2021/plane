## Context

当前 `ExtraPropertyConfig` 模型在工作空间级别定义了 `required` 布尔字段，表示该属性是否全局必填。`IssueTypeExtraProperty` 绑定模型仅存储 project/issue_type/config 三元组关系和排序。

问题：同一个自定义属性在不同工作项类型中的必填需求不同。当前架构无法实现"属性 A 对 Bug 类型必填、对 Feature 类型可选"的场景。

## Goals / Non-Goals

**Goals:**

- 将 required 配置从属性定义层移到绑定层，实现按工作项类型粒度配置
- 保证数据迁移安全：已有的 required 值迁移到对应绑定记录
- 前端 UI 调整：设置页移除 required 控件，绑定管理区增加 required 开关

**Non-Goals:**

- 不改变 ExtraPropertyConfig 的其他字段（key, label, type, config 等）
- 不改变绑定模型的创建/删除 API 路径
- 不引入条件必填（如基于字段值的动态 required 逻辑）

## Decisions

### D1: 使用 `is_required` 命名而非复用 `required`

在 `IssueTypeExtraProperty` 绑定模型中新增字段命名为 `is_required` 而非 `required`。

**理由**: `required` 是 Python/Django 常见的参数名（如 `forms.CharField(required=True)`），使用 `is_required` 避免潜在命名冲突，同时符合布尔字段的 `is_` 前缀惯例。

**替代方案**: 使用 `required` —— 更简短但存在命名混淆风险。

### D2: 单次迁移文件处理字段增删和数据迁移

使用一个 Django 迁移文件完成三个操作：

1. 在 `IssueTypeExtraProperty` 表添加 `is_required` 列（default=False）
2. 数据迁移：将 `ExtraPropertyConfig.required` 值复制到所有关联的 `IssueTypeExtraProperty.is_required`
3. 从 `ExtraPropertyConfig` 表移除 `required` 列

**理由**: 操作简单、原子性好。数据量小（自定义属性数量有限），不需要分步迁移。

**替代方案**: 分两个迁移文件（先加后删）—— 增加复杂度但允许中间状态验证。当前场景无需此复杂度。

### D3: 绑定 API 的 PATCH 端点支持 is_required 更新

当前绑定 API 仅有 LIST/CREATE/DELETE。需要新增 PATCH 端点用于更新 `is_required` 和 `sort_order`。

路径: `PATCH /workspaces/<slug>/projects/<pid>/issue-types/<type_id>/extra-properties/<binding_id>/`

**理由**: is_required 是绑定记录的属性，需要独立更新能力。前端切换 required 开关时直接 PATCH 绑定记录。

**替代方案**: 在 CREATE 时传入 is_required，修改时 DELETE + CREATE —— 不自然且丢失 id 稳定性。

### D4: 前端绑定管理 UI 使用 inline toggle

在项目设置的 Work Item Types 展开区域，每个已绑定属性的 checkbox 行右侧添加 "Required" toggle 开关。

**理由**: 复用现有绑定列表 UI，required 状态与绑定状态在同一视觉行内管理，用户操作路径短。

**替代方案**: 弹窗编辑绑定详情 —— 过重，当前仅有 is_required 一个可编辑字段。

## Risks / Trade-offs

- **BREAKING API 变更**: ExtraPropertyConfig 响应移除 required 字段 → 仅影响自定义前端（无第三方消费者），可直接变更
- **数据迁移方向性**: required 从全局下移到绑定，一个 config 的 required=true 会传播到所有已有绑定 → 符合"保守继承"原则，管理员可逐一调整
- **无绑定的属性丢失 required 信息**: 如果属性 required=true 但尚无任何绑定记录，迁移后该信息丢失 → 可接受，无绑定表示属性未被使用
