# Work Item Type Dropdown 实现

## 目标

在创建 work item 对话框中添加类型选择器，支持 Requirement、Story、Bug 三种类型，带图标，样式与项目下拉框一致。

## 方法

利用现有的 IssueType 模型基础设施，添加 API 端点、前端服务和组件。

## 开发日志

### 2026-01-28 16:45 - 开始实现

按计划顺序实现：数据迁移 → API 端点 → Service → Store → Hook → 组件

### 2026-01-28 17:20 - 完成所有核心组件

**后端新增文件:**

- `apps/api/plane/app/serializers/issue_type.py` - IssueType 序列化器
- `apps/api/plane/app/views/workspace/issue_type.py` - API 端点
- `apps/api/plane/db/migrations/0118_seed_default_issue_types.py` - 数据迁移

**后端修改文件:**

- `apps/api/plane/app/serializers/__init__.py` - 导出序列化器
- `apps/api/plane/app/views/__init__.py` - 导出端点
- `apps/api/plane/app/urls/workspace.py` - 添加路由

**前端新增文件:**

- `packages/types/src/issue-type.ts` - TypeScript 类型定义
- `apps/web/core/services/issue-type.service.ts` - API 服务
- `apps/web/core/store/issue-type.store.ts` - MobX Store
- `apps/web/core/hooks/store/use-issue-type.ts` - React Hook

**前端修改文件:**

- `packages/types/src/index.ts` - 导出类型
- `apps/web/core/store/root.store.ts` - 集成 store
- `apps/web/ce/components/issues/issue-modal/issue-type-select.tsx` - 实现组件

---

## 实现进度

- [x] 数据迁移 - 创建默认 IssueType
- [x] API ViewSet 和 Serializer
- [x] API 路由
- [x] TypeScript 类型定义
- [x] IssueType Service
- [x] IssueType Store
- [x] useIssueTypes Hook
- [x] IssueTypeSelect 组件
- [ ] Provider 更新 (现有 getIssueTypeIdOnProjectChange 已支持，暂不需要修改)

## 总结

成功实现 Work Item Type 下拉选择器功能：

1. **API 端点**: `GET /api/workspaces/{slug}/issue-types/` 返回 workspace 级别的 issue 类型列表
2. **数据迁移**: 为现有 workspace 创建 Requirement（默认）、Story、Bug 三种类型
3. **前端组件**: 使用 Combobox + Popper 实现下拉选择，样式与 ProjectDropdown 一致
4. **图标支持**: 使用 lucide-react 图标，颜色从 logo_props.icon.color 读取

## 验证方案

1. 运行数据迁移: `python manage.py migrate`
2. 启动服务后访问创建 work item 对话框
3. 确认类型下拉框显示在项目选择器旁边
4. 选择不同类型确认图标和名称正确
5. 提交表单确认 type_id 正确传递
