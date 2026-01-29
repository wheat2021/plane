# Docker 构建流量优化

**日期**: 2026-01-29
**状态**: 已完成

## Objective

减少项目 Docker 镜像构建过程中的**网络流量消耗**（按流量计费场景），充分利用 Docker 分层缓存和 BuildKit 缓存挂载，避免重复下载依赖。

### 问题分析

原始 Dockerfile 存在以下问题导致不必要的流量消耗：

| 问题                         | 影响                             | 位置               |
| ---------------------------- | -------------------------------- | ------------------ |
| `pip install --no-cache-dir` | 每次构建都重新下载所有 Python 包 | Dockerfile.api/dev |
| 未使用 BuildKit 缓存挂载     | 无法跨构建复用已下载的包         | Dockerfile.api/dev |

**前端 Dockerfile 已优化**：`Dockerfile.web` 已正确使用 `--mount=type=cache` 缓存 pnpm store。

**后端 Dockerfile 需优化**：`--no-cache-dir` 导致即使 Docker 层缓存命中，pip 也会重新下载。

## Approach

### Docker 分层缓存原理

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: FROM python:3.12-alpine     ← 基础镜像，很少变化    │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: RUN apk add ...             ← 系统包，很少变化      │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: COPY requirements.txt       ← 依赖声明              │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: RUN pip install             ← 依赖安装（缓存关键）  │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: COPY . .                    ← 代码，经常变化        │
└─────────────────────────────────────────────────────────────┘
```

**关键**：只要 requirements.txt 没变，Layer 4 会命中缓存，不会重新执行 pip install。

### BuildKit 缓存挂载

即使 requirements.txt 变化，使用 `--mount=type=cache` 可以复用已下载的包：

```dockerfile
# 优化前：每次下载所有包（~200MB）
RUN pip install -r requirements.txt --no-cache-dir

# 优化后：只下载新增/更新的包
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

## Development Log

### 09:00 - 初次分析（方向偏差）

最初误解需求为"加速构建"，添加了国内镜像源配置。虽然有用，但不是核心问题。

### 09:30 - 重新理解需求

用户核心诉求：**减少网络流量**（按流量计费），而非加速。

重新分析 Dockerfile：

- 分层顺序正确（requirements 在代码之前）
- 但使用了 `--no-cache-dir`，禁用了 pip 缓存

### 09:35 - 实施正确的优化

**修改 `Dockerfile.dev`**：

```dockerfile
# 优化前
RUN pip install -r requirements/local.txt --compile --no-cache-dir

# 优化后
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements/local.txt --compile
```

**修改 `Dockerfile.api`**：

```dockerfile
# 优化前（在一个 RUN 中）
pip install -r requirements.txt --compile --no-cache-dir

# 优化后（独立 RUN 使用缓存挂载）
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt --compile
```

**更新 `CLAUDE.md`**：重写流量优化章节，聚焦缓存机制说明。

## Summary

### 修改文件清单

| 文件                      | 修改     | 说明                                          |
| ------------------------- | -------- | --------------------------------------------- |
| `apps/api/Dockerfile.api` | 核心优化 | 使用 BuildKit 缓存挂载，移除 `--no-cache-dir` |
| `apps/api/Dockerfile.dev` | 核心优化 | 同上                                          |
| `CLAUDE.md`               | 文档更新 | 重写流量优化章节，聚焦缓存机制                |
| `.npmrc`                  | 可选配置 | 添加国内镜像源（注释状态）                    |
| `docker-compose*.yml`     | 辅助配置 | 支持 pip 镜像源环境变量传递                   |

### 流量消耗对比

| 场景                      | 优化前             | 优化后                |
| ------------------------- | ------------------ | --------------------- |
| 首次构建                  | ~800MB             | ~800MB（无法避免）    |
| 代码变更后构建            | ~0MB               | ~0MB（Docker 层缓存） |
| requirements.txt 新增包   | ~200MB（全部重下） | 仅新增包大小          |
| requirements.txt 更新版本 | ~200MB（全部重下） | 仅更新包大小          |

### 正确的构建命令

```bash
# ✅ 正常构建（使用缓存）
docker compose -f docker-compose-local.yml up --build

# ✅ 重建单个服务
docker compose -f docker-compose-local.yml build api

# ❌ 避免使用（会忽略所有缓存）
docker compose build --no-cache
```

### 设计决策

1. **优先利用 Docker 原生缓存**：分层顺序 + BuildKit 缓存挂载
2. **移除 `--no-cache-dir`**：让 pip 使用本地缓存目录
3. **国内镜像作为可选**：减少流量靠缓存，加速下载靠镜像，两者独立
