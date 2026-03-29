# Plane 数据模型速查

> 所有模型在 `plane.db.models` 下。标注 ⚠️ 的是容易踩坑的字段。

## Issue（核心）

```
Issue (ProjectBaseModel)
  workspace, project                    # 自动从 ProjectBaseModel 继承
  name              CharField(255)
  description_html  TextField          # HTML 格式，空值用 "<p></p>"
  type_id           FK → IssueType     # ⚠️ 字段名 type_id，REST API 传 "type_id"
  state_id          FK → State         # ⚠️ ORM 用 state_id，REST API 传 "state"（不是 state_id）
  priority          CharField          # none | low | medium | high | urgent
  extra_properties  JSONField          # dict，member EP 值为 user UUID 字符串
  sequence_id       int                # ⚠️ bulk_create 不自动分配，需手动修复
  created_by, updated_by               # FK → User
```

## IssueType

```
IssueType (BaseModel)                  # ⚠️ BaseModel，不是 ProjectBaseModel
  workspace         FK → Workspace
  name              CharField(255)
  description       TextField
  logo_props        JSONField          # {"in_use":"icon","icon":{"name":"...","color":"#..."}}
  is_default        bool
  is_active         bool
  level             float              # 排序用
  is_system         bool
```

## ExtraPropertyConfig

```
ExtraPropertyConfig (BaseModel)
  workspace         FK → Workspace
  key               CharField(100)     # ⚠️ unique_together (workspace, key)
  label             CharField(255)     # 显示名
  type              CharField(20)      # text|textarea|select|multiselect|checkbox|markdown|member|reference
  config            JSONField          # 类型相关配置，见下方
```

config 示例：

```json
select/multiselect: {"options": [{"value":"v1","label":"显示名"}, ...]}
member:             {"member_color": "#6366f1"}
checkbox:           {"true_value":"是","false_value":"否"}
text/textarea:      {}
```

## IssueTypeExtraProperty（EP 绑定）

```
IssueTypeExtraProperty (BaseModel)     # ⚠️ BaseModel，没有 workspace 字段！
  project                FK → Project
  issue_type             FK → IssueType
  extra_property_config  FK → ExtraPropertyConfig
  is_required            bool
  sort_order             float
  condition_config       FK → ExtraPropertyConfig (nullable)
```

## State

```
State (ProjectBaseModel)
  name       CharField(255)
  color      CharField           # hex color
  group      CharField           # backlog | unstarted | started | completed | cancelled
  sequence   float               # 排序
  default    bool
```

## User / Member

```
User
  email          unique
  username       unique           # ⚠️ 创建时必须设为 email，否则唯一约束冲突
  display_name   CharField
  is_active      bool
  is_password_autoset  bool

WorkspaceMember (BaseModel)
  workspace, member(FK→User), role  # 5=Guest, 10=Viewer, 15=Member, 20=Admin

ProjectMember (BaseModel)
  project, member(FK→User), role, workspace
```

## 关联模型

```
IssueAssignee (ProjectBaseModel)
  issue_id, assignee_id(FK→User)

IssueRelation (ProjectBaseModel)
  issue_id, related_issue_id
  relation_type    # relates_to | blocked_by | duplicate

IssueLabel (ProjectBaseModel)
  issue_id, label_id(FK→Label)

Label (ProjectBaseModel)
  name, color

IssueSequence (ProjectBaseModel)
  issue(FK), sequence(int)

CycleIssue (ProjectBaseModel)
  cycle_id, issue_id

ModuleIssue (ProjectBaseModel)
  module_id, issue_id
```

## 继承关系

```
BaseModel          → id(UUID), created_at, updated_at, created_by, updated_by
ProjectBaseModel   → BaseModel + workspace(FK) + project(FK)
```

> `IssueType`、`ExtraPropertyConfig`、`IssueTypeExtraProperty` 都是 **BaseModel**，不是 ProjectBaseModel。操作时不要传 workspace 给 IssueTypeExtraProperty。
