## Context

当前 zh-CN 翻译文件（`packages/i18n/src/locales/zh-CN/translations.ts`）比 en 翻译文件少约 186 行，缺少约 60 个翻译 key。这些 key 在组件中通过 `t("key.path")` 调用，未找到对应翻译时 i18next 会回退显示原始 key 字符串，直接暴露在 UI 界面上影响使用体验。

此外，`project-settings-member-defaults.tsx` 中存在 6 处硬编码英文字符串，对应的翻译 key 在 en 文件中已存在，但组件未调用 `t()`。

## Goals / Non-Goals

**Goals:**

- 补全 zh-CN 翻译文件中缺失的所有翻译 key
- 修复硬编码英文字符串，改为 `t()` 调用
- 不改变任何 UI 功能逻辑

**Non-Goals:**

- 不修改 en 翻译文件（en 已完整）
- 不修改其他语言的翻译文件
- 不重构翻译 key 的命名或结构
- 不修改 i18n 加载机制

## Decisions

**决策 1：只在 zh-CN 文件中追加 key，不重构文件结构**

zh-CN 文件的顶层结构与 en 文件略有差异（zh-CN 在 `sidebar.*` 下保存导航 key，en 在顶层）。这是历史遗留差异，本次修复不调整，只补充缺失的 key 到正确的层级位置，以最小化改动。

**决策 2：硬编码字符串修复策略**

`project-settings-member-defaults.tsx` 中：

- "Project Lead" → `t("project_settings.members.project_lead")`（zh-CN 已有 "项目负责人"）
- "Select the project lead for the project." → 补充 key `project_settings.members.select_project_lead_description`
- "Default Assignee" → `t("project_settings.members.default_assignee")`（zh-CN 已有 "默认受理人"）
- "Select the default assignee for the project." → 补充 key `project_settings.members.select_default_assignee_description`
- "Guest access" → `t("project_settings.members.guest_super_permissions.title")`（需确认与现有 key 一致）
- "This will allow guests to have view access to all the project work items." → `t("project_settings.members.guest_super_permissions.sub_heading")`

注：en 文件中 `project_settings.members.guest_super_permissions.title` = "Grant view access to all work items for guest users:"，与组件中显示的 "Guest access" 不完全匹配。决定：保留现有 en key 的 value，或为 en 补充更短的 key。需要实施时确认。

**决策 3：sidebar.stickies 和 sidebar.your_work 的处理**

en 文件末尾有 `sidebar: { stickies, your_work }`，而 zh-CN 在文件开头有一个完整的 `sidebar: { ... }` 对象包含所有导航 key。TypeScript 对象不允许重复 key，因此需要将 `stickies` 和 `your_work` 合并到 zh-CN 已有的 `sidebar` 对象中。

## Risks / Trade-offs

- **上游合并冲突**：翻译文件两侧都在持续更新，rebase 时需手动处理冲突 → 缓解：本次改动范围明确，仅追加 key，合并时保留双方新增即可
- **Guest access 标题不一致**：en 原文为完整句子，但组件显示 "Guest access" 更简短 → 缓解：实施时统一修改 en/zh-CN，或仅改组件 key 引用
- **翻译质量**：中文翻译由 AI 辅助生成，业务术语可能需要二次校对 → 缓解：实施后通过 UI 验证
