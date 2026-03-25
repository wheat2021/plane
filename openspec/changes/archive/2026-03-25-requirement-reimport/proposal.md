## Why

前期多次使用 plane-migrate 技能导入需求数据，由于标准不一致，导致数据重复、格式混乱（部分使用旧 external_id 字段，部分缺失 extra properties）。需要从源头（XLSX 文件）重新生成一份规范的导入数据，在 Dev 环境验证后同步至生产环境。

## What Changes

- 新增 `build_import_csv.py`：将 5 个迭代 XLSX 文件统一转换为单一 `requirements_import_ready.csv`（v1.3 格式，req_source 写入 extra_properties）
- 新增 `import_users.py`：从 `prod_user_import.json` 批量导入用户及 workspace 成员关系（生产专用）
- 新增 `reimport_all.py`：自动创建 Cycles、Modules，然后从 `requirements_import_ready.csv` 导入所有 Requirement issues

## Capabilities

### New Capabilities

- `build-import-csv`：读取 5 个迭代 XLSX（0131/0307/0328/0425/0523），统一转换为符合 plane-migrate v1.3 格式的单一 CSV，输出至 `jira_data/requirements_import_ready.csv`
- `import-users`：从 `jira_data/prod_user_import.json` 批量创建 User 记录（保留 password hash）并加入 workspace，支持幂等运行（跳过已存在用户）
- `reimport-requirements`：自动 lookup-or-create 5 个 Cycles（按名称）和 10 个 Modules（从 `Jira modules.csv` 创建，含 Assignee），从 `requirements_import_ready.csv` 批量导入 Requirement issues，支持 `--env dev/prod` 参数

### Modified Capabilities

（无）

## Impact

- `jira_data/` 目录下新增 3 个脚本 + 1 个生成的 CSV
- 所有脚本通过 Plane HTTP API 操作（不直接写 DB），Dev/Prod 通用
- 依赖 `jira_data/prod_user_import.json`（已导出，93 个用户）和 `jira_data/Jira modules.csv`（已存在）
- 不修改任何 Plane 源码，无上游冲突风险
