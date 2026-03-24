## 1. 创建 req_source Extra Property

- [x] 1.1 Django Shell：创建 `req_source` ExtraPropertyConfig（workspace=ficc, key=req_source, label=需求编号, type=text, config={}）
- [x] 1.2 Django Shell：将 req_source 绑定到 Requirement IssueType（project=FICC, is_required=False）
- [x] 1.3 验证：查询 Requirement 类型的 extra properties，确认 req_source 已存在

## 2. 迁移历史数据

- [x] 2.1 Django Shell：查询所有 Requirement issue，统计 external_id 非空的数量
- [x] 2.2 Django Shell：将 external_id 值写入 req_source extra property（逐条更新 description_html 以外的 extra_properties JSON）
- [x] 2.3 Django Shell：清空已迁移 issue 的 external_id 和 external_source 字段
- [x] 2.4 验证：随机抽查3条 issue，确认 req_source 有值且 external_id 为 null

## 3. 更新 plane-migrate Skill

- [x] 3.1 更新字段映射表：`需求编号列 → extra_properties.req_source`（删除 external_id / external_source 行）
- [x] 3.2 更新 Phase 4 TRANSFORM：生成 import_ready CSV 时，需求编号写入 extra_properties 而非独立列
- [x] 3.3 更新 Phase 5 IMPORT：POST payload 删除 external_id / external_source 字段，删除 409 重复保护逻辑
- [x] 3.4 更新 SKILL.md 版本号（1.2 → 1.3）并更新相关注释说明
