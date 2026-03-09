## 1. 提交变更文档

- [ ] 1.1 提交 OpenSpec 变更文档（proposal, specs, design）

## 2. 功能实现

- [ ] 2.1 修改 `apps/web/core/components/navigation/top-nav-power-k.tsx`，引入 `useTranslation` 并应用到 placeholder。
- [ ] 2.2 在 `packages/i18n/locales/zh/common.json` 中添加 `"search_commands": "搜索命令..."`。
- [ ] 2.3 在 `packages/i18n/locales/en/common.json` 中添加 `"search_commands": "Search commands..."`。

## 3. 提交实现代码

- [ ] 3.1 提交代码实现：`#FICC-9999# fix: 接入 i18n 修复 Power-K 搜索框 placeholder 硬编码问题`

## 4. 用户验证

- [ ] 4.1 **验证中文翻译**：切换语言为中文，确认 Power-K 搜索框显示“搜索命令...”。
- [ ] 4.2 **验证英文翻译**：切换语言为英文，确认显示“Search commands...”。
