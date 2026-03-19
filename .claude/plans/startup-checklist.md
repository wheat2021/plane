# 🚀 升级项目启动清单

**项目**: Plane itemtype → preview 快速升级
**分支**: `claude/check-recent-push-d0Xwv`
**状态**: ✅ 初始化完成

---

## ✅ 项目初始化检查

- [x] 项目分支已创建: `claude/check-recent-push-d0Xwv`
- [x] 项目计划已制定: `/home/user/plane/.claude/plans/upgrade-project-plan.md`
- [x] 项目 Todo 已创建: 四个主要阶段
- [x] 核心目录确认完整:
  - ✅ apps/api (Django 后端)
  - ✅ apps/web (主前端)
  - ✅ apps/admin (管理面板)
  - ✅ apps/space (公共空间)
  - ✅ packages/* (共享包)

---

## 🎯 下一步：Phase 1 启动

### 任务 1: 环境准备 (今天完成)

```bash
# 1. 备份数据库 (如果使用本地 PostgreSQL)
docker compose -f compose.dev.yml down -v  # 注意：这会清除所有数据！
# 或者用导出方式备份
pg_dump -U <user> <database> > backup.sql

# 2. 更新依赖
pnpm install

# 3. 启动开发环境
docker compose -f compose.dev.yml up -d  # 启动 PostgreSQL, Redis 等
pnpm dev                                   # 启动前端开发服务器
```

### 任务 2: Phase 1 前期分析 (第 1-2 天)

#### 2.1 分析 Extra Property 数据模型

**itemtype 分支中**:
```bash
# 在 itemtype 分支查看现有实现
git checkout remotes/origin/itemtype
grep -r "extra_propert" apps/api/plane/db/models/ | head -20
```

**Preview 分支中**:
```bash
# 在 preview 分支查看目标实现
git checkout remotes/origin/preview
cat apps/api/plane/db/models/extra_property.py
```

**分析重点**:
- [ ] ExtraProperty 基础模型 vs ExtraPropertyConfig 对比
- [ ] 条件逻辑的数据结构
- [ ] Checkbox 图标配置的存储方式
- [ ] API 序列化器差异

#### 2.2 检查现有的 Extra Property 实现

```bash
# 查看 itemtype 中的 Extra Property 相关代码
git checkout remotes/origin/itemtype

# 搜索 extra property 的使用位置
find apps -name "*.py" -type f | xargs grep -l "extra_propert" | sort
find apps/web -name "*.tsx" -type f | xargs grep -l "extra" | sort
```

#### 2.3 制定迁移策略

基于分析结果，需要决定:
- [ ] 是否创建新表还是扩展现有表?
- [ ] 数据迁移脚本的方式 (Django migration vs 独立脚本)?
- [ ] 如何处理已有的 extra_property 数据?
- [ ] 向后兼容性如何保证?

### 任务 3: 技术方案设计 (第 2-3 天)

#### 3.1 数据库迁移方案

```markdown
# 迁移方案文档

## 当前状态 (itemtype)
- 表: issue_extra_property (数据)
- 模型: IssueExtraProperty

## 目标状态 (preview)
- 表: extra_property_config (配置)
- 表: issue_type_extra_property (绑定)
- 模型: ExtraPropertyConfig, IssueTypeExtraProperty

## 迁移步骤
1. 创建新表 (extra_property_config, issue_type_extra_property)
2. 从旧表导入配置到 extra_property_config
3. 创建 issue_type_extra_property 绑定
4. 验证数据完整性
5. 更新 Issue 模型
6. 删除旧表 (可选)
```

#### 3.2 API 端点设计

```markdown
# API 端点设计

## ExtraPropertyConfig API
- GET /api/workspaces/<slug>/extra-property-config/ (列表)
- POST /api/workspaces/<slug>/extra-property-config/ (创建)
- GET /api/workspaces/<slug>/extra-property-config/<id>/ (详情)
- PATCH /api/workspaces/<slug>/extra-property-config/<id>/ (更新)
- DELETE /api/workspaces/<slug>/extra-property-config/<id>/ (删除)

## IssueTypeExtraProperty API
- GET /api/workspaces/<slug>/projects/<project_id>/issue-types/<type_id>/extra-properties/ (列表)
- POST /api/workspaces/<slug>/projects/<project_id>/issue-types/<type_id>/extra-properties/ (创建)
- PATCH /api/workspaces/<slug>/projects/<project_id>/issue-types/<type_id>/extra-properties/<id>/ (更新)
```

#### 3.3 前端组件规划

```markdown
# 前端组件规划

## 新组件需求
- ExtraPropertyConfigEditor (配置编辑器)
- CheckboxIconSelector (Checkbox 图标选择器)
- ConditionalPropertyLogic (条件逻辑编辑)
- ExtraPropertyFieldForm (字段编辑表单)

## 修改现有组件
- IssueDetailPanel (显示 extra properties)
- IssueCreateForm (输入 extra properties)
- IssueListView (显示 extra property 列)
```

---

## 📋 Phase 1 详细工作分解

### Week 1

**Day 1-2: 数据模型分析**
- [ ] itemtype 的 ExtraProperty 模型分析
- [ ] preview 的 ExtraPropertyConfig 模型分析
- [ ] 映射关系文档编写

**Day 2-3: 数据库迁移脚本**
- [ ] Django migration 创建
- [ ] 迁移脚本测试
- [ ] 回滚脚本准备

**Day 3-5: API 实现**
- [ ] ExtraPropertyConfig 序列化器
- [ ] IssueTypeExtraProperty 序列化器
- [ ] API 视图实现
- [ ] API 端点测试

**Day 5-6: 前端组件**
- [ ] Extra Property 编辑表单
- [ ] Checkbox 图标选择器
- [ ] UI 集成测试

### Week 2

**Day 1-3: 完整测试**
- [ ] 单元测试编写
- [ ] 集成测试
- [ ] 数据完整性验证

**Day 3-5: Bug 修复和优化**
- [ ] 性能优化
- [ ] 错误处理改进
- [ ] 代码审查反馈处理

**Day 5-6: 准备下一阶段**
- [ ] Phase 1 总结文档
- [ ] Phase 2 准备工作
- [ ] 代码提交和审查

---

## 🔗 关键参考文件位置

### 需要研究的文件

**itemtype 分支**:
```bash
git checkout remotes/origin/itemtype

# Extra Property 相关
apps/api/plane/db/models/extra_property.py
apps/api/plane/app/serializers/extra_property.py
apps/api/plane/app/views/extra_property.py
apps/web/ce/components/issues/peek/extra_properties_form.tsx
```

**Preview 分支**:
```bash
git checkout remotes/origin/preview

# 目标实现
apps/api/plane/db/models/extra_property.py
apps/api/plane/app/serializers/extra_property.py
apps/api/plane/db/models/issue_type.py
```

---

## 🛠️ 工具和命令快速参考

### Git 操作
```bash
# 比较分支
git diff itemtype..preview -- apps/api/plane/db/models/extra_property.py

# 查看某个分支的文件内容
git show origin/preview:apps/api/plane/db/models/extra_property.py

# 返回当前工作分支
git checkout claude/check-recent-push-d0Xwv
```

### Django 管理命令
```bash
# 创建迁移
python manage.py makemigrations

# 应用迁移
python manage.py migrate

# 运行测试
python manage.py test

# 交互式 shell
python manage.py shell
```

### Python 开发
```bash
# 在 apps/api 目录运行
cd apps/api

# 安装依赖
pip install -r requirements.txt

# Ruff 检查
ruff check .

# Ruff 格式化
ruff format .
```

### 前端开发
```bash
# pnpm 开发
pnpm dev

# pnpm 构建
pnpm build

# ESLint 检查
pnpm check:lint

# 类型检查
pnpm check:types
```

---

## 💬 需要立即讨论的事项

### 1. Extra Property 迁移策略确认

**问题**: 是否需要保留 itemtype 的旧 Extra Property 实现的向后兼容性?

**可选方案**:
- A) 完全替换: 删除旧实现，完全迁移到新系统 ✅ (推荐)
- B) 并行支持: 同时支持旧实现和新实现 (复杂度高)
- C) 渐进迁移: 先支持新系统，逐步迁移数据

**建议**: 方案 A (完全替换) - itemtype 是自己的分支，可以安全地完全替换

### 2. 数据库备份策略

**问题**: 在进行大规模迁移前，如何备份?

**方案**:
- [ ] 使用 `pg_dump` 导出 SQL (推荐)
- [ ] 使用 Docker volume 快照
- [ ] 使用完整的数据库副本

**建议**: pg_dump 导出 SQL，方便恢复和检查

### 3. 测试环境隔离

**问题**: 是否需要独立的测试数据库进行迁移测试?

**建议**:
- [ ] 创建本地测试数据库
- [ ] 编写完整的迁移测试
- [ ] 预留回滚方案

---

## 📞 沟通计划

### 日常同步
- **每日站会**: 9:00 AM (15 分钟)
  - 进度更新
  - 遇到的问题
  - 今日计划

### 定期评审
- **周期评审**: 周五 3:00 PM
  - Phase 完成情况
  - 性能基准对比
  - 下个 Phase 计划

### 文档更新
- 每天更新 todo 列表
- 每周更新本 checklist
- 完成阶段时更新主计划

---

## 🎯 成功标志

### Phase 1 完成标志

✅ **功能完成**:
- 所有 Extra Property API 端点实现
- 前端编辑表单完成
- 数据完全迁移到新系统

✅ **测试通过**:
- 单元测试覆盖率 > 80%
- 集成测试 100% 通过
- 零数据丢失

✅ **性能验证**:
- API 响应时间无明显增加
- 前端组件加载时间 < 1s

✅ **代码质量**:
- 无 lint 错误
- 类型检查通过
- 代码审查通过

---

**下一步**:
1. ✅ 确认本清单内容
2. ⏳ 开始 Phase 1 Day 1 的数据模型分析
3. ⏳ 每日更新进度

**预计启动时间**: 立即可开始
**预计完成时间**: 2026-04-09 (3-4 周后)

