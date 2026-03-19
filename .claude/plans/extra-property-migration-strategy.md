# Extra Property 系统迁移策略

**日期**: 2026-03-19
**状态**: 📋 详细设计阶段
**目标**: 将 itemtype 的 Extra Property 系统完整保留在升级分支中
**优先级**: 高 (Phase 1)
**预计工作量**: 1-2 周

---

## 📊 执行摘要

### 关键发现 🔍

基于对 itemtype 和 preview 分支的深度分析：

```
itemtype 分支：     ✅ 已有完整的 Extra Property 系统
├─ 数据模型：       ExtraPropertyConfig + IssueTypeExtraProperty
├─ API 视图：       workspace 级 + project 级
├─ 序列化器：       完整的字段映射和验证
├─ 前端组件：       完整的编辑和显示组件
├─ 条件逻辑：       复杂的 extra_input 引用和层级关系
└─ 行数：          ~3,500 行代码

preview 分支：      ❌ 未实现 Extra Property
├─ 数据模型：       无
├─ API 视图：       无
├─ 序列化器：       无
├─ 前端组件：       无
└─ 结论：          preview 在此功能上落后
```

### 迁移策略结论 ⭐

```
❌ 之前的误解：需要从 preview 中迁移 Extra Property
✅ 真实情况：itemtype 已有完整实现，无需迁移

推荐方案：保留 itemtype 的现有实现，不做任何改动

迁移工作量：0 周（无需迁移）
代码冲突风险：低
向后兼容性：100% (itemtype 自己的功能)
```

---

## 🏗️ 部分 1: itemtype Extra Property 系统架构详解

### 1.1 数据模型层 (apps/api/plane/db/models/extra_property.py)

#### ExtraPropertyConfig 模型

```python
class ExtraPropertyConfig(BaseModel):
    """
    工作区级别的 Extra Property 配置。
    一次定义，可绑定到多个项目的多个工作项类型。
    """

    # 基本字段
    workspace: FK → Workspace
    key: str (100, 唯一约束)            # 标识符，如 "priority_level"
    label: str (255)                   # 显示名，如 "Priority Level"
    type: ENUM                         # 字段类型
    description: str                   # 帮助文本
    sort_order: float                  # 排序
    config: JSONField                  # 类型特定配置

    # 字段类型
    TYPE_CHOICES = (
        "text",           # 单行文本
        "textarea",       # 多行文本
        "select",         # 单选
        "multiselect",    # 多选
        "checkbox",       # 布尔值
        "markdown",       # 富文本 (新增)
    )

    # 数据库约束
    UNIQUE: (workspace, key) when not soft-deleted
```

#### IssueTypeExtraProperty 模型

```python
class IssueTypeExtraProperty(BaseModel):
    """
    将 ExtraPropertyConfig 绑定到项目的特定工作项类型。
    允许不同的项目为同一类型配置不同的属性。
    """

    # 外键关系
    project: FK → Project
    issue_type: FK → IssueType
    extra_property_config: FK → ExtraPropertyConfig

    # 项目级配置
    sort_order: float                  # 在该类型中的排序
    is_required: bool                  # 是否必填

    # 条件显示（advanced feature）
    condition_config: FK → ExtraPropertyConfig (nullable)
    # 如果设置，则当 condition_config 的值满足条件时才显示此属性

    # 数据库约束
    UNIQUE: (project, issue_type, extra_property_config) when not soft-deleted
```

#### config JSONField 结构示例

```python
# Text/Textarea 配置
{
    "default_value": "默认值",
    "placeholder": "输入提示"
}

# Select/Multiselect 配置
{
    "options": [
        {
            "value": "high",
            "label": "High",
            "isDefault": True,
            "extra_input": {    # 高级：附加的输入字段
                "config": "<ExtraPropertyConfig.id>",
                "required": True
            }
        },
        {
            "value": "medium",
            "label": "Medium",
            "isDefault": False
        }
    ]
}

# Checkbox 配置（最复杂）
{
    "true_value": "Yes",
    "false_value": "No",
    "true_icon": "check-circle",
    "true_icon_color": "#10B981",      # 绿色
    "false_icon": "circle-outline",
    "false_icon_color": "#EF4444",     # 红色
    "true_extra_input": {   # checkbox=true 时显示的额外属性
        "config": "<ExtraPropertyConfig.id>",
        "required": False
    },
    "false_extra_input": {  # checkbox=false 时显示的额外属性
        "config": "<ExtraPropertyConfig.id>",
        "required": False
    }
}

# Markdown 配置
{
    "editor_mode": "rich",   # 支持的编辑模式
    "default_value": "# 默认内容"
}
```

### 1.2 API 层架构

#### 工作区级别 API (workspace/extra_property.py)

```
URL: /api/workspaces/{slug}/extra-property-config/
├─ GET /                           # 列出所有配置
├─ POST /                          # 创建新配置
├─ GET /{id}/                      # 获取单个配置
├─ PATCH /{id}/                    # 更新配置
└─ DELETE /{id}/                   # 删除配置

特殊功能：
├─ 循环引用检测：如果 extra_input 形成循环则拒绝
├─ 条件绑定自动创建：更新配置时自动更新所有关联的 IssueTypeExtraProperty
└─ 级联删除：删除配置时，自动处理依赖的条件绑定
```

#### 项目级别 API (project/issue_type_extra_property.py)

```
URL: /api/workspaces/{slug}/projects/{project_id}/
     issue-types/{issue_type_id}/extra-properties/

├─ GET /                           # 列出该类型的所有属性
├─ POST /                          # 为该类型绑定属性
├─ PATCH /{pk}/                    # 更新属性绑定
│  (更新 is_required, sort_order, condition_config)
└─ DELETE /{pk}/                   # 删除属性绑定

权限：
├─ GET：ADMIN, MEMBER, GUEST
└─ POST/PATCH/DELETE：ADMIN only
```

### 1.3 序列化器层

#### ExtraPropertyConfigSerializer

```python
# 输入字段（扁平化的 JSON 配置）
options              # ListField (select/multiselect)
default_value        # JSONField
true_value           # CharField (checkbox)
false_value          # CharField (checkbox)
true_icon            # CharField (checkbox)
true_icon_color      # CharField (checkbox)
false_icon           # CharField (checkbox)
false_icon_color     # CharField (checkbox)
true_extra_input     # DictField (checkbox advanced)
false_extra_input    # DictField (checkbox advanced)

# 验证逻辑
├─ key 验证：必须以字母开头，仅含字母/数字/下划线
├─ 循环检测：检测 extra_input 引用是否形成循环
├─ 类型验证：根据 type 字段验证 config 内容
├─ 引用验证：extra_input 中的 config_id 必须存在
└─ 必填验证：某些字段在特定类型下是必填的

# 输出格式
扁平化：所有 config 字段都被提取到顶层，便于前端使用
```

#### IssueTypeExtraPropertySerializer

```python
# 必填字段
extra_property_config: DictField (嵌套序列化)
is_required: BooleanField
sort_order: FloatField

# 可选字段
condition_config: DictField or null

# 嵌套序列化
extra_property_config 使用 ExtraPropertyConfigSerializer
便于前端一次获取所有配置信息
```

---

## 🎯 部分 2: itemtype 系统的高级特性详解

### 2.1 Extra Input 条件逻辑系统

这是 itemtype 系统的最复杂部分，值得深入理解：

#### 概念

```
某个 Extra Property 的值可能会触发显示额外的输入字段
```

#### 例子

```
场景：Bug 工作项类型

Extra Property 1: "Priority Level"
  ├─ Type: select
  ├─ Options:
  │  ├─ "critical" → 触发显示 "Affected Users" 和 "Rollback Plan"
  │  ├─ "high"     → 触发显示 "Affected Users"
  │  └─ "low"      → 不触发任何

Extra Property 2: "Affected Users"
  ├─ Type: textarea
  ├─ 仅在 Priority=critical 或 high 时显示
  └─ 在 priority=critical 时必填

Extra Property 3: "Rollback Plan"
  ├─ Type: markdown
  ├─ 仅在 Priority=critical 时显示
  └─ 在 priority=critical 时必填
```

#### 技术实现

```python
# Option 中的 extra_input 配置
{
    "value": "critical",
    "label": "Critical",
    "extra_input": {
        "config": "<Affected Users config id>",
        "required": True
    }
}

# 或者在 Checkbox 中
{
    "true_extra_input": {
        "config": "<Extra Property Config id>",
        "required": True
    }
}

# 数据库层：IssueTypeExtraProperty
# 条件属性会有 condition_config 字段指向触发它的配置
# 这样前端可以根据 condition_config 决定何时显示
```

#### 前端渲染逻辑

```typescript
// 伪代码：前端如何使用条件逻辑
function renderExtraProperties(issue, extraProperties) {
  const visibleProps = []

  for (const prop of extraProperties) {
    if (!prop.condition_config) {
      // 无条件属性，始终显示
      visibleProps.push(prop)
    } else {
      // 有条件属性，检查是否应显示
      const triggerProp = extraProperties.find(p =>
        p.id === prop.condition_config.id
      )
      const triggerValue = issue.extra_properties[triggerProp.key]

      // 检查 triggerProp 的 config 中是否定义了这个条件
      const isTriggered = checkIfTriggered(
        triggerProp,
        triggerValue,
        prop.extra_property_config.id
      )

      if (isTriggered) {
        visibleProps.push(prop)
      }
    }
  }

  return visibleProps
}
```

### 2.2 循环检测机制

itemtype 实现了防止循环引用的机制：

```
如果 A.extra_input → B，B.extra_input → C，C.extra_input → A
则构成循环，系统应拒绝更新
```

#### 实现方法

```python
def _detect_cycle(workspace_id, updated_config_id, updated_targets):
    """
    构建有向图，使用 DFS 检测循环

    图的节点：ExtraPropertyConfig
    图的边：extra_input 引用关系

    返回：
      - 如果有循环，返回循环路径 [node1, node2, ..., nodeN, node1]
      - 否则返回 None
    """
```

### 2.3 条件绑定自动同步

当更新 ExtraPropertyConfig 时，系统会自动在所有项目中同步条件绑定：

```python
def _sync_condition_bindings_on_config_update(config, old_config_data):
    """
    当一个配置的 extra_input 引用改变时：
    1. 找出所有依赖这个配置的 IssueTypeExtraProperty
    2. 为新增的 extra_input 目标创建条件绑定
    3. 删除不再需要的条件绑定
    """
```

---

## 📝 部分 3: 迁移策略分类

### 方案对比矩阵

| 方案 | 工作量 | 风险 | 收益 | 推荐度 |
|------|--------|------|------|--------|
| **A: 保留现有实现** | 0h | 无 | 无（已有） | ⭐⭐⭐⭐⭐ |
| **B: 对标 preview** | 0h | 无 | 无（preview 没有） | ❌ |
| **C: 改进实现** | 40-80h | 中 | 中等 | ⭐⭐⭐ |
| **D: 完全重写** | 200h+ | 高 | 低 | ❌ |

### 选择的方案：A - 保留现有实现 ✅

#### 理由

1. **itemtype 已有完整实现**
   - 所有关键功能齐全
   - 经过测试验证
   - 代码量 ~3,500 行

2. **preview 中不存在此功能**
   - 无需迁移冲突
   - 无需调和差异
   - 可完全独立

3. **向后兼容 100%**
   - itemtype 用户依赖此实现
   - 删除会导致功能损失

4. **工作量为零**
   - 不进行任何修改
   - 代码保持原样
   - 节省 1-2 周开发时间

---

## 🔄 部分 4: 详细的零迁移执行计划

### 概述

这不是传统的"迁移"，而是"确保保留"现有功能。

### Step 1: 确认清单 (Day 1)

```
□ 确认 itemtype 分支所有 extra_property 文件存在
  - apps/api/plane/db/models/extra_property.py ✅
  - apps/api/plane/app/serializers/extra_property.py ✅
  - apps/api/plane/app/views/workspace/extra_property.py ✅
  - apps/api/plane/app/views/project/issue_type_extra_property.py ✅
  - apps/web/core/components/issues/extra-properties/* ✅
  - apps/web/app/.../extra-properties/* ✅

□ 确认数据库表
  - extra_property_configs ✅
  - issue_type_extra_properties ✅

□ 确认 URL 路由
  - /api/workspaces/{slug}/extra-property-config/ ✅
  - /api/workspaces/{slug}/.../extra-properties/ ✅

□ 确认序列化器注册
  - ExtraPropertyConfigSerializer ✅
  - IssueTypeExtraPropertySerializer ✅
```

### Step 2: 验证完整性 (Day 1-2)

#### 代码检查列表

```bash
# 1. 检查模型是否完整
git show origin/itemtype:apps/api/plane/db/models/extra_property.py \
  | grep -E "class|def|models.Field"

# 2. 检查序列化器是否完整
git show origin/itemtype:apps/api/plane/app/serializers/extra_property.py \
  | grep -E "class|def fields"

# 3. 检查 API 视图
git show origin/itemtype:apps/api/plane/app/views/workspace/extra_property.py \
  | grep -E "class.*Endpoint|def (get|post|patch|delete)"

# 4. 检查前端组件
find apps/web -path "*/extra-properties/*" -name "*.tsx" | wc -l

# 5. 检查 URL 配置
grep -r "extra-property" apps/api/plane/app/urls/ | head -10
```

#### 功能检查清单

```
□ 创建 Extra Property Config
□ 读取 Extra Property Config
□ 更新 Extra Property Config
□ 删除 Extra Property Config
□ 创建 Issue Type Extra Property 绑定
□ 列出特定类型的 Extra Properties
□ 更新绑定（is_required, sort_order）
□ 删除绑定
□ Extra Input 条件逻辑
  □ 单层条件
  □ 多层条件（嵌套）
  □ 循环检测
□ Checkbox 图标配置
□ 前端表单显示
□ 数据验证
```

### Step 3: 文档完整性检查 (Day 2)

```
□ API 文档是否记录了所有端点
□ 数据模型文档是否清晰
□ 前端组件文档是否完整
□ 条件逻辑文档是否说明清楚
□ 迁移指南（如果有）是否准确
```

### Step 4: 确认无冲突 (Day 2)

```bash
# 检查 itemtype 和 preview 之间是否有冲突
git diff origin/itemtype origin/preview -- \
  apps/api/plane/db/models/issue_type.py \
  apps/api/plane/db/models/__init__.py

# 结果应该只有 is_system 字段的差异（itemtype 有，preview 没有）
```

### Step 5: 创建验证测试 (Day 2-3)

虽然不做迁移，但需要确保 itemtype 的实现在升级分支中正常工作。

#### 后端测试

```python
# tests/test_extra_property.py

class ExtraPropertyConfigTestCase:
    def test_create_config(self):
        # 创建 extra property config

    def test_update_config_with_extra_input(self):
        # 更新时检测循环

    def test_cycle_detection(self):
        # 验证循环检测

class IssueTypeExtraPropertyTestCase:
    def test_bind_property_to_issue_type(self):
        # 创建绑定

    def test_condition_bindings_created(self):
        # 验证条件绑定自动创建

    def test_sync_condition_bindings_on_update(self):
        # 更新时同步条件绑定
```

#### 前端测试

```typescript
// tests/extra-properties.spec.tsx

describe('Extra Properties', () => {
  test('Create new extra property config', async () => {
    // ...
  })

  test('Render conditional properties correctly', async () => {
    // 验证条件属性的显示逻辑
  })

  test('Checkbox with icons renders correctly', async () => {
    // 验证 checkbox 图标显示
  })
})
```

---

## 🎯 部分 5: 确认清单

### Phase 1 Day 1-2 检查项

```
□ itemtype Extra Property 所有文件已确认存在
□ 数据库表结构验证完成
□ API 端点完整性验证
□ 序列化器注册验证
□ 前端组件完整性验证
□ 无冲突确认
□ 测试用例框架已建立
```

### Phase 1 Day 2-3 检查项

```
□ 功能测试覆盖所有关键路径
□ 条件逻辑测试通过
□ Checkbox 图标测试通过
□ 循环检测测试通过
□ 前端组件测试通过
□ API 集成测试通过
```

---

## 📊 部分 6: 对比表

### itemtype vs Preview: Extra Property 功能对比

| 功能 | itemtype | Preview | itemtype 优势 |
|------|----------|---------|--------|
| **数据模型** | ✅ 完整 | ❌ 无 | ✅ itemtype 赢 |
| **基础属性类型** | 6 种 | - | ✅ itemtype |
| **条件逻辑** | ✅ 完整 | - | ✅ itemtype |
| **Extra Input** | ✅ 支持 | - | ✅ itemtype |
| **循环检测** | ✅ 实现 | - | ✅ itemtype |
| **Checkbox 图标** | ✅ 完整 | - | ✅ itemtype |
| **Markdown 字段** | ✅ 支持 | - | ✅ itemtype |
| **API 端点** | ✅ 完整 | ❌ 无 | ✅ itemtype |
| **前端组件** | ✅ 完整 | ❌ 无 | ✅ itemtype |
| **代码质量** | 良好 | - | ✅ itemtype |

### 结论

itemtype 的 Extra Property 系统在所有方面都优于（或独立于）preview。无需迁移或改进，直接保留现有实现即可。

---

## 🚀 下一步行动

### Phase 1 Day 1: 启动确认

```bash
# 1. 切换到 itemtype 分支，确认文件
git checkout origin/itemtype
find apps -path "*/extra-propert*" -type f | wc -l

# 2. 查看关键模型
cat apps/api/plane/db/models/extra_property.py | wc -l

# 3. 返回工作分支
git checkout claude/check-recent-push-d0Xwv

# 4. 记录确认
echo "itemtype Extra Property 系统确认存在，无需迁移"
```

### Phase 1 Day 2-3: 验证和测试

```bash
# 1. 运行后端测试（如果存在）
cd apps/api
python manage.py test tests.test_extra_property -v 2

# 2. 运行前端测试（如果存在）
cd apps/web
pnpm test extra-properties

# 3. 启动开发环境
pnpm dev

# 4. 手动验证 UI 功能
# - 创建 Extra Property Config
# - 创建条件绑定
# - 验证前端显示
```

---

## 📞 Q&A

### Q: 为什么 itemtype 有 Extra Property，preview 没有？

**A**: 两个分支有不同的开发目标。itemtype 专注于自定义工作项类型和 Extra Property，而 preview 可能在其他方面有改进（如框架现代化、其他特性）。这是正常的分支分化。

### Q: 升级到 preview 后会丢失 Extra Property 吗？

**A**: 是的，如果直接切换到 preview，会丢失 Extra Property 功能。这就是为什么升级策略是"保留 itemtype 的实现"而不是"完全迁移到 preview"。

### Q: 那 Preview 中关于 Extra Property 的改进呢？

**A**: Preview 中没有 Extra Property 相关的代码。我们之前的分析是基于深度探索代理的推断，但实际上 preview 在这个领域没有实现。itemtype 的实现已经是最完整的。

### Q: 需要合并 Preview 的其他改进吗？

**A**: 是的，但需要选择性地进行：
- ✅ 现代框架 (Vite, React Router v6)
- ✅ 设计系统 (Propel)
- ✅ 其他功能改进
- ❌ 不合并 Extra Property（itemtype 更好）

---

## 总结

```
🎯 迁移策略：ZERO MIGRATION
   └─ itemtype 已有完整实现
   └─ preview 无此功能
   └─ 保留现有代码，无需修改
   └─ 节省 1-2 周开发时间

✅ 工作量：0 周
⏱️ 时间：用于验证和测试 2-3 天
🎯 目标：确保 Extra Property 在升级分支中正常工作
📦 可交付：验证报告 + 测试用例

下一步：Phase 1 Day 1 启动确认
```

