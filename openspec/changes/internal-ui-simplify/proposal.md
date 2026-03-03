## Why

Plane 作为公司内部项目管理平台部署时，面向的是已由管理员统一创建账户、统一分配工作空间的内部员工。当前界面默认英语、Onboarding 流程包含无关步骤（角色选择、使用场景问卷、工作空间创建）、登录页显示面向公众的服务条款和品牌推广内容，均与内部使用场景不符，需在系统正式上线前清理。

## What Changes

- **默认语言改为简体中文**：将 `FALLBACK_LANGUAGE` 常量从 `"en"` 改为 `"zh-CN"`，新用户首次访问（localStorage 无语言记录）即呈现中文界面
- **Onboarding 流程精简**：删除 Role Setup 和 UseCase Setup 两个调研步骤；Profile Setup 完成后若用户已有工作空间则直接完成引导；进度条仅反映 Profile Setup 一步
- **登录页清理**：
  - 删除登录/注册表单底部的 Terms of Service / Privacy Policy 同意文本
  - 删除登录页底部"Join 10,000+ teams building with Plane"品牌推广区块（含 Zerodha、Sony 等品牌 logo）

## Capabilities

### New Capabilities

无新增能力规格。

### Modified Capabilities

- `authentication`：登录页 UI 去掉面向公众的条款和品牌推广内容（行为变更：组件渲染结果改变）

## Impact

**前端文件（6 个）：**

- `packages/i18n/src/constants/language.ts` — 常量修改
- `apps/web/core/components/onboarding/root.tsx` — 流程逻辑简化
- `apps/web/core/components/onboarding/steps/root.tsx` — 删除 Role/UseCase case
- `apps/web/core/components/onboarding/header.tsx` — 步骤数计算调整
- `apps/web/core/components/account/auth-forms/auth-root.tsx` — 删除 TermsAndConditions
- `apps/web/core/components/auth-screens/footer.tsx` — 删除品牌推广内容

**上游冲突风险：中**（onboarding 和 auth 文件均为上游核心文件，后续 rebase 需注意）

**无后端改动，无数据库迁移，无 API 变更。**
