## ADDED Requirements

### Requirement: Display 面板额外属性选择器

Views 的 Display 面板 SHALL 包含一个 "Extra Properties" 分区，允许用户选择要显示的额外属性。

#### Scenario: 显示额外属性选择器

- **WHEN** 用户打开 Views 的 Display 面板
- **THEN** 面板 SHALL 在 Display Properties 区域下方显示 "Extra Properties" 分区
- **AND** 分区标题 SHALL 可折叠/展开

#### Scenario: 列出工作空间的所有额外属性

- **WHEN** "Extra Properties" 分区展开
- **THEN** SHALL 显示当前工作空间定义的所有额外属性配置
- **AND** 每个属性 SHALL 以按钮形式显示，样式与系统属性选择器一致

#### Scenario: 切换额外属性显示状态

- **WHEN** 用户点击某个额外属性按钮
- **THEN** 该属性的显示状态 SHALL 切换（开/关）
- **AND** 选中状态 SHALL 以高亮背景表示

### Requirement: 额外属性显示配置持久化

视图的额外属性显示配置 SHALL 与视图一起保存。

#### Scenario: 保存额外属性显示配置

- **WHEN** 用户在 Display 面板中选择额外属性
- **THEN** 配置 SHALL 作为 `extra_display_properties` 字段保存到视图数据中
- **AND** 字段格式 SHALL 为 `Record<string, boolean>`，key 为属性 config ID

#### Scenario: 加载额外属性显示配置

- **WHEN** 用户打开一个已保存的视图
- **THEN** Display 面板 SHALL 恢复之前保存的额外属性选择状态

### Requirement: List 布局额外属性渲染

List 视图布局 SHALL 在工作项行中显示选中的额外属性。

#### Scenario: 渲染有效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型已绑定该属性
- **THEN** 该属性 SHALL 以可编辑控件形式显示
- **AND** 控件样式 SHALL 与系统属性控件保持一致

#### Scenario: 渲染无效的额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** 当前工作项的类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用状态显示
- **AND** 鼠标悬停 SHALL 显示提示 "此属性对当前工作项类型不可用"

#### Scenario: 属性位置一致性

- **WHEN** 列表中有多个不同类型的工作项
- **THEN** 额外属性 SHALL 在所有行中保持相同的列位置
- **AND** 无效属性显示为灰色占位而非隐藏

### Requirement: Kanban 布局额外属性渲染

Kanban 视图布局 SHALL 在卡片中显示选中的额外属性。

#### Scenario: 卡片中渲染额外属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型已绑定该属性
- **THEN** 该属性 SHALL 在卡片的属性区域显示

#### Scenario: 卡片中渲染无效属性

- **WHEN** 某个额外属性被选中显示
- **AND** Kanban 卡片对应的工作项类型未绑定该属性
- **THEN** 该属性 SHALL 以灰色禁用样式显示

### Requirement: Spreadsheet 布局额外属性渲染

Spreadsheet 视图布局 SHALL 支持额外属性列。

#### Scenario: 添加额外属性列

- **WHEN** 某个额外属性被选中显示
- **THEN** Spreadsheet SHALL 在表格中添加对应的列
- **AND** 列标题 SHALL 显示属性的 label

#### Scenario: 编辑有效属性单元格

- **WHEN** 用户点击某个有效额外属性的单元格
- **THEN** 单元格 SHALL 进入编辑模式
- **AND** 根据属性类型显示相应的编辑控件

#### Scenario: 无效属性单元格

- **WHEN** 某行工作项的类型未绑定该额外属性
- **THEN** 该单元格 SHALL 显示为灰色不可编辑状态

### Requirement: 额外属性值更新

用户 SHALL 能够在视图中直接编辑额外属性值。

#### Scenario: 更新属性值

- **WHEN** 用户在视图中修改某个额外属性的值
- **THEN** 系统 SHALL 调用工作项更新 API 保存新值
- **AND** UI SHALL 乐观更新显示

#### Scenario: 更新失败回滚

- **WHEN** 属性值更新 API 调用失败
- **THEN** UI SHALL 回滚到之前的值
- **AND** SHALL 显示错误提示

### Requirement: 类型信息化 interface 扩展

TypeScript 类型定义 SHALL 扩展以支持额外属性显示配置。

#### Scenario: IIssueDisplayProperties 扩展

- **WHEN** 视图需要存储额外属性显示配置
- **THEN** 视图相关类型 SHALL 包含 `extra_display_properties?: Record<string, boolean>` 字段

#### Scenario: 视图 API 响应类型

- **WHEN** 视图 API 返回数据
- **THEN** 响应类型 SHALL 包含 `extra_display_properties` 字段

## Technical Implementation Details

本节记录实际实现中的关键技术细节，以确保文档与代码保持一致。

### Backend 数据库迁移

#### 迁移文件

- `0073_add_extra_display_properties_to_project_user_property.py`: 为 `ProjectUserProperty` 模型添加 `extra_display_properties` 字段
- `0074_add_extra_display_properties_to_issue_view.py`: 为 `IssueView` 模型添加 `extra_display_properties` 字段

#### 字段定义

```python
extra_display_properties = models.JSONField(default=dict, blank=True)
```

### Frontend 数据流传递

#### List Layout 数据流

```
BaseListRoot
  → ListLayout
    → ListGroup / IssuesLoader
      → IssueBlockRoot
        → IssueBlock
          → AllIssueProperties
            → WorkItemLayoutAdditionalProperties
```

**关键修改文件:**

- `base-list-root.tsx`: 获取 `extraDisplayProperties` 并传递
- `default.tsx`: 添加 `extraDisplayProperties` 到 `IListLayout` 接口
- `list-group.tsx`: 传递到 `IssuesLoader`
- `blocks-list.tsx`: 传递到 `IssueBlockRoot`
- `block-root.tsx`: 传递到 `IssueBlock`
- `block.tsx`: 传递到 `AllIssueProperties`
- `all-properties.tsx`: 传递到 `WorkItemLayoutAdditionalProperties`

#### Kanban Layout 数据流

```
BaseKanBanRoot
  → KanBanView (default.tsx)
    → KanbanGroup
      → KanbanIssueBlocksList
        → KanbanIssueBlock
          → KanbanIssueDetailsBlock
            → IssueProperties
              → WorkItemLayoutAdditionalProperties
```

**关键修改文件:**

- `base-kanban-root.tsx`: 获取并传递 `extraDisplayProperties`
- `default.tsx`: 添加到 `IKanBan` 接口，传递到 `KanbanGroup`
- `kanban-group.tsx`: 传递到 `KanbanIssueBlocksList`
- `blocks-list.tsx`: 传递到 `KanbanIssueBlock`
- `block.tsx`: 传递到 `KanbanIssueDetailsBlock` 和 `IssueProperties`

#### Kanban Swimlanes 数据流

```
KanBanSwimLanes
  → SubGroupSwimlane
    → KanBan (default.tsx)
      → (继续 Kanban 标准流程)
```

**关键修改文件:**

- `swimlanes.tsx`: 添加到所有相关接口 (`IKanBanSwimLanes`, `ISubGroupSwimlane`, `ISubGroupSwimlaneHeader`)

#### Spreadsheet Layout 数据流

```
BaseSpreadsheetRoot
  → SpreadsheetView
    → SpreadsheetTable
      → SpreadsheetHeader (列头)
      → SpreadsheetIssueRow (数据行)
        → IssueRowDetails
          → (为每个 extra property 渲染独立列)
```

**关键修改文件:**

- `base-spreadsheet-root.tsx`: 获取并传递 `extraDisplayProperties`
- `spreadsheet-view.tsx`: 传递到 `SpreadsheetTable`
- `spreadsheet-table.tsx`: 传递到 `SpreadsheetHeader` 和 `SpreadsheetIssueRow`
- `spreadsheet-header.tsx`: 为每个 extra property 创建列头
- `issue-row.tsx`: 为每个 extra property 创建单元格

### Spreadsheet 实现详情

#### 列头渲染

**组件**: `SpreadsheetHeader`

**逻辑**:

1. 使用 `useExtraPropertyConfig()` hook 获取 `getConfigById`
2. 从 `extraDisplayProperties` 中筛选选中的配置 ID
3. 为每个选中的 extra property 创建 `<th>` 元素
4. 列头显示配置的 `label` 属性

**代码位置**: `spreadsheet-header.tsx` 第 86-105 行

#### 数据单元格渲染

**组件**: `IssueRowDetails`

**逻辑**:

1. 导入 `useExtraPropertyConfig` 和 `useIssueTypeExtraProperty` hooks
2. 计算 `validConfigIds`: 获取当前 issue 的 work item type 支持的 extra property 配置 ID 集合
3. 为每个选中的 extra property:
   - 判断 `isValid = validConfigIds.size === 0 || validConfigIds.has(configId)`
   - 如果 `!isValid`: 显示灰色的 "—" 占位符
   - 如果 `isValid`: 使用 `CompactExtraPropertyControl` 渲染可编辑控件

**验证逻辑特殊处理**:

- 当 `validConfigIds.size === 0` 时，表示该 work item type 没有设置属性限制，允许所有 extra properties 显示
- 这确保了大部分 issue 都能正常显示和编辑 extra properties

**代码位置**: `issue-row.tsx` 第 248-265, 415-444 行

### 紧凑型控件实现

#### 组件架构

- `CompactExtraPropertyControl`: 统一入口组件，根据 `config.field_type` 分发到具体控件
- `CompactTextControl`: 文本类型属性控件
- `CompactSelectControl`: 单选/多选属性控件
- `CompactCheckboxControl`: 布尔类型属性控件

**目录**: `apps/web/core/components/issues/extra-properties/compact-controls/`

#### 使用场景

这些紧凑型控件专为 List、Kanban、Spreadsheet 布局设计，提供：

- 更小的占用空间
- 一致的视觉风格
- 点击即编辑的交互体验

### Filter Store 更新机制

#### 持久化逻辑

**文件**: `apps/web/core/store/issue/project-views/filter.store.ts`

**关键代码** (第 326-335 行):

```typescript
case EIssueFilterType.EXTRA_DISPLAY_PROPERTIES:
  const newExtraDisplayProperties = {
    ...this.filters.extraDisplayProperties,
    ...filters,
  };
  runInAction(() => {
    set(this.filters, "extraDisplayProperties", newExtraDisplayProperties);
  });
  this.issueViewService.patchView(workspaceSlug, projectId, viewId, {
    extra_display_properties: newExtraDisplayProperties,
  });
  break;
```

#### 涉及的 Store

所有 issue filter stores 都已扩展以支持 `extraDisplayProperties`:

- `ProjectViewIssuesFilter` (project-views/filter.store.ts)
- `ProjectIssueFilter` (project/filter.store.ts)
- `CycleIssueFilter` (cycle/filter.store.ts)
- `ModuleIssueFilter` (module/filter.store.ts)

### 国际化 (i18n)

#### 新增翻译键

**文件**: `packages/i18n/src/locales/*/translations.ts`

```json
{
  "issue": {
    "display": {
      "extra_properties": {
        "label": "Extra Properties",
        "not_available": "This property is not available for the current work item type"
      }
    }
  }
}
```

**支持语言**: en, zh-CN, zh-TW

### 性能优化考虑

#### useMemo 使用

在 `IssueRowDetails` 组件中使用 `useMemo` 缓存 `validConfigIds` 计算：

```typescript
const validConfigIds = useMemo(() => {
  if (!projectId || !issueDetail.type_id) return new Set<string>();
  return new Set(getConfigIdsByIssueType(projectId.toString(), issueDetail.type_id));
}, [projectId, issueDetail.type_id, getConfigIdsByIssueType]);
```

这避免了每次渲染都重新计算 issue type 的有效属性集合。
