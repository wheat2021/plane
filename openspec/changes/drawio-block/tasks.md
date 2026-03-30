## 1. 提交变更文档

- [x] 1.1 复核并确认 `proposal.md`、`design.md`、`specs/drawio-block/spec.md`、`specs/mermaid-block/spec.md` 内容与需求一致
- [ ] 1.2 提交 openspec 文档：`#FICC-9999# docs: 完成 drawio-block 变更文档（proposal/design/specs/tasks）`

## 2. 基础设施与内网 draw.io 服务接入

- [x] 2.1 在 `compose.dev.yml` 增加 draw.io 容器服务，并确保开发环境可通过统一路径访问
- [x] 2.2 在 `compose.prod.yml` 增加 draw.io 容器服务，并与现有 proxy 拓扑兼容
- [x] 2.3 [UPSTREAM-RISK] 在 `apps/proxy/Caddyfile.ce` 增加 `/drawio/*` 反向代理路由
- [x] 2.4 [UPSTREAM-RISK] 在 `apps/web/vite.config.ts` 增加本地 `/drawio` 代理，保证 `pnpm dev` 可直连

## 3. 后端资产能力扩展（XML 存储与读取）

- [x] 3.1 [UPSTREAM-RISK] 在 `apps/api/plane/app/views/asset/v2.py` 为描述类 `entity_type` 放开 `text/xml` 与 `application/xml` MIME
- [x] 3.2 新增或扩展 XML 原文读取接口（返回 `mxfile` 文本），并复用现有 workspace/project 权限模型
- [x] 3.3 为新增接口补充输入校验：仅允许 `mxfile` 结构通过
- [ ] 3.4 为新增/调整的 API 行为补充后端测试（权限、MIME、非 mxfile 拒绝场景）
- [x] 3.5 如引入数据库变更，新增 migration 并检查序号连续性（无跳号、无冲突）

## 4. 编辑器 drawioBlock 核心实现

- [x] 4.1 [UPSTREAM-RISK] 在 `packages/editor/src/core/constants/extension.ts` 增加 `DRAWIO_BLOCK` 枚举与块节点注册
- [x] 4.2 新增 `packages/editor/src/core/extensions/drawio/`（`extension.ts`、`node-view.tsx`、`index.ts` 等）实现节点 schema 与 NodeView
- [x] 4.3 在 NodeView 实现显式三按钮（编辑/预览/源代码）与模式状态管理，默认进入源代码模式
- [x] 4.4 在 NodeView 实现全屏 Modal + iframe 的 draw.io 协议通信（`init/load/save/exit`）
- [x] 4.5 实现 `mxfile` 校验与错误提示，阻止非法 XML 进入预览/编辑流程
- [x] 4.6 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/code/code-block.ts` 增加 `drawio` fence 与节点解析避让
- [x] 4.7 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/slash-commands/command-items-list.tsx` 增加 draw.io slash command
- [x] 4.8 [UPSTREAM-RISK] 在 `packages/editor/src/core/extensions/extensions.ts` 与 `index.ts` 注册并导出 drawio 扩展

## 5. 资产生命周期与复制链路扩展

- [x] 5.1 [UPSTREAM-RISK] 在文件删除/恢复插件映射中纳入 `drawioBlock`，确保节点删除会正确触发资产删除与恢复
- [x] 5.2 [UPSTREAM-RISK] 扩展 `getEditorMetaData` 和相关资产提取逻辑，将 drawio 资产纳入导航与导出元数据
- [x] 5.3 [UPSTREAM-RISK] 扩展 `getEditorContentWithReplacedAssets` 的资产提取/替换逻辑，保证复制页面时 drawio 资产可复制
- [ ] 5.4 补充 drawio 资产生命周期测试（删除、恢复、复制、重新加载）

## 6. Mermaid 交互规范对齐

- [x] 6.1 [UPSTREAM-RISK] 调整 Mermaid NodeView 与规格一致：预览渲染仅由显式按钮触发，不依赖全局编辑状态
- [ ] 6.2 更新 Mermaid 相关测试或快照，覆盖显式按钮切换与懒加载触发条件

## 7. 提交实现代码

- [ ] 7.1 提交基础设施改造：`#FICC-9999# chore: 增加内网 drawio 服务与代理路由`
- [ ] 7.2 提交后端资产能力：`#FICC-9999# feat: 支持 drawio xml 资产上传与受控读取`
- [ ] 7.3 提交编辑器节点能力：`#FICC-9999# feat: 新增 drawioBlock 三模式编辑与手工同步`
- [ ] 7.4 提交资产链路扩展：`#FICC-9999# feat: 扩展 drawio 资产复制删除恢复链路`
- [ ] 7.5 提交 Mermaid 对齐：`#FICC-9999# refactor: 对齐 mermaid 显式预览交互规范`
- [ ] 7.6 最终统一提交剩余实现改动（`git add -A && git commit`），确保工作区无遗漏实现文件

## 8. 用户验证

- [ ] 8.1 在编辑器输入 `/drawio` 插入节点，验证出现“编辑/预览/源代码”三按钮且默认为源代码模式
- [ ] 8.2 在源代码模式输入合法 `mxfile`，切换预览后验证图形正确内联展示
- [ ] 8.3 在源代码模式输入非法 XML 或非 `mxfile`，验证系统阻止切换并给出错误提示
- [ ] 8.4 点击编辑打开全屏 Modal，修改图形并保存，返回后验证源码与预览一致
- [ ] 8.5 保存文档并刷新页面，验证 drawio 节点通过 `asset_id` 正常恢复
- [ ] 8.6 复制含 drawio 的页面/内容，验证目标文档图形可正常预览且不引用已删除源资产
- [ ] 8.7 删除并撤销包含 drawio 节点的内容，验证资产删除/恢复行为正确
- [ ] 8.8 在开发与生产部署方式下分别验证 `/drawio` 服务可访问且编辑器可正常加载内网 draw.io
