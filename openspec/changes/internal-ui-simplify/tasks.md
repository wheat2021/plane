## 1. 提交规格文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）

## 2. 默认语言改为中文

- [x] 2.1 [UPSTREAM-RISK] `packages/i18n/src/constants/language.ts`：将 `FALLBACK_LANGUAGE` 从 `"en"` 改为 `"zh-CN"`

## 3. Onboarding 流程精简

- [x] 3.1 [UPSTREAM-RISK] `apps/web/core/components/onboarding/root.tsx`：`handleStepChange` 中 `PROFILE_SETUP` case 改为直接调用 `finishOnboarding()`，删除 Role/UseCase/Workspace/Invite 的跳转逻辑
- [x] 3.2 [UPSTREAM-RISK] `apps/web/core/components/onboarding/steps/root.tsx`：删除 `ROLE_SETUP` 和 `USE_CASE_SETUP` 的 `case` 分支
- [x] 3.3 [UPSTREAM-RISK] `apps/web/core/components/onboarding/header.tsx`：进度条总步数固定为 `1`，`getCurrentStepNumber` 直接返回 `1`

## 4. 登录页清理

- [x] 4.1 [UPSTREAM-RISK] `apps/web/core/components/account/auth-forms/auth-root.tsx`：删除 `<TermsAndConditions>` 渲染调用及其 import
- [x] 4.2 [UPSTREAM-RISK] `apps/web/core/components/auth-screens/footer.tsx`：`AuthFooter` 函数返回 `null`

## 5. 提交代码

- [x] 5.1 将以上代码变更整理提交（`#FICC-9999# feat: 内部部署适配 - 默认中文 + Onboarding 精简`）

## 6. 残留英文修复

- [x] 6.1 添加 `sidebar.stickies` 翻译键到 zh-CN（"便签"）
- [x] 6.2 侧边栏 "More"/"Hide" 按钮改用 `t("more")`/`t("hide")`
- [x] 6.3 Stickies 页面标题和 "Add sticky" 按钮改用 i18n
- [x] 6.4 `ProjectFeatureBreadcrumb` 改用 `t(i18n_key)` 替代硬编码 `name`
- [x] 6.5 所有项目子页面 header 面包屑（Work Items、Cycles、Modules、Views、Pages、Intake、Archives）改用 i18n
- [x] 6.6 工作项数量 tooltip 改用 i18n
- [x] 6.7 添加 `more`、`hide`、`archived`、`add_page` 翻译键到 en 和 zh-CN

## 7. 用户验证

- [ ] 7.1 清除 localStorage 后访问 `http://localhost:3000`，确认界面默认为中文
- [ ] 7.2 以新用户身份登录，确认 Onboarding 只显示 Profile Setup 步骤，完成后直接进入主界面
- [ ] 7.3 登录页确认无 "By creating an account..." 服务条款文本
- [ ] 7.4 登录页确认无 "Join 10,000+ teams building with Plane" 品牌推广区块
- [ ] 7.5 确认侧边栏 "便签"、"更多"/"收起" 显示为中文
- [ ] 7.6 确认项目子页面标题（工作项、周期、模块、视图、页面、收集、归档）显示为中文
