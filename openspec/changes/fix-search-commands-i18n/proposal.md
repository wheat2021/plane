## Why

当前顶部导航栏的 Power-K 搜索框（Command Palette）中的 placeholder 文本 "Search commands..." 是硬编码的，没有接入国际化系统。这导致即使用户切换到中文界面，搜索框依然显示英文，影响用户体验的一致性。

## What Changes

- 将 `TopNavPowerK` 组件中的硬编码字符串 `"Search commands..."` 替换为 i18n 翻译函数调用。
- 在相关的翻译文件（中英文）中添加 `search_commands` 对应的翻译键值对。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- 无（仅为现有功能的 i18n 优化）

## Impact

- `apps/web/core/components/navigation/top-nav-power-k.tsx`: 引入 `useTranslation` 钩子并应用。
- `packages/i18n/locales/en/common.json` (或相应路径): 添加英文翻译。
- `packages/i18n/locales/zh/common.json` (或相应路径): 添加中文翻译。
- 无上游同步风险，仅涉及文本翻译。
