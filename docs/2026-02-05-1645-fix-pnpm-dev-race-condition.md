# 修复 pnpm dev 启动竞态条件

**日期**: 2026-02-05
**类型**: Bug 修复
**状态**: 已完成

## 目标

解决 `pnpm dev` 经常性启动失败的问题，错误信息为：

```
Failed to resolve entry for package "@plane/utils".
The package may have incorrect main/module/exports specified in its package.json.
```

## 问题分析

### tsdown.config.ts 的作用

`tsdown.config.ts` 是各 workspace 包的构建配置文件，控制 [tsdown](https://github.com/nicepkg/tsdown)（基于 rolldown 的 TypeScript 打包工具）的行为。每个包都有自己的配置文件，定义：

- **entry**: 入口文件路径
- **format**: 输出格式（ESM/CJS）
- **dts**: 是否生成类型声明文件
- **clean**: 构建前是否清空 `dist/` 目录（默认 `true`）
- **platform**: 目标平台
- **exports**: 是否自动更新 `package.json` 的 exports 字段

在本项目中，`tsdown` 同时承担两个角色：

- `pnpm build`（`tsdown`）：一次性构建，产生 `dist/` 输出
- `pnpm dev`（`tsdown --watch`）：监听模式，文件变化时增量重建

### 根因

Turbo 的 `dev` 任务配置如下（`turbo.json`）：

```json
"dev": {
  "cache": false,
  "dependsOn": ["^build"],
  "persistent": true
}
```

执行流程：

1. `^build` 先运行 —— 所有包的 `build` 任务完成，`dist/` 目录已存在
2. 所有 `dev` 任务**并发**启动

竞态条件发生在第 2 步：

```
时间线:
  t0: @plane/utils:dev 启动 → tsdown --watch → 清空 dist/ (Cleaning 4 files)
  t0: space:dev 启动 → react-router dev → 加载 vite.config.ts
  t1: space:dev 解析 import { joinUrlPath } from "@plane/utils"
      → 尝试读取 dist/index.js → 文件不存在（正在被清空）→ 错误！
  t2: @plane/utils:dev 重建完成 → dist/index.js 恢复（但已经晚了）
```

受影响的 vite 配置文件：

- `apps/space/vite.config.ts:6` — `import { joinUrlPath } from "@plane/utils"`
- `apps/admin/vite.config.ts:6` — 同上
- `apps/web/vite.config.ts` — 不受影响（未在配置中导入 workspace 包）

### 为什么是「经常性」而非「必然」

这是典型的竞态条件 —— 取决于各进程的启动时序。如果 `space:dev` 的 vite 配置加载恰好发生在 `@plane/utils:dev` 清空 `dist/` 的几百毫秒窗口内，就会失败。系统负载、缓存状态、CPU 调度都会影响触发概率。

## 修复方案

在所有 13 个 `tsdown.config.ts` 中添加条件 `clean` 配置：

```ts
clean: !process.argv.includes("--watch"),
```

效果：

- `pnpm build`（执行 `tsdown`，无 `--watch`）→ `clean: true`，正常清空重建
- `pnpm dev`（执行 `tsdown --watch`）→ `clean: false`，保留 `^build` 产生的 `dist/`

### 修改的文件

| 文件                                     | 说明                              |
| ---------------------------------------- | --------------------------------- |
| `packages/constants/tsdown.config.ts`    | 添加 clean 条件                   |
| `packages/decorators/tsdown.config.ts`   | 添加 clean 条件                   |
| `packages/editor/tsdown.config.ts`       | 添加 clean 条件                   |
| `packages/hooks/tsdown.config.ts`        | 添加 clean 条件                   |
| `packages/i18n/tsdown.config.ts`         | 添加 clean 条件                   |
| `packages/logger/tsdown.config.ts`       | 添加 clean 条件                   |
| `packages/propel/tsdown.config.ts`       | 添加 clean 条件                   |
| `packages/services/tsdown.config.ts`     | 添加 clean 条件                   |
| `packages/shared-state/tsdown.config.ts` | 添加 clean 条件                   |
| `packages/types/tsdown.config.ts`        | 添加 clean 条件                   |
| `packages/ui/tsdown.config.ts`           | 添加 clean 条件                   |
| `packages/utils/tsdown.config.ts`        | 添加 clean 条件                   |
| `apps/live/tsdown.config.ts`             | 修改已有 `clean: true` 为条件形式 |

## 经验教训与最佳实践

### 1. Monorepo 中 watch 模式不应清空构建产物

在 monorepo 中，包之间存在依赖关系。Watch 模式的 clean 操作会创建一个「dist 为空」的时间窗口，任何在此窗口内尝试解析该包的消费者都会失败。

**最佳实践**：Watch 模式应使用增量构建，不清空已有产物。Clean 操作仅在全量构建时执行。

### 2. Vite 配置文件中避免导入 workspace 包

`vite.config.ts` 在 dev server 启动前由 esbuild 编译执行。此时 workspace 包的构建产物可能尚未就绪。

**最佳实践**：

- vite 配置中仅导入外部 npm 包或 Node.js 内置模块
- 如需 workspace 包的功能，将简单工具函数直接内联到配置文件中
- 参考 `apps/web/vite.config.ts` 的做法 —— 不导入任何 workspace 包

### 3. 竞态条件的排查思路

当遇到「有时成功有时失败」的构建问题时：

1. 检查是否有并发任务存在资源竞争
2. 关注 `clean`/`rm` 等破坏性操作的时序
3. 在 turbo 日志中对比成功和失败时各任务的启动顺序
4. 检查 `turbo.json` 的 `dependsOn` 是否覆盖了所有必要的依赖关系

## 验证

修复后运行 `pnpm dev`，三个前端应用均成功启动：

```
admin:dev: ➜ Local: http://127.0.0.1:3001/god-mode/
web:dev:   ➜ Local: http://127.0.0.1:3000/
space:dev: ➜ Local: http://127.0.0.1:3002/spaces/
```

Watch 模式日志不再出现 `Cleaning X files`，确认 `clean: false` 生效。
