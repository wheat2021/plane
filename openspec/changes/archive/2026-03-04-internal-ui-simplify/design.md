## Context

Plane 前端 i18n 使用 MobX `TranslationStore` 管理语言状态，初始化时先读 `localStorage["userLanguage"]`，无记录则回退 `FALLBACK_LANGUAGE`（目前为 `"en"`）。Onboarding 流程由 `OnboardingRoot` 驱动，通过 `EOnboardingSteps` 枚举控制步骤顺序，共5步（Profile → Role → UseCase → Workspace → Invite）。登录页 `auth-root.tsx` 渲染表单后固定追加 `<TermsAndConditions>`，`footer.tsx` 渲染品牌推广区块。

## Goals / Non-Goals

**Goals:**

- 首次访问默认中文（无 localStorage 记录时）
- Onboarding 仅保留 Profile Setup，完成后直接结束
- 登录页移除服务条款文本和品牌推广内容
- 改动最小化，不影响现有功能（语言切换、工作空间逻辑等）

**Non-Goals:**

- 不修改 Role/UseCase 组件本身（仅从流程中移除）
- 不删除 `TermsAndConditions` 文件（仅从渲染处移除引用）
- 不改动后端或 API
- 不重构 i18n 架构

## Decisions

### 决策 1：修改 `FALLBACK_LANGUAGE` 常量而非探测浏览器语言

**选项 A（选用）**：`FALLBACK_LANGUAGE = "zh-CN"`
**选项 B**：在 `initializeLanguage()` 中加入 `navigator.language` 检测逻辑

选用 A，原因：改动范围最小（1行），行为可预期（固定中文），与内部部署场景完全匹配。选项 B 增加逻辑复杂度且对内部用户无收益（内部用户均为中文环境）。

### 决策 2：Onboarding 在 Profile Setup 后直接 `finishOnboarding()`

**位置**：`onboarding/root.tsx` 的 `handleStepChange` 函数

当前逻辑：

```
PROFILE_SETUP → ROLE_SETUP → USE_CASE_SETUP → (有工作空间?) finishOnboarding : WORKSPACE_CREATE
```

修改后：

```
PROFILE_SETUP → finishOnboarding()
```

同步移除：

- `steps/root.tsx` 中 Role/UseCase 的 `case` 分支
- `header.tsx` 中进度条总步数（`totalSteps`），从动态计算改为固定 `1`，`getCurrentStepNumber` 直接返回 `1`

保留 `EOnboardingSteps` 枚举定义（避免影响类型系统和其他潜在使用处）。

### 决策 3：直接删除 `<TermsAndConditions>` 渲染调用

**位置**：`auth-forms/auth-root.tsx` 第 120 行

仅移除组件调用，不删除组件文件，上游合并时减少冲突面积。

### 决策 4：清空 `AuthFooter` 内容而非删除组件

**位置**：`auth-screens/footer.tsx`

将 `AuthFooter` 返回 `null`（或返回空 fragment），不删除组件定义，因为 `auth-base.tsx` 引用了它。

## Risks / Trade-offs

| 风险                                                           | 缓解措施                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| 上游 rebase 冲突（onboarding/auth 为上游核心文件）             | 改动最小化；记录在 changelog 中，rebase 时优先处理这几个文件 |
| `EOnboardingSteps.ROLE_SETUP` 等枚举值留存可能让后续开发者困惑 | 在 `root.tsx` 中加注释说明这些步骤已被禁用                   |
| 语言切换功能不受影响（用户仍可在 preferences 中切换到英文）    | 无需额外处理，`setLanguage()` 逻辑不变                       |

## Migration Plan

1. 合并代码后重新构建前端（`pnpm build` 或 docker compose 重建 web 镜像）
2. 已登录用户 localStorage 中若有 `userLanguage=en` 记录，语言不会自动切换——用户需手动在 preferences 中改语言，或清除 localStorage
3. 无需数据库迁移，无需重启后端
4. 回滚：将 `FALLBACK_LANGUAGE` 改回 `"en"` 并恢复删除的渲染调用
