## Context

当前 Plane 视图系统支持通过 Display Properties 面板控制系统属性（State、Priority、Assignee 等）在 List、Kanban、Spreadsheet 等布局中的显示/隐藏。工作空间已支持定义额外属性（Extra Properties），并可通过 `IssueTypeExtraProperty` 绑定到项目级别的特定工作项类型。

现有架构：

- `IIssueDisplayProperties` 是固定的静态类型，包含 `assignee`、`priority` 等布尔属性
- `FilterDisplayProperties` 组件读取 `ISSUE_DISPLAY_PROPERTIES` 常量渲染属性选择器
- `IssueProperties` / `WorkItemLayoutAdditionalProperties` 在各布局中渲染属性
- 工作项的额外属性值存储在 `TIssue.extra_properties` 字段
- `IssueTypeExtraPropertyStore` 管理项目+类型级别的属性绑定

约束：

- 需要保持与上游 Plane 代码的兼容性，尽量使用扩展点而非修改核心类型
- 额外属性的有效性取决于工作项类型，不同类型可能绑定不同的属性

## Goals / Non-Goals

**Goals:**

- 在 Views Display 面板中新增额外属性选择区域
- 额外属性与系统属性以统一视觉风格显示
- 对于当前工作项类型未绑定的属性，显示为灰色不可操作状态
- 支持在 List、Kanban、Spreadsheet 布局中显示选中的额外属性

**Non-Goals:**

- 不修改 Gantt 和 Calendar 视图（空间有限）
- 不支持按额外属性分组或排序（需要后端支持）
- 不修改核心 `IIssueDisplayProperties` 类型定义

## Decisions

### Decision 1: 额外属性显示配置的存储方式

**选择**: 在 `IIssueDisplayProperties` 旁边新增 `extraDisplayProperties: Record<string, boolean>` 字段

**备选方案**:

- A) 扩展 `IIssueDisplayProperties` 类型添加动态属性 → 破坏 TypeScript 类型安全
- B) 使用独立的 display properties 字段 → **选择此方案**，不影响核心类型

**理由**: 保持核心类型不变，降低上游同步风险。额外属性配置单独存储，便于管理。

### Decision 2: 属性有效性判断机制

**选择**: 在渲染时根据工作项的 `type_id` 查询 `IssueTypeExtraPropertyStore.getBindings()`

**备选方案**:

- A) 在每个工作项上预计算有效属性列表 → 数据冗余，更新复杂
- B) 渲染时动态查询绑定关系 → **选择此方案**，利用现有 store 缓存

**理由**: 绑定数据已通过 store 缓存，动态查询性能可接受，且保持数据单一来源。

### Decision 3: UI 扩展点选择

**选择**: 扩展 `WorkItemLayoutAdditionalProperties` 组件（CE 扩展点）

**备选方案**:

- A) 修改 `IssueProperties` 核心组件 → 上游同步风险高
- B) 使用 CE 扩展点 `WorkItemLayoutAdditionalProperties` → **选择此方案**

**理由**: `WorkItemLayoutAdditionalProperties` 已作为扩展点预留在 `IssueProperties` 中，专门用于添加额外属性渲染。

### Decision 4: Display 面板的额外属性选择器位置

**选择**: 在现有 Display Properties 区域下方新增 "Extra Properties" 分区

**理由**: 与现有 UI 保持一致的层级结构，用户易于理解。使用 `FilterHeader` 组件保持可折叠行为。

## Risks / Trade-offs

**[风险] 属性绑定数据可能未预加载**
→ 在 Display 面板打开时触发 `fetchBindings`，确保数据可用

**[风险] 列表视图中不同工作项类型的属性列不对齐**
→ 显示为灰色禁用状态而非隐藏，保持列对齐

**[风险] 额外属性配置变更后视图显示不同步**
→ 利用 MobX 响应式更新，配置变更自动反映在 UI

**[Trade-off] 性能 vs 实时性**
→ 使用 store 缓存减少 API 调用，接受短暂的数据不一致窗口

## 数据流

```
Display Panel
    │
    ├─→ ExtraPropertyConfigStore.getConfigsByWorkspace()  // 获取所有可选属性
    │
    └─→ User selects properties
            │
            ├─→ Update view.extraDisplayProperties
            │
            └─→ Save to backend (view API)

Issue Row Rendering
    │
    ├─→ Read view.extraDisplayProperties  // 获取选中的额外属性
    │
    ├─→ IssueTypeExtraPropertyStore.getBindings(projectId, issue.type_id)  // 获取有效绑定
    │
    ├─→ For each selected extra property:
    │       ├─→ If bound to type → render editable control
    │       └─→ If not bound → render disabled/grey
    │
    └─→ Read issue.extra_properties[key]  // 获取当前值
```
