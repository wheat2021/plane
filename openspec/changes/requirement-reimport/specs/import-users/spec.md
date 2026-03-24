## ADDED Requirements

### Requirement: 从 JSON 文件批量导入用户

脚本 `import_users.py` SHALL 读取 `jira_data/prod_user_import.json`，为每个用户在目标环境创建 User 记录并加入 workspace。

#### Scenario: 导入新用户成功

- **WHEN** JSON 中某用户的 email 在目标环境不存在
- **THEN** 通过 Django Shell 创建 User 记录（保留原始 password hash）并加入 workspace

#### Scenario: 跳过已存在用户

- **WHEN** JSON 中某用户的 email 在目标环境已存在
- **THEN** 跳过创建，控制台打印 "已存在: <email>"，不报错

### Requirement: 保留 password hash 直接写入

导入时 SHALL 直接将原始 password hash 字段写入 User 记录，无需重新哈希。

#### Scenario: 用户导入后可直接登录

- **WHEN** 用户被导入到生产环境
- **THEN** 用户可以使用原密码登录，无需重置密码

### Requirement: 通过 Django Shell 执行（不通过 API）

用户创建 SHALL 通过 `docker exec plane-api-1 python manage.py shell` 执行，而非 Plane API（API 不支持设置 password hash）。

#### Scenario: Django Shell 批量创建

- **WHEN** 运行 `python import_users.py --env prod`
- **THEN** 脚本通过 subprocess 调用 Django Shell，一次性创建所有缺失用户

### Requirement: 导入完成后输出统计报告

脚本 SHALL 在执行完成后打印：已创建用户数、已跳过（已存在）数、失败数。

#### Scenario: 输出统计

- **WHEN** 脚本执行完毕
- **THEN** 控制台打印 "✅ 创建: N，跳过: M，失败: K"
