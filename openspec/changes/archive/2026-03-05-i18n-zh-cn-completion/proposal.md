## Why

前端界面存在大量中文化不完整的问题：部分 UI 组件直接显示原始翻译 key（如 `workspace_settings.settings.extra_properties.title`、`project_members.full_name`），部分组件硬编码英文字符串而未使用 `t()` 函数。这些问题影响用户体验，需要系统性补全。

## What Changes

- 在 `packages/i18n/src/locales/zh-CN/translations.ts` 中补充约 60 个缺失的中文翻译 key
- 修复 `project-settings-member-defaults.tsx` 中 6 处硬编码英文字符串，改为使用 `t()` 翻译函数

具体缺失区域：

**翻译 key 补充**（仅修改翻译文件）：

- 顶层导航自定义 key：`customize_navigation`、`personal`、`accordion_navigation_control`、`horizontal_navigation_bar`、`show_limited_projects_on_sidebar`、`enter_number_of_projects`、`pin`、`unpin`、`sidebar.stickies`、`sidebar.your_work`
- `work_item_type`（顶层 key，工作项类型属性标签）
- `project_members.*`：成员表格 5 个列头（full_name、display_name、email、joining_date、role）
- `workspace_settings.settings.exports.*`：补充 heading、description、exporting_projects、format 4 个缺失 key
- `workspace_settings.settings.extra_properties.*`：完整的额外属性管理界面翻译（约 25 个 key）
- `project_settings.work_item_types.*`：工作项类型项目设置页面翻译（约 12 个 key）
- `project_settings.states.heading`/`description`、`project_settings.labels.heading`/`description`（4 个 key）

**组件代码修复**（修改组件 + 确保翻译 key 存在）：

- `project-settings-member-defaults.tsx` 中 "Project Lead"、"Default Assignee"、"Guest access" 及其描述文字改为 `t()` 调用

## Capabilities

### New Capabilities

无新能力，此变更为缺陷修复，不引入新功能。

### Modified Capabilities

- `i18n`：补充简体中文翻译文件，修复翻译 key 缺失问题

## Impact

- `packages/i18n/src/locales/zh-CN/translations.ts`：主要修改文件，补充约 60 个翻译 key
- `apps/web/core/components/project/project-settings-member-defaults.tsx`：改用 `t()` 函数，移除硬编码英文字符串
- 无 API 变更，无数据库变更，无破坏性变更
- 上游风险：`zh-CN/translations.ts` 为本项目自维护文件（上游也在更新），合并时可能需要手动 rebase；组件文件为上游文件，改动较小（仅替换字符串为 `t()` 调用），冲突风险低
