## Context

Extra Property 系统是本项目自定义功能（不存在于上游 Plane），用于为不同 Work Item Type 附加额外字段。当前支持 5 种类型：`text | textarea | select | multiselect | checkbox`，值存储在 `issue.extra_properties`（JSON 字段）中。

现有的 Extra Property 配置体系：

- `ExtraPropertyConfig`：workspace 级别配置，定义类型、选项、颜色等（含 `config` JSON 扩展字段）
- `IssueTypeExtraProperty`：project 级别绑定，将 config 绑定到具体 issue type
- 前端通过 `ExtraPropertyControl` 根据 `config.type` 分发到对应控件组件

新增 `member` 类型需要在整个链路（后端模型 → 序列化校验 → 类型定义 → 前端控件 → 配置界面）上扩展，但**不改变存储格式**（extra_properties 仍是 JSON，值仍是 string/string[]/boolean/null）。

## Goals / Non-Goals

**Goals:**

- 新增 `member` Extra Property 类型，支持选择单个工作区成员
- 支持 `member_color` 颜色配置，在头像上视觉区分不同角色字段
- 与现有 Extra Property API（issue CRUD 的 `extra_properties` 字段）无缝集成，无需新端点
- 配置界面（Settings → Extra Properties）支持创建和编辑 `member` 类型及其颜色

**Non-Goals:**

- 不新增独立的 member 类型 API 端点
- 不支持多选成员（multi-member）——单选已满足当前需求
- 不限制可选成员范围（如仅项目成员），默认使用 workspace 成员列表
- 不实现成员角色过滤

## Decisions

### 决策 1：值存储为 user_id 字符串

**选择：** `member` 类型的 `extra_properties` 值存为 user_id（UUID 字符串）。

**理由：** 与现有 `select` 类型保持一致（均存字符串），无需修改 `extra_properties` 的 JSON schema。前端在渲染时通过 MobX member store 将 user_id 解析为用户信息（头像、姓名），与 assignee 的处理方式相同。

**备选方案：** 存储 `{id, display_name}` 对象 → 被否决，因为会导致用户改名后数据陈旧，且与其他类型格式不一致。

### 决策 2：颜色配置存入 config JSON 的 member_color 字段

**选择：** 在 `ExtraPropertyConfig.config` JSON 中新增 `member_color: string`（hex，如 `"#6366f1"`），通过 `TExtraPropertyConfig` 类型扩展暴露。

**理由：** `config` 字段已用于 checkbox 的 `true_icon_color`/`false_icon_color`，延用相同模式无需修改数据库 schema。后端 `ExtraPropertyConfig` 模型的 `@property` 方法添加 `member_color` 计算属性即可。

**备选方案：** 在模型上新增独立 DB 字段 → 被否决，不必要的 schema 变更。

### 决策 3：后端校验 user_id 存在性

**选择：** 后端 serializer 在校验 `member` 类型的 extra_property 值时，检查 value 是否为当前 workspace 的合法 member user_id（或 null/空字符串）。

**理由：** 防止存储不存在的 user_id，保证数据一致性。与 `select` 类型校验 value 必须在 options 中的逻辑对称。

**实现位置：** `apps/api/plane/app/serializers/extra_property.py` 或 issue serializer 中的 extra_properties 校验逻辑。

### 决策 4：前端使用 workspace 级别 MemberDropdown

**选择：** `MemberControl` 组件使用 `MemberDropdown`，传入 `workspaceSlug` 而非 `projectId`，显示全体 workspace 成员。

**理由：** Extra Property 配置是 workspace 级别的，不绑定特定项目，因此成员列表也应是 workspace 范围。`MemberDropdown` 已支持不传 `projectId` 时使用 `workspaceMemberIds`。

## Risks / Trade-offs

- **成员离职/移除**：若成员被移出 workspace，已存储的 user_id 仍在 `extra_properties` 中。前端渲染时 `getUserDetails` 返回 undefined，需优雅降级（显示 "已移除用户" 或隐藏头像）。→ 在 `MemberControl` 中处理 undefined 用户的边界情况。
- **类型变更兼容性**：`member` 类型与其他类型的兼容性矩阵需要更新（目前 form.tsx 中有静态兼容矩阵 `isTypeCompatible`）。`member` → `text`（导出 user_id 字符串）可设为兼容，其余类型间转换不兼容。

## Migration Plan

1. 后端：新增 `member` 到 TYPE_CHOICES（无数据库 schema 变更，仅 choices 变化），创建 migration
2. 类型包：更新 `TExtraPropertyType` 并重新 build
3. 前端：新增 `MemberControl` 组件，更新分发逻辑和配置表单
4. 无数据迁移：现有数据不受影响

**回滚：** 删除新增的 migration，还原类型包和前端文件即可。
