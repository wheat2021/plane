# requirement-reimport-2026

将 5 个迭代（0131/0307/0328/0425/0523）的 Jira 需求数据导入 Plane。

## 目录结构

```
requirement-reimport-2026/
├── README.md                        # 本文件
├── source/                          # 原始数据（只读，不修改）
│   ├── 26-0131迭代需求管理（业务+内生）.xlsx
│   ├── 26-0307迭代需求(业务+内生).xlsx
│   ├── 26-0328迭代需求(业务+内生).xlsx
│   ├── 26-0425迭代需求(业务+内生).xlsx
│   ├── 26-0523迭代需求(业务+内生).xlsx
│   └── Jira modules.csv
├── build_import_csv.py              # Step 1：将 XLSX 转换为 import_ready CSV
├── reimport_all.py                  # Step 2：执行导入
└── requirements_import_ready.csv   # 中间文件（由 build_import_csv.py 生成）
```

## 执行步骤

### Step 1：生成 import_ready CSV

```bash
cd data/requirement-reimport-2026
python3 build_import_csv.py
# 输出：requirements_import_ready.csv（189 行）
```

### Step 2：导入到目标环境

```bash
# Dev 环境（清空重导）
python3 reimport_all.py --env dev --clean

# 生产环境（首次运行，自动创建 extra properties）
python3 reimport_all.py --env prod --clean
```

## 导入内容

| 内容               | 数量                             |
| ------------------ | -------------------------------- |
| Requirement issues | 189 条                           |
| Cycles             | 5 个（0131/0307/0328/0425/0523） |
| Modules            | 10 个                            |
| Extra Properties   | 18 个（首次运行自动创建）        |

## State 策略

- 0131/0307/0328/0425（已结束迭代）→ **Done**
- 0523（进行中迭代）→ **Backlog**

## 注意事项

- `--clean` 会删除目标环境所有 Requirement issues，生产环境谨慎使用
- 生产环境需设置 `PROD_API_TOKEN`、`PROD_BASE_URL`、`PROD_PROJECT_ID` 环境变量
- 脚本通过 `docker exec -i plane-api-1` 执行，需确保容器运行中
