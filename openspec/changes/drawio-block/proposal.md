## Why

当前编辑器已支持 `mermaidBlock`，但无法满足 draw.io 场景：用户需要在同一文档内既能编辑图形又能直接查看/修改 `mxfile` 源码。另一方面，draw.io XML 体积较大，不适合直接内嵌到页面 HTML 中，需要通过外部资产存储降低文档负担并提升加载稳定性。

## What Changes

- 新增 `drawioBlock` 节点类型，支持显式三模式切换：`编辑`（全屏 Modal）、`预览`（内联图形）、`源代码`（内联 XML）
- 仅通过显式按钮触发模式切换与同步，不监听输入过程或编辑状态自动同步
- `drawioBlock` 仅接受并处理 `mxfile` 格式 XML（不接受裸 `mxGraphModel`）
- 在编辑模式中嵌入 draw.io Web 编辑器（iframe + postMessage JSON 协议），保存时手工同步回源码
- 新增内网 draw.io 容器接入（开发与生产编排、反向代理路径），默认连接内网服务
- 将 draw.io XML 从页面内容中外置到资产系统（MinIO + FileAsset），文档内仅保留轻量引用
- 扩展资产生命周期能力到 drawio（上传、读取、复制、删除、恢复、元数据提取）

## Capabilities

### New Capabilities

- `drawio-block`: 在富文本编辑器中提供 draw.io 图形的全屏编辑、内联预览与源码编辑三模式能力，并支持基于 `mxfile` 的显式双向同步

### Modified Capabilities

- `mermaid-block`: 复用并统一图表块交互规范（显式按钮切换、NodeView 工具栏结构、代码块解析避让策略）

## Impact

**前端编辑器与 UI**：

- `packages/editor/src/core/extensions/` 新增 `drawio` 扩展目录并注册到核心扩展集
- `packages/editor/src/core/extensions/code/code-block.ts` 增加 `drawio` fence/节点避让逻辑
- `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx` 增加 draw.io 命令入口
- `packages/editor/src/core/plugins/file/*`、`packages/editor/src/core/helpers/*` 扩展 drawio 资产跟踪与复制
- `apps/web/core/hooks/use-parse-editor-content.ts` 扩展 drawio 资产元数据提取

**后端 API 与存储**：

- `apps/api/plane/app/views/asset/v2.py` 按 `entity_type` 放开 drawio XML MIME 并补充安全校验
- 新增/扩展 drawio 资产读取接口（返回 XML 原文，避免前端受重定向与跨域限制）
- 复用 `file_assets` 表与 MinIO 存储，不新增专用 drawio 数据表

**基础设施与部署**：

- `compose.dev.yml`、`compose.prod.yml` 增加内网 draw.io 容器服务
- `apps/proxy/Caddyfile.ce` 增加 draw.io 反向代理路由（建议 `/drawio/*`）
- `apps/web/vite.config.ts`（必要时含 space/admin）补充本地开发代理

**上游冲突风险评估**：

- **高风险（上游高频变更区）**：`packages/editor/src/core/extensions/extensions.ts`、`command-items-list.tsx`、`code-block.ts`、`constants/extension.ts`
- **中风险（平台共用接口）**：`apps/api/plane/app/views/asset/v2.py`、`packages/utils/src/editor/common.ts`（若扩展公共枚举）
- **低风险（新增文件/目录）**：`packages/editor/src/core/extensions/drawio/*`、`openspec/changes/drawio-block/*`
