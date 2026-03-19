# 🚀 Plane itemtype → preview 快速升级项目

**项目名**: `upgrade-itemtype-to-preview-fast`
**目标**: 将 itemtype 分支现代化，完整升级到 preview 功能水平
**方案**: 快速方案 (3-4 周)
**优先级**: 高 (9/10)
**状态**: 🟢 项目初始化中

---

## 📋 项目阶段划分

### 阶段 1️⃣: Extra Property 系统升级 (第 1-2 周)
**目标**: 迁移和优化 Extra Property 系统

- [ ] **Subtask 1.1**: 分析数据模型差异
  - itemtype 的 ExtraProperty 模型结构分析
  - preview 的 ExtraPropertyConfig + IssueTypeExtraProperty 分析
  - 映射关系和兼容性评估
  - 预计: 1 天

- [ ] **Subtask 1.2**: 数据库迁移准备
  - 创建迁移脚本框架
  - ExtraPropertyConfig 模型创建
  - IssueTypeExtraProperty 模型创建
  - 预计: 1.5 天

- [ ] **Subtask 1.3**: API 端点实现
  - /extra-property-config/ CRUD 端点
  - /issue-type-extra-property/ CRUD 端点
  - 序列化器和视图更新
  - 权限和验证逻辑
  - 预计: 2 天

- [ ] **Subtask 1.4**: 前端组件更新
  - Extra Property 编辑表单组件
  - Checkbox 图标选择器
  - 条件显示逻辑 UI
  - 预计: 2 天

- [ ] **Subtask 1.5**: 数据迁移
  - itemtype 数据到 preview 格式的转换
  - 迁移脚本测试
  - 回滚方案准备
  - 预计: 1 天

- [ ] **Subtask 1.6**: 测试和修复
  - 单元测试编写
  - 集成测试
  - Bug 修复
  - 预计: 1.5 天

**Phase 1 总计**: ~9 天 (1.5 周)

---

### 阶段 2️⃣: 框架现代化 (第 2-3 周)
**目标**: Vite + React Router v6 升级

- [ ] **Subtask 2.1**: Vite 构建配置
  - Vite 配置文件创建
  - 依赖优化 (rollup 配置)
  - 开发服务器配置
  - 生产构建优化
  - 预计: 2 天

- [ ] **Subtask 2.2**: React Router v6 迁移
  - 路由结构重构
  - 嵌套路由适配
  - 数据加载器更新
  - 错误边界处理
  - 预计: 2 天

- [ ] **Subtask 2.3**: 编辑器和依赖升级
  - TipTap 编辑器升级
  - 关键依赖版本更新
  - 破坏性变更处理
  - 预计: 1.5 天

- [ ] **Subtask 2.4**: 构建测试和优化
  - Vite 构建时间基准测试
  - 热更新 (HMR) 性能验证
  - 包大小分析和优化
  - 预计: 1.5 天

**Phase 2 总计**: ~7 天 (1.5 周)

---

### 阶段 3️⃣: UI 和设计系统 (第 3-4 周)
**目标**: 集成现代 UI 和设计系统

- [ ] **Subtask 3.1**: Tailwind 配置迁移
  - Tailwind v3 配置更新
  - 工具类优化
  - 自定义主题配置
  - 预计: 1 天

- [ ] **Subtask 3.2**: Propel 设计系统集成
  - 设计令牌导入
  - 组件库样式更新
  - 主题变量替换
  - 预计: 2 天

- [ ] **Subtask 3.3**: ProjectUserProperty 迁移
  - ProjectUserProperty 模型实现
  - 数据迁移脚本
  - API 端点更新
  - 预计: 1.5 天

- [ ] **Subtask 3.4**: Description JSON 化
  - Description 模型更新
  - 序列化器适配
  - 编辑器组件更新
  - 预计: 1.5 天

- [ ] **Subtask 3.5**: 视觉回归测试
  - 页面截图对比
  - 视觉检查清单
  - 跨浏览器测试
  - 预计: 1.5 天

**Phase 3 总计**: ~7.5 天 (1.5 周)

---

### 阶段 4️⃣: 测试、优化和上线 (第 4 周)
**目标**: 完整测试、性能验证、上线准备

- [ ] **Subtask 4.1**: 完整的集成测试
  - 端到端 (E2E) 测试覆盖
  - 关键用户流程测试
  - 权限和安全测试
  - 预计: 2 天

- [ ] **Subtask 4.2**: 性能基准测试
  - 页面加载时间对比 (vs itemtype)
  - 构建时间基准 (vs itemtype)
  - 数据库查询性能
  - 预计: 1 天

- [ ] **Subtask 4.3**: 文档更新
  - 升级指南文档
  - API 文档更新
  - 开发者指南更新
  - 预计: 1 天

- [ ] **Subtask 4.4**: 版本发布准备
  - 变更日志 (CHANGELOG) 编写
  - 迁移脚本最终测试
  - 回滚方案验证
  - 预计: 0.5 天

- [ ] **Subtask 4.5**: 灰度上线 (可选)
  - 小范围用户测试 (可选)
  - 监控告警配置 (可选)
  - 预计: 0.5-1 天

**Phase 4 总计**: ~5 天 (1 周)

---

## 📊 项目时间线

```
第 1 周  │ Extra Property 系统  │ ████████░░  (80%)
        │ 框架准备            │ ░░░░░░░░░░  (0%)

第 2 周  │ Framework 迁移      │ ████████░░  (80%)
        │ Extra Property 完成  │ ██████████  (100%)
        │ UI 开始              │ ░░░░░░░░░░  (0%)

第 3 周  │ UI 和设计系统       │ ████████░░  (80%)
        │ 框架迁移完成        │ ██████████  (100%)

第 4 周  │ 测试和上线          │ ████████░░  (80%)
        │ 所有工作完成        │ ██████████  (100%)
        └─────────────────────────────────────────
        总进度：0% → 25% → 50% → 75% → 100%
```

---

## 🎯 关键里程碑和检查点

| 日期 | 里程碑 | 检查项 | 责任人 |
|------|--------|--------|--------|
| Week 1 | Extra Property 完成 | ✅ 数据迁移成功 | backend |
| Week 2 | 框架升级完成 | ✅ Vite 构建 <30s | frontend |
| Week 3 | UI 集成完成 | ✅ 视觉检查通过 | design |
| Week 4 | 全部测试通过 | ✅ E2E 测试 100% | QA |
| Week 4 | 性能验证 | ✅ 性能 +40% | devops |
| Week 4 | 发布 | ✅ 版本标签 | release |

---

## 🔧 技术依赖关系

```
Extra Property 系统 (Phase 1)
    ↓
    ├─→ API 端点完成
    ├─→ 数据迁移完成
    └─→ 前端组件完成
        ↓
Framework 现代化 (Phase 2)
    ↓
    ├─→ Vite 配置
    ├─→ React Router v6
    └─→ 依赖升级
        ↓
UI 和设计系统 (Phase 3)
    ↓
    ├─→ Tailwind 迁移
    ├─→ Propel 集成
    ├─→ ProjectUserProperty
    └─→ Description JSON
        ↓
测试和上线 (Phase 4)
    ↓
    ├─→ E2E 测试
    ├─→ 性能基准
    └─→ 发布准备
        ↓
    ✅ 上线
```

---

## 📚 关键参考资源

### Preview 分支中的关键文件

#### Extra Property 相关
- 数据模型: `apps/api/plane/db/models/extra_property.py`
- API 视图: `apps/api/plane/app/views/external/extra_property.py` (参考)
- 序列化器: `apps/api/plane/app/serializers/extra_property.py` (参考)

#### 框架升级参考
- Vite 配置: `vite.config.ts` (apps/web/)
- React Router: `apps/web/core/app.tsx` (参考)
- 编辑器: `packages/editor/src/` (TipTap v3)

#### UI 和设计系统
- Tailwind 配置: `tailwind.config.js` (参考)
- Propel 令牌: `packages/ui/css/propel/` (参考)
- ProjectUserProperty: `apps/api/plane/db/models/project.py` (~900 行)

---

## ✅ 项目成功标准

升级完成时应满足以下条件：

```
□ 功能完整性
  ✅ itemtype 的所有自定义功能正常运行
  ✅ Extra Property 系统完全迁移
  ✅ 所有 API 端点工作正常
  ✅ 权限和安全没有回归

□ 性能指标
  ✅ Vite 冷启动 < 30s
  ✅ HMR 更新 < 1s
  ✅ 页面加载时间 +40% (vs itemtype)
  ✅ 生产构建 < 1 分钟

□ 质量保证
  ✅ 单元测试覆盖率 > 80%
  ✅ E2E 测试 100% 通过
  ✅ 零数据丢失或损坏
  ✅ 零安全漏洞发现

□ 用户体验
  ✅ UI 视觉检查 100% 通过
  ✅ 跨浏览器兼容性验证
  ✅ 响应式设计验证
  ✅ 无重大 bug 报告

□ 文档和支持
  ✅ 升级指南完成
  ✅ API 文档更新
  ✅ 迁移脚本文档
  ✅ 回滚程序文档
```

---

## 📞 下一步行动

### 本周任务

**今天** (第 1 天):
1. ✅ 创建升级分支: `git checkout -b upgrade-itemtype-to-preview`
2. ✅ 完整数据库备份
3. ✅ 设置测试环境
4. 组织技术评审会议

**本周** (第 1-2 天):
1. 分析 Extra Property 数据模型差异
2. 创建迁移脚本框架
3. 开始 API 端点实现

### 项目管理

- 每日站会: 9:00 AM (15 分钟)
- 周进度评审: 周五 3:00 PM
- 技术评审: 每阶段完成时
- 风险管理: 实时处理

### 沟通渠道

- 项目跟踪: 本文档 + Todo 列表
- 技术讨论: GitHub Issues (upgrade tag)
- 代码审查: Pull Requests (upgrade-* 分支)
- 风险上报: 项目经理 + 技术负责人

---

## 🔄 修订历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| 1.0 | 2026-03-19 | 初始项目计划 | Claude |
| - | - | - | - |

---

**项目状态**: 🟢 **准备启动**
**下一个检查点**: 确认升级分支和数据库备份
**联系人**: 技术负责人

