## Why

当前 `required` 字段定义在 `ExtraPropertyConfig` 模型上（工作空间级别），表示该属性全局是否必填。但在实际使用中，同一个自定义属性在不同工作项类型中的必填需求不同——例如"优先级评分"对 Bug 类型必填，对 Feature 类型可选。需要将 required 配置下移到绑定层（`IssueTypeExtraProperty`），让每个工作项类型独立决定其绑定的属性是否必填。

## What Changes

- **BREAKING**: 从 `ExtraPropertyConfig` 模型中移除 `required` 字段
- 在 `IssueTypeExtraProperty` 绑定模型中新增 `is_required` 字段（BooleanField, default=False）
- 更新 API 序列化器：ExtraPropertyConfig 不再包含 required，IssueTypeExtraProperty 响应中包含 is_required
- 更新 TypeScript 类型定义：`TExtraPropertyConfig` 移除 required，`TIssueTypeExtraProperty` 新增 is_required
- 工作空间 Extra Properties 设置页面移除 required 编辑控件
- 项目 Work Item Types 设置页面的绑定区域增加 required 开关
- Issue 详情页的必填校验逻辑改为从绑定记录读取 is_required

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `extra-properties`: 从 ExtraPropertyConfig 模型和序列化中移除 `required` 字段
- `extra-property-settings`: 从属性编辑表单中移除 required 开关
- `project-extra-property-binding`: 在 IssueTypeExtraProperty 模型中新增 `is_required` 字段，API 和 UI 相应调整
- `work-item-types`: 绑定管理区域增加 required 开关控件

## Impact

- **数据库迁移**: 需要新增迁移文件，在 IssueTypeExtraProperty 表添加 `is_required` 列，从 ExtraPropertyConfig 表移除 `required` 列
- **数据迁移**: 需要将现有 ExtraPropertyConfig.required 值迁移到对应的 IssueTypeExtraProperty.is_required（所有已有绑定继承原属性的 required 值）
- **API 兼容性**: ExtraPropertyConfig 的 GET/PATCH 响应不再包含 required 字段，属于 **BREAKING** 变更
- **前端 Store**: ExtraPropertyConfigStore 和 IssueTypeExtraPropertyStore 均需调整
- **上游冲突风险**: 低——改动集中在自定义模型和自定义前端组件，不涉及上游核心文件
