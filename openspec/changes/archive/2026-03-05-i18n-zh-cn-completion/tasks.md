## 1. 顶层导航相关 key 补充

- [x] 1.1 在 zh-CN 补充 `customize_navigation`、`personal`、`pin`、`unpin` 顶层 key
- [x] 1.2 在 zh-CN 补充 `accordion_navigation_control`、`horizontal_navigation_bar`、`show_limited_projects_on_sidebar`、`enter_number_of_projects` 顶层 key
- [x] 1.3 在 zh-CN 已有的 `sidebar` 对象中追加 `stickies`、`your_work` 子 key（已存在，跳过）

## 2. 工作项类型标签补充

- [x] 2.1 在 zh-CN 补充顶层 `work_item_type: "工作项类型"` key

## 3. 成员表格列头翻译补充

- [x] 3.1 在 zh-CN 补充 `project_members` 对象，包含 `full_name`、`display_name`、`email`、`joining_date`、`role` 5 个 key

## 4. 工作区设置导出页面翻译补充

- [x] 4.1 在 zh-CN `workspace_settings.settings.exports` 中追加 `heading`、`description`、`exporting_projects`、`format` 4 个缺失 key

## 5. 工作区额外属性设置翻译补充

- [x] 5.1 在 zh-CN `workspace_settings.settings` 中新增完整的 `extra_properties` 对象
- [x] 5.2 包含 title、page_label、description、add_property、empty_state、CRUD 结果提示等基础 key
- [x] 5.3 包含 `form.*` 子对象：label、key、type、description、options、add_option 等表单字段
- [x] 5.4 包含 `delete_modal.*` 子对象：title、description、warning

## 6. 项目设置工作项类型翻译补充

- [x] 6.1 在 zh-CN `project_settings` 中新增 `work_item_types` 对象
- [x] 6.2 包含 short_title、heading、description、set_as_default、no_types_available、task_cannot_be_disabled、issues_migrated 等 key
- [x] 6.3 包含 enabled_success、disabled_success、default_success 操作结果提示
- [x] 6.4 包含 `extra_properties.*` 子对象：bind_success、unbind_success、required、required_update_success、empty_state

## 7. 项目设置页面标题/描述补充

- [x] 7.1 在 zh-CN `project_settings.states` 中追加 `heading`、`description` key
- [x] 7.2 在 zh-CN `project_settings.labels` 中追加 `heading`、`description` key
- [x] 7.3 在 zh-CN `project_settings.estimates` 中追加 `heading`、`description`、`enable_description` key

## 8. 修复硬编码字符串（组件代码）

- [x] 8.1 在 `project-settings-member-defaults.tsx` 中将 "Project Lead" 改为 `t("project_settings.members.project_lead")`
- [x] 8.2 添加 `project_settings.members.select_project_lead_description` key 到 en 和 zh-CN，并在组件中使用
- [x] 8.3 在组件中将 "Default Assignee" 改为 `t("project_settings.members.default_assignee")`
- [x] 8.4 添加 `project_settings.members.select_default_assignee_description` key 到 en 和 zh-CN，并在组件中使用
- [x] 8.5 在组件中将 "Guest access" 改为调用合适的翻译 key（参考 `guest_super_permissions.title`）
- [x] 8.6 确认 "This will allow guests..." 描述文字使用 `t("project_settings.members.guest_super_permissions.sub_heading")`

## 9. 验证

- [x] 9.1 在浏览器中打开导航自定义弹窗，验证所有文字为中文（补充修复 accordion/horizontal navigation 描述文字）
- [x] 9.2 打开工作区设置 → 导出页面，验证标题和描述为中文 ✅ 2026-03-05
- [x] 9.3 打开工作区设置 → 额外属性页面，验证所有标签和按钮为中文 ✅ 2026-03-05
- [x] 9.4 打开工作区设置 → 成员页面，验证表格列头为中文 ✅ 2026-03-05
- [x] 9.5 打开项目设置 → 成员页面，验证 Project Lead/Default Assignee/Guest access 等为中文 ✅ 2026-03-05
- [x] 9.6 打开项目设置 → 工作项类型页面，验证所有文字为中文 ✅ 2026-03-05
- [x] 9.7 打开工作项侧边栏，验证"工作项类型"属性标签为中文 ✅ 2026-03-05
