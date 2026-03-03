## 1. 提交规格文档

- [ ] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）

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

- [ ] 5.1 将以上代码变更整理提交（`#FICC-9999# feat: 内部部署适配 - 默认中文 + Onboarding 精简`）

## 6. 用户验证

- [ ] 6.1 清除 localStorage 后访问 `http://localhost:3000`，确认界面默认为中文
- [ ] 6.2 以新用户身份登录，确认 Onboarding 只显示 Profile Setup 步骤，完成后直接进入主界面
- [ ] 6.3 登录页确认无 "By creating an account..." 服务条款文本
- [ ] 6.4 登录页确认无 "Join 10,000+ teams building with Plane" 品牌推广区块
- [ ] 6.5 已有语言设置的用户（localStorage 有 `userLanguage=en`）验证语言不被强制覆盖
