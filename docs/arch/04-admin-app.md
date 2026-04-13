# 04 · Admin App 架构

> **路径**: `apps/admin/`  
> **技术栈**: TypeScript · React · React Router · Tailwind CSS  
> **节点规模**: 88 nodes  
> **端口**: 3001（God Mode）

---

## 1. 定位与职责

Admin App 是 Plane 的**实例管理界面**（God Mode），面向自托管部署的管理员：

- 配置认证方式（Email/OAuth providers）
- 管理实例许可证和设置
- 配置 SMTP、AI、存储等系统设置
- 管理工作区和用户

访问路径：`http://localhost:3001/god-mode/`

---

## 2. 目录结构

```
apps/admin/
├── app/
│   └── (all)/
│       └── (dashboard)/        # 认证后仪表板
│           ├── authentication/ # 认证配置页面
│           │   ├── github/     # GitHub OAuth 配置
│           │   │   └── form.tsx ← 81 edges（第3高）
│           │   ├── google/
│           │   ├── gitlab/
│           │   └── email/
│           └── sidebar.tsx     ← 66 edges（侧边导航）
├── core/
│   ├── hooks/
│   │   ├── use-sidebar-menu/
│   │   │   └── types.ts        ← 691 edges（全项目最高！所有服务中）
│   │   └── store/
│   │       └── use-workspace.tsx ← 35 edges
│   ├── providers/
│   │   └── toast.tsx           ← 147 edges（通知系统）
│   └── components/
│       ├── common/
│       │   └── empty-state.tsx ← 41 edges
│       ├── workspace/
│       │   └── list-item.tsx   ← 21 edges
│       └── instance/
│           └── setup-form.tsx  ← 10 edges（首次安装配置）
└── app/(home)/                 # 管理员登录页面
    ├── sign-in-form.tsx
    └── auth-helpers.tsx
```

---

## 3. 为何 types.ts 有 691 edges（全项目最高）？

`admin/core/hooks/use-sidebar-menu/types.ts`：

这是侧边导航菜单的**类型定义文件**，定义了导航项的接口。由于 Admin 所有页面都需要渲染侧边导航，所有组件都 import 这个类型文件。这是一个典型的"广播式类型文件"现象——一个 `.ts` 文件中定义了多个广泛使用的接口。

---

## 4. 认证配置体系

Admin 的核心功能是配置认证：

```
认证配置页面
├── Email 认证（邮箱/密码、魔法链接）
├── GitHub OAuth
├── Google OAuth
├── GitLab OAuth
└── SAML SSO（企业版）

每个认证方式对应:
├── form.tsx        ← 配置表单（如 github/form.tsx，81 edges）
├── index.tsx       ← 页面入口
└── 通过 API 保存到 InstanceConfiguration 模型
```

---

## 5. Toast 通知系统

`admin/core/providers/toast.tsx`（147 edges）：

- Admin 的全局通知提供者（成功/错误/警告消息）
- 被所有页面的操作回调引用
- 使用 React Context 注入

---

## 6. 与 API 的交互

Admin 主要与 `api/plane/license/` 模块交互：

```
Admin App
    ↓ HTTP
/god-mode/ API 路由
    ↓
api/plane/license/api/views/
├── InstanceAdminEndpoint        ← 实例管理员 CRUD
├── InstanceAdminSignInEndpoint  ← 管理员登录
├── InstanceAdminSignUpEndpoint  ← 首次注册
└── InstanceAdminUserMeEndpoint  ← 当前管理员信息
```

序列化器：

- `InstanceAdminSerializer`
- `InstanceAdminMeSerializer`

---

## 7. 与其他服务的关系

```
admin ↔ web:   891 edges（主要是共享 UI 组件和类型）
admin ↔ space: 191 edges（共享布局/导航组件）
admin ↔ api:    38 edges（API 调用类型共享）
admin ↔ live:    9 edges（极少，仅类型引用）
```

---

## 阅读建议

1. 读 `admin/app/(home)/sign-in-form.tsx` → 理解管理员登录流程
2. 读 `admin/app/(all)/(dashboard)/sidebar.tsx` → 理解导航结构
3. 读 `admin/app/(all)/(dashboard)/authentication/github/form.tsx` → 理解 OAuth 配置流程
4. 读 `admin/core/providers/toast.tsx` → 理解通知系统
