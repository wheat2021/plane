## REMOVED Requirements

### Requirement: 登录页服务条款声明

**Reason**: 内部部署场景不面向公众用户，无需显示服务条款同意文本
**Migration**: 直接删除 `<TermsAndConditions>` 渲染调用（`auth-root.tsx:120`），组件文件保留

### Requirement: 登录页品牌推广区块

**Reason**: "Join 10,000+ teams building with Plane" 及品牌 logo 不适合内部系统界面
**Migration**: 将 `AuthFooter` 组件返回 `null`

## ADDED Requirements

### Requirement: 默认界面语言为简体中文

系统 SHALL 在用户无语言偏好记录（localStorage 无 `userLanguage` key）时，默认以简体中文（`zh-CN`）呈现所有界面文本。

#### Scenario: 首次访问时语言默认为中文

- **WHEN** 用户首次打开 Plane（localStorage 中无 `userLanguage` 记录）
- **THEN** 系统 SHALL 以 `zh-CN` 渲染界面

#### Scenario: 已保存语言偏好不受影响

- **WHEN** 用户 localStorage 中已有 `userLanguage=en` 等记录
- **THEN** 系统 SHALL 读取该记录，以保存的语言渲染界面（不强制覆盖）

### Requirement: Onboarding 仅包含 Profile Setup 步骤

新用户完成 Profile Setup（设置姓名和初始密码）后，系统 SHALL 直接完成引导流程，不再展示角色选择（Role Setup）和使用场景问卷（UseCase Setup）步骤。

#### Scenario: Profile Setup 完成后直接结束引导

- **WHEN** 用户提交 Profile Setup 表单
- **THEN** 系统 SHALL 调用 `finishOnboarding()` 结束引导
- **THEN** 系统 SHALL NOT 跳转至 Role Setup 步骤

#### Scenario: 工作空间缺失时的行为

- **WHEN** 用户 Profile Setup 完成但未被分配到任何工作空间
- **THEN** 系统 SHALL 同样调用 `finishOnboarding()`（由管理员负责工作空间分配，不在引导流程中处理）
