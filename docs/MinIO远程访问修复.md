# MinIO 远程访问问题修复

## 问题描述

**错误现象：**
```
POST http://localhost:9000/uploads net::ERR_CONNECTION_REFUSED
```

从远程访问应用时，文件上传功能失败，浏览器控制台显示尝试连接到 `localhost:9000` 或 `plane-minio:9000` 的错误。

## 问题根源

### 技术原因

在 `apps/api/plane/settings/storage.py` 中，S3Storage 类的初始化逻辑如下：

```python
if os.environ.get("USE_MINIO") == "1":
    # 使用动态端点 URL
    endpoint_url = f"{endpoint_protocol}://{request.get_host()}"
    # 生成的签名 URL 会使用实际访问地址（如 http://107.174.155.181）
else:
    # 使用固定端点 URL
    endpoint_url = self.aws_s3_endpoint_url  # http://plane-minio:9000
    # 生成的签名 URL 会包含 Docker 内部服务名
```

**问题链：**
1. 当 `USE_MINIO=0` 时，后端使用固定的 `AWS_S3_ENDPOINT_URL="http://plane-minio:9000"`
2. boto3 生成的签名 URL 包含此端点地址
3. 前端收到的上传 URL 类似 `http://plane-minio:9000/uploads/...`
4. 浏览器尝试访问 Docker 内部服务名，导致连接失败

## 解决方案

### 修改内容

**文件：** `apps/api/.env`

```diff
- USE_MINIO=0
+ USE_MINIO=1
```

### 工作原理

启用 `USE_MINIO=1` 后：

1. **动态端点生成：** 后端根据 HTTP 请求的 `Host` 头动态构建端点 URL
2. **正确的签名 URL：** 生成的上传 URL 使用实际访问地址（如 `http://107.174.155.181/uploads/...`）
3. **代理路由：** Caddy 代理将 `/uploads/*` 请求转发到 MinIO（配置在 `apps/proxy/Caddyfile.ce:26`）
4. **成功上传：** 浏览器可以通过公网 IP 访问到 MinIO 服务

### 代理配置（参考）

`apps/proxy/Caddyfile.ce` 中的相关配置：

```caddy
reverse_proxy /{$BUCKET_NAME}/* plane-minio:9000
```

这行配置确保 `/uploads/*` 路径被正确代理到 MinIO 服务。

## 验证步骤

修复后需要重启相关服务：

```bash
# 重启 API 服务以加载新的环境变量
docker compose restart api

# 或重启所有服务
docker compose restart
```

验证上传功能：
1. 从远程浏览器访问应用
2. 尝试上传文件（如用户头像、项目封面等）
3. 检查浏览器网络面板，确认上传请求使用正确的公网地址

## 相关配置说明

### 环境变量

| 变量名 | 当前值 | 说明 |
|--------|--------|------|
| `USE_MINIO` | `1` | 启用 MinIO 动态端点（必须为 1） |
| `AWS_S3_ENDPOINT_URL` | `http://plane-minio:9000` | MinIO 内部地址（仅用于容器间通信） |
| `AWS_S3_BUCKET_NAME` | `uploads` | 存储桶名称 |
| `MINIO_ENDPOINT_SSL` | `0` | 是否使用 HTTPS（0=HTTP，1=HTTPS） |

### 其他应用配置检查

已验证以下配置文件均正确使用公网地址 `http://107.174.155.181`：

- ✅ `apps/web/.env` - 所有 VITE 变量
- ✅ `apps/admin/.env` - 所有 VITE 变量
- ✅ `apps/live/.env` - 所有 BASE_URL 变量

## 注意事项

1. **USE_MINIO 必须设置为 1**：这是远程访问的关键配置
2. **代理必须正确配置**：确保 Caddy 配置包含 MinIO 路径代理
3. **CORS 配置**：如果使用不同域名，需要在 `CORS_ALLOWED_ORIGINS` 中添加
4. **SSL 配置**：如果使用 HTTPS，需要同时设置 `MINIO_ENDPOINT_SSL=1`

## 影响范围

此修复影响所有文件上传功能：
- 用户头像上传
- 用户封面图上传
- 工作区 Logo 上传
- 项目封面上传
- Issue 附件上传
- 编辑器中的图片上传
- 页面描述中的文件上传

## 修复日期

2025-12-12

## 参考文件

- 问题定位：`apps/api/plane/settings/storage.py:35-49`
- 资源上传逻辑：`apps/api/plane/app/views/asset/v2.py`
- 代理配置：`apps/proxy/Caddyfile.ce`
