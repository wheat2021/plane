---
name: plane-deploy
description: FICC 专用 Plane 生产部署助手。将本地 itemtype 分支代码构建为 x86 Docker 镜像，经由 Mac 中继传输到内网部署服务器，完成部署并验证。
license: MIT
metadata:
  author: ficc-local
  version: "1.1"
---

# Plane 生产部署助手（FICC 专用）

## 调用形式

```
/plane-deploy [--images <img1,img2,...> | --all] [--phase <sync|build|package|transfer|deploy|verify|full>] [no-sync]
```

### 阶段模式（`--phase`）

| 阶段       | 说明                                        |
| ---------- | ------------------------------------------- |
| `sync`     | 同步代码到构建服务器                        |
| `build`    | 构建镜像（可搭配 `--images` 指定）          |
| `package`  | 打包镜像为 tar.gz（可搭配 `--images` 指定） |
| `transfer` | 传输 tar.gz 到部署服务器                    |
| `deploy`   | 部署到生产服务器                            |
| `verify`   | 验证部署结果                                |
| `full`     | 完整流程（默认）                            |

### 镜像选择（`--images`）

可用镜像：`api` `proxy` `live` `web` `admin` `space`

- `--images api,web`：只构建 api 和 web
- `--images all` 或省略 `--images`：构建所有镜像

### 其他选项

- `no-sync`：跳过代码同步（使用构建服务器现有代码）

### 示例

```
/plane-deploy                           # 完整流程构建+部署所有镜像
/plane-deploy --images api,web         # 只构建+部署 api 和 web
/plane-deploy --phase build --images space  # 只构建 space
/plane-deploy --phase transfer         # 传输已有 tar.gz
/plane-deploy --phase deploy           # 部署已有 tar.gz
/plane-deploy --phase build --images api,web,admin --phase package  # 构建多个后打包
```

---

## 固定配置（不要询问用户）

```
BUILD_SERVER   = dev@107.174.155.181          # 构建服务器，有互联网
DEPLOY_SERVER  = appadmin@10.102.21.231       # 部署服务器，内网无互联网
LOCAL_CODE     = /opt/code/plane              # 本地代码目录
BUILD_WORKDIR  = /opt/code/plane              # 构建服务器代码目录
DEPLOY_WORKDIR = /home/appadmin/plane         # 部署服务器 compose 目录
TARBALL_NAME   = plane-ficc.tar.gz
TARBALL_BUILD  = /tmp/plane-ficc.tar.gz       # 构建服务器临时路径
TARBALL_MAC    = /tmp/plane-ficc.tar.gz       # Mac 本地临时路径
TARBALL_DEPLOY = /home/appadmin/plane-ficc.tar.gz  # 部署服务器路径
IMAGE_TAG      = ficc-latest
SERVICE_URL    = http://10.102.21.231:8080    # 生产服务访问地址
```

---

## 镜像清单

| 镜像    | Dockerfile                    | 服务名                          | 大小    | 说明             |
| ------- | ----------------------------- | ------------------------------- | ------- | ---------------- |
| `api`   | `apps/api/Dockerfile.api`     | api/worker/beat-worker/migrator | ~491MB  | 共享同一层       |
| `proxy` | `apps/proxy/Dockerfile.ce`    | proxy                           | ~151MB  | Caddy            |
| `live`  | `apps/live/Dockerfile.live`   | live                            | ~1.44GB | Node.js 实时协作 |
| `web`   | `apps/web/Dockerfile.web`     | web                             | ~123MB  | React 主界面     |
| `admin` | `apps/admin/Dockerfile.admin` | admin                           | ~105MB  | React 管理后台   |
| `space` | `apps/space/Dockerfile.space` | space                           | ~1.53GB | React 公开空间   |

---

## 已知环境约束

- **端口**：`8080`（不是80）。部署服务器主机有 nginx 占用80端口，Docker 服务监听 8080
- **Docker**：构建服务器 Docker 29.1/Compose v5；部署服务器 Docker 18.09/docker-compose 1.22.0
- **space 健康检查**：`space` 容器 Docker healthcheck 会显示 `unhealthy`（镜像内无 curl），**实际服务正常**，忽略此警告
- **AWS_REGION**：api.env 中 `AWS_REGION=""` 会产生警告，不影响 MinIO 使用
- **迁移**：首次部署 migrator 需要约 3-5 分钟跑全部 Django 迁移

---

## Phase 1：SYNC（同步代码到构建服务器）

```bash
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.venv' \
  --exclude='jira_data' \
  /opt/code/plane/ \
  dev@107.174.155.181:/opt/code/plane/
```

预期耗时：15-30 秒（增量同步极快）

---

## Phase 2：BUILD（在构建服务器构建镜像）

```bash
ssh dev@107.174.155.181 "
  # ⚠️  不要轻易 prune！BuildKit 缓存（pnpm store/pip cache）是加速的关键
  # 只有磁盘剩余 < 5GB 时才清理，且保留 15GB 缓存
  AVAIL=\$(df / | tail -1 | awk '{print \$4}')
  [ \$AVAIL -lt 5242880 ] && docker builder prune -f --keep-storage 15GB

  cd /opt/code/plane

  # api（同时用于 worker/beat-worker/migrator）
  [ '{{BUILD_API}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-api:ficc-latest \
    -t plane-worker:ficc-latest \
    -t plane-beat-worker:ficc-latest \
    -t plane-migrator:ficc-latest \
    -f apps/api/Dockerfile.api \
    apps/api/ && echo '✅ api built'

  # proxy（Caddy）
  [ '{{BUILD_PROXY}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-proxy:ficc-latest \
    -f apps/proxy/Dockerfile.ce \
    apps/proxy/ && echo '✅ proxy built'

  # live（Node.js，约3分钟）
  [ '{{BUILD_LIVE}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-live:ficc-latest \
    -f apps/live/Dockerfile.live \
    . && echo '✅ live built'

  # web（React，约3-4分钟，有 sourcemap 警告属正常）
  [ '{{BUILD_WEB}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-web:ficc-latest \
    -f apps/web/Dockerfile.web \
    . && echo '✅ web built'

  # admin（约2分钟）
  [ '{{BUILD_ADMIN}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-admin:ficc-latest \
    -f apps/admin/Dockerfile.admin \
    . && echo '✅ admin built'

  # space（约3分钟）
  [ '{{BUILD_SPACE}}' = '1' ] && DOCKER_BUILDKIT=1 docker build \
    -t plane-space:ficc-latest \
    -f apps/space/Dockerfile.space \
    . && echo '✅ space built'

  echo '--- 镜像列表 ---'
  docker images | grep ficc-latest
"
```

预期总耗时：~15分钟（全量，代码未变时 BuildKit 缓存命中，几分钟内完成）

---

## Phase 3：PACKAGE（打包镜像）

```bash
ssh dev@107.174.155.181 "
  IMGS=''
  [ '{{PKG_API}}' = '1' ] && IMGS=\"\$IMGS plane-api:ficc-latest plane-worker:ficc-latest plane-beat-worker:ficc-latest plane-migrator:ficc-latest\"
  [ '{{PKG_PROXY}}' = '1' ] && IMGS=\"\$IMGS plane-proxy:ficc-latest\"
  [ '{{PKG_LIVE}}' = '1' ] && IMGS=\"\$IMGS plane-live:ficc-latest\"
  [ '{{PKG_WEB}}' = '1' ] && IMGS=\"\$IMGS plane-web:ficc-latest\"
  [ '{{PKG_ADMIN}}' = '1' ] && IMGS=\"\$IMGS plane-admin:ficc-latest\"
  [ '{{PKG_SPACE}}' = '1' ] && IMGS=\"\$IMGS plane-space:ficc-latest\"

  docker save \$IMGS | gzip > /tmp/plane-ficc.tar.gz
  ls -lh /tmp/plane-ficc.tar.gz
"
```

预期 tarball 大小：~641MB（全量），耗时约1分钟

---

## Phase 4：TRANSFER（Mac 中继传输）

```bash
# Step 4a：下载到 Mac
rsync -av --progress \
  dev@107.174.155.181:/tmp/plane-ficc.tar.gz \
  /tmp/plane-ficc.tar.gz

# Step 4b：上传到部署服务器
rsync -av --progress \
  /tmp/plane-ficc.tar.gz \
  appadmin@10.102.21.231:/home/appadmin/plane-ficc.tar.gz
```

预期下载耗时：~75秒（~9MB/s）
预期上传耗时：~100秒（速度波动较大，内网链路）

---

## Phase 5：DEPLOY（在部署服务器部署）

> ⚠️ **数据安全警告**：
>
> - **永远不要** 在增量更新时先 `docker-compose down` 再 `up`，这会导致 volume 与旧容器解绑，新 `up` 时创建空 volume，**所有数据丢失**
> - **永远不要** 使用 `docker-compose down -v`，`-v` 参数会明确删除 volume
> - 增量更新只能用 `--force-recreate`：只替换容器，volume 不受影响

```bash
ssh appadmin@10.102.21.231 "
  # 1. 加载镜像
  docker load < /home/appadmin/plane-ficc.tar.gz

  # 2. 重标签为 :latest（compose 文件引用 :latest）
  for img in api worker beat-worker migrator web admin space live proxy; do
    docker tag plane-\${img}:ficc-latest plane-\${img}:latest 2>/dev/null || true
  done

  # 3. 确保 api.env 配置正确（幂等，可重复运行）
  cd /home/appadmin/plane
  sed -i 's/^USE_MINIO=0/USE_MINIO=1/' apps/api/.env
  grep -q 'USE_MINIO=1' apps/api/.env || echo 'USE_MINIO=1' >> apps/api/.env

  # ⚠️  docker-compose 1.22 不自动去掉 env 文件值的外层引号
  # KEY="value" 会被读成 value="value"（含引号），导致 boto3/MinIO 报错
  sed -i 's/^\([A-Z_][A-Z0-9_]*\)="\(.*\)"$/\1=\2/' apps/api/.env
  sed -i 's/^\([A-Z_][A-Z0-9_]*\)="\(.*\)"$/\1=\2/' .env

  # AWS_REGION 不能为空，否则 boto3 报 InvalidRegionError → 文件上传 500
  sed -i 's/^AWS_REGION=$/AWS_REGION=us-east-1/' apps/api/.env
  sed -i 's/^AWS_REGION=$/AWS_REGION=us-east-1/' .env
  grep -q '^AWS_REGION=' apps/api/.env || echo 'AWS_REGION=us-east-1' >> apps/api/.env

  # 4. 智能启动/更新（自动判断首次还是增量）
  cd /home/appadmin/plane
  if docker-compose -f docker-compose-prod.yml ps -q 2>/dev/null | grep -q .; then
    echo '检测到服务已运行 → 增量更新（--force-recreate，数据 volume 不受影响）'
    docker-compose -f docker-compose-prod.yml up -d --force-recreate
  else
    echo '未检测到运行中的服务 → 首次启动'
    docker-compose -f docker-compose-prod.yml up -d
  fi
"
```

---

## Phase 6：VERIFY（验证）

```bash
ssh appadmin@10.102.21.231 "
  echo '=== 容器状态 ==='
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

  echo '=== 等待 migrator 完成（首次部署约3-5分钟）==='
  timeout 360 bash -c 'until [ \$(docker inspect plane-migrator --format=\"{{.State.Status}}\") = \"exited\" ] 2>/dev/null; do sleep 5; printf \".\"; done'
  docker inspect plane-migrator --format='迁移状态: ExitCode={{.State.ExitCode}}'

  echo '=== HTTP 验证 ==='
  for path in '/' '/god-mode/' '/spaces/'; do
    code=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080\$path)
    echo \"\$path: HTTP \$code\"
  done

  echo '=== Auth API 验证 ==='
  curl -s -o /dev/null -w 'POST /auth/sign-in/: HTTP %{http_code}\n' \
    -X POST http://localhost:8080/auth/sign-in/ \
    -H 'Content-Type: application/json' \
    -d '{\"email\":\"test@example.com\",\"password\":\"test\"}'
"
```

期望结果：

- `/`：200 ✅
- `/god-mode/`：200 ✅
- `/spaces/`：200 ✅
- `POST /auth/sign-in/`：200 ✅（即使凭证错误也返回200，说明API在工作）
- `space` 容器显示 `unhealthy`：**可忽略**（healthcheck 配置问题，服务正常）

---

## 单镜像快速操作

### 只构建+部署 api（后端改动）

```bash
/plane-deploy --images api --phase full
```

### 只构建+部署 web（前端改动）

```bash
/plane-deploy --images web --phase full
```

### 只构建 space（调试）

```bash
/plane-deploy --images space --phase build
```

---

## 快速诊断

### 服务访问地址

```
http://10.102.21.231:8080          # Plane 主界面
http://10.102.21.231:8080/god-mode/ # 管理员设置
http://10.102.21.231:8080/spaces/   # 公开空间
```

### 首次部署后设置管理员

访问 `http://10.102.21.231:8080/god-mode/` → 点击 "Get Started" → 注册 instance admin

### 常用运维命令（在部署服务器执行）

```bash
# 查看所有容器日志
cd /home/appadmin/plane && docker-compose -f docker-compose-prod.yml logs -f --tail=50

# 查看单个服务
docker logs api -f
docker logs plane-migrator

# 停止服务
cd /home/appadmin/plane && docker-compose -f docker-compose-prod.yml down

# 重启某个服务
docker restart api

# 查看 MinIO 对象存储
docker logs plane-minio
```

### 排错：API 502 错误

API 在 migrator 完成前会返回502，属正常现象。等待migrator完成（`docker inspect plane-migrator` 显示 `Status: exited`）后 API 自动变为可用。

### 排错：构建服务器磁盘不足

```bash
ssh dev@107.174.155.181 "docker builder prune -f --keep-storage 2GB"
```

### 排错：部署服务器容器名称冲突

如果有**其他项目**（不同目录/项目名）的残留容器占用了相同的容器名：

```bash
ssh appadmin@10.102.21.231 "
  # 1. 先查看所有容器和项目
  docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
  # 2. 找到冲突项目名（看容器名前缀）
  # 3. 仅停止旧项目的容器（不影响 plane 项目的 volume）
  cd /home/appadmin/<旧项目目录> && docker-compose down
  # 4. 重新部署当前项目（使用 --force-recreate，不要用普通 up）
  cd /home/appadmin/plane && docker-compose -f docker-compose-prod.yml up -d --force-recreate
"
```

### ⚠️ 排错：数据"消失"（项目名变更导致 volume 切换）

**症状**：部署后数据库为空，之前的数据全部不见。

**根因**：docker-compose 项目名变了，新项目创建了全新的 volume，旧数据还在旧 volume 里。

```bash
# 查看所有 volume（旧数据在里面）
ssh appadmin@10.102.21.231 "docker volume ls | grep plane"

# 典型结果：
# plane_pgdata          ← 当前项目 volume
# plane-deploy_pgdata   ← 旧项目 volume（数据在这里）

# 如果需要恢复旧数据：迁移 volume（谨慎操作）
# 方案：临时启动旧项目 pg，pg_dump，再 restore 到新项目 pg
```

**预防**：增量更新时始终用 `--force-recreate`，不要用 `down` + `up`。

---

## 关键配置文件位置（部署服务器）

| 文件     | 路径                                           | 用途                             |
| -------- | ---------------------------------------------- | -------------------------------- |
| compose  | `/home/appadmin/plane/docker-compose-prod.yml` | 服务定义（image:latest 模式）    |
| root env | `/home/appadmin/plane/.env`                    | DB/Redis/MQ/MinIO 凭据，端口配置 |
| api env  | `/home/appadmin/plane/apps/api/.env`           | Django 配置，URL，密钥           |

### 重要配置值（已验证正确）

```ini
# root .env
LISTEN_HTTP_PORT=8080   # 主机端口（80被nginx占用）
SITE_ADDRESS=:80        # Caddy 容器内监听端口

# apps/api/.env
USE_MINIO=1             # 必须为1才能上传文件
AWS_REGION=us-east-1    # 不能为空或带引号的""，MinIO 接受任意 region 字符串
AWS_S3_ENDPOINT_URL=http://plane-minio:9000  # 内部 MinIO 地址
CORS_ALLOWED_ORIGINS=http://10.102.21.231:8080
WEB_URL=http://10.102.21.231:8080

# docker-compose-prod.yml：live 服务（已修复，含必要环境变量）
# API_BASE_URL / LIVE_SERVER_SECRET_KEY / REDIS_URL
```

---

## 执行时间参考

| 阶段                     | 首次（无缓存） | 代码改动（有缓存）    | 无改动      |
| ------------------------ | -------------- | --------------------- | ----------- |
| 代码同步                 | 15-30 秒       | 15-30 秒              | 15秒        |
| 构建 API                 | ~30 秒         | ~10 秒                | 3 秒        |
| 构建 proxy               | ~20 秒         | ~5 秒                 | 2 秒        |
| 构建 live                | ~3 分钟        | ~3 分钟（TS编译为主） | 3 秒        |
| 构建 web                 | ~4 分钟        | ~4 分钟（TS编译为主） | 3 秒        |
| 构建 admin               | ~2 分钟        | ~3 分20秒（实测）     | 3 秒        |
| 构建 space               | ~3 分钟        | ~4 分钟（TS编译为主） | 3 秒        |
| 打包 tar.gz              | ~60 秒         | ~60 秒                | ~60 秒      |
| 构建→Mac 下载            | ~75 秒         | ~75 秒                | ~75 秒      |
| Mac→部署服务器           | ~100 秒        | ~100 秒               | ~100 秒     |
| docker load              | ~30 秒         | ~30 秒                | ~30 秒      |
| docker-compose up + 迁移 | 首次~5分钟     | ~30 秒                | ~30 秒      |
| **全流程合计**           | **~20 分钟**   | **~15 分钟**          | **~5 分钟** |

> **缓存说明**：TypeScript 编译（turbo build）是瓶颈，无法跳过。
> pnpm 包安装由 `--mount=type=cache` 持久化，即使层失效也不重新下载。
> **绝对不要在构建前 prune build cache**，否则退化为首次速度。
