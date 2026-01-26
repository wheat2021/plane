# API 参考文档

本目录包含 Plane 项目 API 的参考文档和开发笔记。

## 📋 文档列表

### 开发笔记

- **[Work Item Types API 验证报告](work-item-types-verification.md)** - 后端 API 实现验证
  - 数据模型验证 (IssueType, ProjectIssueType)
  - API 视图和序列化器检查
  - URL 路由配置验证
  - 数据迁移确认

- **[Work Item Types API 实现总结](work-item-types-implementation.md)** - API 实现记录
  - 序列化器实现 (IssueTypeSerializer, ProjectIssueTypeSerializer)
  - API 视图和端点 (ViewSet)
  - URL 路由配置
  - 数据迁移脚本

## 🎯 文档用途

### 开发参考

这些文档主要用于：
- 📝 记录 API 开发过程
- 🔍 验证 API 实现完整性
- 📊 追踪功能开发进度
- 🛠️ 为未来开发提供参考

### API 功能模块

| 功能模块 | 验证文档 | 实现文档 | 状态 |
|---------|---------|---------|------|
| **Work Item Types** | ✅ 已验证 | ✅ 已实现 | 完成 |

## 📚 API 架构概览

### Django REST API 结构

```
apps/api/plane/
├── api/                          # API 层
│   ├── views/                    # API 视图
│   │   └── issue_type.py        # 工作项类型视图
│   ├── serializers/              # 序列化器
│   │   └── issue_type.py        # 工作项类型序列化器
│   └── urls/                     # URL 路由
│       └── ...
│
├── db/models/                    # 数据模型层
│   ├── issue_type.py            # IssueType 模型
│   └── ...
│
└── migrations/                   # 数据库迁移
    └── ...
```

### Work Item Types API 端点

| 端点 | 方法 | 说明 |
|-----|------|------|
| `/api/workspaces/{slug}/issue-types/` | GET | 获取工作区工作项类型列表 |
| `/api/workspaces/{slug}/issue-types/` | POST | 创建工作项类型 |
| `/api/workspaces/{slug}/issue-types/{id}/` | GET | 获取单个工作项类型 |
| `/api/workspaces/{slug}/issue-types/{id}/` | PATCH | 更新工作项类型 |
| `/api/workspaces/{slug}/issue-types/{id}/` | DELETE | 删除工作项类型 |
| `/api/projects/{id}/issue-types/` | GET | 获取项目工作项类型 |
| `/api/projects/{id}/issue-types/{type_id}/` | PATCH | 更新项目工作项类型设置 |

## 🛠️ 开发工作流

### API 开发标准流程

1. **需求验证** → 验证报告文档
2. **数据模型设计** → 创建/更新 Django 模型
3. **序列化器实现** → 创建序列化器类
4. **视图和端点** → 创建 ViewSet 和路由
5. **数据迁移** → 生成迁移脚本
6. **测试验证** → 单元测试和集成测试
7. **实现总结** → 实现总结文档

### 验证清单

- [ ] 数据模型已定义
- [ ] 序列化器已实现
- [ ] ViewSet 已创建
- [ ] URL 路由已配置
- [ ] 数据迁移已执行
- [ ] API 端点可访问
- [ ] 文档已更新

## 📊 数据模型

### IssueType (工作区级别)

```python
class IssueType(BaseModel):
    """工作区级别的工作项类型"""
    workspace = models.ForeignKey(Workspace)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=7, default="#000000")
    is_default = models.BooleanField(default=False)
```

### ProjectIssueType (项目级别)

```python
class ProjectIssueType(ProjectBaseModel):
    """项目级别的工作项类型配置"""
    issue_type = models.ForeignKey(IssueType)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=65535)
```

## 💡 开发建议

- ✅ **遵循 Django REST 最佳实践**
- ✅ **使用序列化器进行数据验证**
- ✅ **保持 ViewSet 简洁，复杂逻辑放到 Model 或 Service 层**
- ✅ **为所有 API 添加适当的权限检查**
- ✅ **使用 Django 的 QuerySet 优化避免 N+1 查询**
- ✅ **记录开发过程和决策**

## 📚 相关文档

- [架构设计 - 数据模型](data-models.md) - 完整的数据模型文档
- [Django REST 官方文档](https://www.django-rest-framework.org/) - DRF 参考
- [部署指南](19_repo_doc_ref/plane/03-guides/deployment/deployment-guide.md) - API 部署配置

## 🔄 文档更新

| 日期 | 更新内容 |
|------|---------|
| 2025-12-30 | 创建 API 参考目录，整理 Work Item Types 验证和实现文档 |

---

**文档维护**: Backend Dev Team
**最后更新**: 2025-12-30
