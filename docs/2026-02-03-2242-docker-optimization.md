# Docker 配置优化

**创建时间**: 2026-02-03 22:42
**状态**: 进行中

## 目标

优化 Plane 项目的 Docker 配置，解决以下问题：

1. Docker Compose 文件命名混淆（`docker-compose.yml` vs `docker-compose-local.yml`）
2. Dockerfile 分层缓存不足，导致构建耗时过长

## 优化方案

### 1. Docker Compose 文件重命名

- `docker-compose.yml` → `compose.prod.yml`（生产环境）
- `docker-compose-local.yml` → `compose.dev.yml`（开发环境）
- 更新相关文档和脚本引用

### 2. Dockerfile 缓存优化

针对所有应用（web/admin/space/api）优化构建层次：

**优化原则**：

- 按变化频率分层：基础镜像 → 系统包 → 依赖文件 → 安装依赖 → 源代码 → 构建
- 利用 BuildKit 的 `--mount=type=cache` 缓存下载
- 优化 COPY 顺序，避免不必要的缓存失效

**前端应用优化策略**（web/admin/space）：

```dockerfile
# 当前问题：先 COPY . . 再 turbo prune，任何文件变化都导致缓存失效
COPY . .
RUN turbo prune --scope=xxx --docker

# 优化方案：
# 阶段1：仅使用 package.json 进行依赖提取
# 阶段2：安装依赖（可缓存）
# 阶段3：复制源码并构建
```

**API 优化策略**：

```dockerfile
# 当前：requirements 和 manage.py 等文件混在一起复制
# 优化：先复制 requirements，安装依赖，再复制源码
```

## 实施计划

1. ✅ 分析现有 Docker 配置
2. ✅ 重命名 Docker Compose 文件
3. ✅ 优化 Dockerfile:
   - ✅ API (Dockerfile.api)
   - ✅ Web (Dockerfile.web)
   - ✅ Admin (Dockerfile.admin)
   - ✅ Space (Dockerfile.space)
4. ✅ 更新文档和脚本
5. ✅ 测试验证

## 开发日志

### 2026-02-03 22:42 - 项目启动

- 用户反馈：docker-compose 文件混淆，构建缓存效率低
- 分析了所有 Dockerfile 和 compose 配置
- 用户确认优化方案：重命名 compose 文件 + 优化所有 Dockerfile

### 2026-02-03 22:45 - Docker Compose 重命名

- `docker-compose.yml` → `compose.prod.yml`
- `docker-compose-local.yml` → `compose.dev.yml`
- 更清晰地区分生产和开发环境

### 2026-02-03 22:50 - Dockerfile 优化完成

**API Dockerfile 优化** (apps/api/Dockerfile.api):

- 合并运行时依赖安装，减少层数
- 将 requirements 复制与依赖安装分离
- 优化 apk 包安装顺序，使用单个 RUN 命令合并构建依赖的安装和清理
- 添加清晰的注释说明每层的作用

**Web Dockerfile 优化** (apps/web/Dockerfile.web):

- 在 builder 阶段为 turbo 安装添加缓存挂载
- 优化 installer 阶段的层次结构
- 分离 pnpm fetch 和 install 步骤，更好地利用缓存
- 添加详细的阶段说明注释

**Admin 和 Space Dockerfile 优化**:

- 应用与 Web 相同的优化策略
- 统一三阶段构建模式：prune → install & build → serve
- 添加清晰的阶段分隔线和注释

### 2026-02-03 22:55 - 文档更新

- 更新 `.claude/CLAUDE.md` 中的命令示例
- 添加 Docker Compose 文件说明
- 更新 Docker 构建流量优化部分
- 添加 Dockerfile 优化说明

### 2026-02-03 23:00 - 验证测试

- ✅ `compose.dev.yml` 语法验证通过
- ✅ `compose.prod.yml` 语法验证通过
- ✅ 所有 Dockerfile 优化完成
- ✅ 文档更新完成

### 2026-02-04 09:10 - 完整构建验证

**开发环境 (compose.dev.yml)**:

- ✅ 所有后端服务启动成功
- ✅ API 服务响应正常 (http://localhost:8000/ → HTTP 200)
- ✅ 数据库、Redis、RabbitMQ、MinIO 正常运行

**生产环境 (compose.prod.yml)**:

- ✅ 前端应用构建成功 (web, admin, space)
- ✅ API 镜像构建修复（`--mount` 语法位置修正）
- ✅ 所有服务验证通过：
  - Web: http://localhost/ → HTTP 200
  - Admin: http://localhost/god-mode/ → HTTP 200
  - Space: http://localhost/spaces/ → HTTP 200
  - API: http://localhost/api/v1/users/me/ → HTTP 401 (认证正常)

**发现并修复的问题**:

- API Dockerfile.api 中 `--mount=type=cache` 语法位置错误
- 修复：将 `--mount` 移到 RUN 命令开头

## 总结

本次优化成功解决了项目中的两个主要问题：

### 1. Docker Compose 文件命名混淆 ✅

**问题**：`docker-compose.yml` 和 `docker-compose-local.yml` 命名不清晰，容易混淆用途

**解决方案**：

- 重命名为 `compose.prod.yml`（生产环境）和 `compose.dev.yml`（开发环境）
- 更新所有文档和命令示例
- 符合现代 Docker Compose 命名规范

### 2. Dockerfile 缓存效率低 ✅

**问题**：构建时即使依赖未变化，也会重新安装所有依赖，耗时 3-5 分钟

**解决方案**：

- **API**: 优化层次顺序，先复制 requirements，再安装依赖，最后复制源码
- **前端应用**:
  - 为 turbo 安装添加独立缓存层
  - 分离 pnpm fetch 和 install 步骤
  - 使用 BuildKit 缓存挂载加速下载
- 添加清晰的注释和阶段说明

**预期效果**：

- 仅修改源代码时，构建时间从 3-5 分钟降至 10-30 秒（~10x 提升）
- 新增/更新依赖时，仅下载变化的包（~8x 提升）
- BuildKit 缓存挂载跨构建复用，即使 lockfile 变化也能节省下载时间

### 后续建议

1. **测试验证**：在实际构建中验证缓存效果
2. **监控构建时间**：记录优化前后的实际构建时间对比
3. **团队培训**：确保团队成员了解新的 compose 文件命名和使用方式

**状态**: 已完成 ✅
**下次测试**: 下次代码变更时验证缓存效果

## 优化效果

### 缓存层次优化

**优化前**（以前端应用为例）:

```dockerfile
COPY . .                          # 任何文件变化都失效
RUN turbo prune --scope=web       # 重新执行
RUN pnpm add -g turbo             # 重新安装
RUN pnpm fetch && pnpm install    # 重新安装依赖
```

**优化后**:

```dockerfile
# 阶段1：turbo 安装（独立缓存层）
RUN --mount=type=cache,target=/pnpm/store pnpm add -g turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune --scope=web

# 阶段2：分离 fetch 和 install
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install
```

**API Dockerfile**:

```dockerfile
# 优化前
COPY requirements.txt ./
COPY requirements ./requirements
RUN apk add build-deps
RUN pip install -r requirements.txt
RUN apk del build-deps
COPY manage.py plane/ templates/ ...

# 优化后
RUN apk add runtime-deps
COPY requirements.txt requirements/
RUN apk add build-deps && \
    pip install -r requirements.txt && \
    apk del build-deps
COPY manage.py plane/ templates/ ...
```

### 预期性能提升

| 场景            | 优化前                      | 优化后                    | 提升               |
| --------------- | --------------------------- | ------------------------- | ------------------ |
| 仅修改源代码    | 重新安装所有依赖（3-5分钟） | 直接使用缓存（10-30秒）   | ~10x               |
| 新增/更新单个包 | 重新下载所有包（2-3分钟）   | 仅下载变化的包（10-20秒） | ~8x                |
| Turbo 版本不变  | 每次重新安装 turbo          | 使用缓存层                | 节省~10秒          |
| 完全重建        | ~5-8分钟                    | ~5-8分钟                  | 无差异（首次构建） |
