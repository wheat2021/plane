## Context

额外属性（Extra Properties）是工作区级别的自定义字段，管理员在工作区设置页面配置，绑定到工作项类型后在工作项详情侧边栏展示。

**当前问题：**

- `form.tsx` 中类型选择器在编辑模式下硬编码 `disabled={isEditMode}`，管理员无法修正错误选择的类型
- 控件挂载时不校验已存储值的合法性，类型变更后旧值可能导致 select/multiselect 控件显示异常（选项不存在）
- 无任何 API 可查询某个属性当前有多少工作项在使用、使用了哪些值

**约束：**

- 后端 `extra_properties` 以 JSONField 存储在 Issue 模型上，格式为 `{key: value}`
- 前端 `issuesMap` 仅含已加载到内存的工作项，不能代表全部数据
- 本功能为本地自定义，上游不存在，冲突风险低

## Goals / Non-Goals

**Goals:**

- 编辑模式开放类型选择，并在类型不兼容时展示影响范围
- 提供轻量后端 API 用于查询属性的使用情况
- 控件挂载时自动清除不合法的已存储值

**Non-Goals:**

- 不自动批量迁移后端已有的不合法值（仅前端清除，由用户重填）
- 不支持类型变更时的值映射向导（不逐条提示用户如何转换）
- 不删除后端 `markdown` TYPE_CHOICES（当前无数据使用，暂保留）

## Decisions

### 决策 1：后端 `/values/` API 的查询范围

**选择**：对整个工作区范围内的 Issue 进行 `extra_properties__has_key=<key>` 查询。

**理由**：Extra Property Config 是工作区级别的，一个 key 可跨多个项目使用。若只查当前项目会遗漏数据，误导管理员。

**备选方案**：前端扫描 `issuesMap`。被否因 `issuesMap` 只含已加载数据，不完整。

---

### 决策 2：类型兼容性检查位置

**选择**：前端静态计算兼容性（不调 API），仅在"不兼容"时再调 `/values/` 确认是否有实际影响。

**兼容性矩阵（静态判断）：**

| 来源 → 目标 | text  | textarea | select | multiselect | checkbox |
| ----------- | ----- | -------- | ------ | ----------- | -------- |
| text        | ✓     | ✓        | ⚠      | ⚠           | ⚠        |
| textarea    | ✓     | ✓        | ⚠      | ⚠           | ⚠        |
| select      | ✓     | ✓        | ✓      | ✓\*         | ⚠        |
| multiselect | ⚠     | ⚠        | ⚠      | ✓           | ⚠        |
| checkbox    | ✓\*\* | ✓\*\*    | ⚠      | ⚠           | ✓        |

- ✓ = 值格式兼容，无需提示
- ✓\* = select→multiselect：把 `"opt"` 包成 `["opt"]`，自动兼容
- ✓\*\* = checkbox→text：`true/false` 存为布尔，但会被前端值校验清除（boolean 不是合法 string）
- ⚠ = 格式不兼容，需查询实际影响

**理由**：避免每次类型选择都调 API，只在真正有风险时才发请求，减少无意义网络开销。

---

### 决策 3：不合法值清除时机

**选择**：在 `ExtraPropertyControl` 组件 mount 时（`useEffect(fn, [])`），检测值合法性，不合法则调 `onChange(null)` 清空。

**合法性规则：**

- `text/textarea`：`value` 为 `string | null` → 合法
- `checkbox`：`value` 为 `boolean | null` → 合法
- `select`：`value` 为 `null` 或存在于 `config.options` 中的字符串 → 合法
- `multiselect`：`value` 为 `null/[]` 或每个元素均存在于 `config.options` → 合法（部分不合法元素过滤掉，若全部不合法则清空）

**仅在 `!disabled` 时执行**：只读模式不应自动清空（防止在非编辑场景误触发保存）。

**副作用**：`onChange(null)` 会直接触发后端保存。这是预期行为——不合法的值不应持久化。

---

## Risks / Trade-offs

**[风险] `/values/` API 性能**
→ `extra_properties__has_key` 在大量工作项时可能较慢。
→ 缓解：该 API 仅由 ADMIN 调用，且仅在类型变更为不兼容时触发，不在普通浏览场景下调用。未来可加索引。

**[风险] 不合法值清除触发后端写操作**
→ 若控件在只读场景下错误触发（`disabled` 未正确传递），会意外清空数据。
→ 缓解：严格检查 `!disabled` 条件，并在 `ExtraPropertyRenderer` 确保 `isEditable` 正确传递到 `disabled` prop。

**[风险] multiselect 部分过滤**
→ 若多选值 `["A", "B", "C"]` 中 `"B"` 被删除，清除整个数组会比过滤更安全（保留部分值可能误导用户）。
→ 决策：目前选择过滤保留合法值，仅在全部不合法时清空。

**[Trade-off] 不做批量后端迁移**
→ 旧值仍在后端 DB 中存储（即使前端清除），若用户通过 API 直接读取原始数据，可能看到过期值。
→ 可接受：该功能主要面向 UI 使用，不暴露原始 JSON 给终端用户。

## Migration Plan

1. 部署后端新 API 端点（向后兼容，新增路由）
2. 部署前端变更（类型变更逻辑、值校验）
3. 首次打开含旧值的工作项时，控件自动清除不合法值并写回后端
4. 无需数据库迁移，无需停机
