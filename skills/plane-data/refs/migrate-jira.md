# 场景：Jira CSV/XLSX → Plane 迁移

## 调用形式

```
/plane-data migrate <文件名> <work_item_type> [cycle名称]
```

文件默认在 `/opt/code/plane/jira_data/`，支持 `.csv` 和 `.xlsx`。

---

## 五阶段工作流

### Phase 1: INSPECT（自动执行）

**1a. 解析文件**

```python
import os, csv
filepath = '/opt/code/plane/jira_data/<filename>'
ext = os.path.splitext(filepath)[1].lower()

if ext == '.csv':
    with open(filepath, encoding='utf-8') as f:
        sample = f.read(2048); f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=',;')
        reader = csv.DictReader(f, dialect=dialect)
        rows = list(reader)

elif ext in ('.xlsx', '.xls'):
    # ⚠️ openpyxl DataValidation 兼容补丁（必须在 import 前）
    import openpyxl.worksheet.datavalidation as dv
    _orig = dv.DataValidation.__init__
    def _patched(self, *a, **kw): kw.pop('id', None); _orig(self, *a, **kw)
    dv.DataValidation.__init__ = _patched

    import openpyxl
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active
    all_rows = list(ws.iter_rows(values_only=True))
    headers = all_rows[0]
    rows = [
        {str(headers[i]): row[i] for i in range(len(headers)) if headers[i] is not None}
        for row in all_rows[1:] if any(v is not None for v in row)
    ]
```

**1b. 匹配 IssueType**（Django Shell 查询）

**1c. 查询已有 EP bindings**

**1d. 查询辅助数据**（REST API: members, states, cycles, modules）

### Phase 2: GAP REPORT（展示给用户确认）

**标准字段映射表**：

| Jira 列                | Plane 字段                    | 说明              |
| ---------------------- | ----------------------------- | ----------------- |
| summary / 需求名       | `name`                        | 最多 255 字符     |
| description / 需求描述 | `description_html`            | pandoc 转换       |
| assignee               | `assignees`                   | display_name 匹配 |
| status                 | `state`                       | 模糊匹配          |
| sprint / sprint.0      | cycle 关联                    | 同名匹配          |
| key / 需求编号         | `extra_properties.req_source` | 溯源标签          |

**EP 类型推断规则**：

| 条件                            | 建议类型 |
| ------------------------------- | -------- |
| 值与成员 display_name 重叠 >50% | member   |
| 唯一值 ≤15 且长度 <30           | select   |
| 布尔值域（是/否/Yes/No）        | checkbox |
| 含 http(s)://                   | text     |
| 平均长度 >100                   | textarea |
| 其余                            | text     |

**State 模糊匹配**：完全相同 → 包含关系 → 常见映射（待办→Backlog, 处理中→In Progress, 完成→Done, 关闭→Cancelled）→ 未匹配则要求用户指定。

**输出格式**：已映射字段 ✅、已有 EP、候选 Module 关联列、需新建 EP、无法映射列。等待用户确认。

### Phase 3: CONFIG（创建 EP + Cycle + Module）

用户确认后执行。代码模板见 `ops-schema.md`。

> ⚠️ 创建 Cycle/Module 必须用 Django Shell，REST API 有 bug。

### Phase 4: TRANSFORM（生成 import_ready CSV）

生成 `jira_data/<basename>_import_ready.csv`：

```
name, description_html, type_id, state_id, priority, assignees(JSON), extra_properties(JSON), cycle_id, module_id
```

**description_html 转换**：用 pandoc（在宿主机运行）：

```python
import subprocess
def wiki_to_html(text):
    if not text or not text.strip():
        return '<p></p>'
    result = subprocess.run(['pandoc', '-f', 'jira', '-t', 'html'],
                            input=text, capture_output=True, text=True, timeout=10)
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return ''.join(f'<p>{l}</p>' for l in lines)
```

展示前 3 行预览，等待确认。

### Phase 5: IMPORT（执行导入）

**≤50 条**：REST API 逐条 POST（sleep 0.3s）

**>50 条**：Django Shell bulk_create（见 `ops-issue.md`）

导入后批量关联 Cycle / Module。

**最终汇总**：成功/失败数、Cycle 关联数、Module 关联数。

---

## 更新模式（新增）

```
/plane-data migrate <文件名> <type> --mode update --match-by name
```

按 `name` 匹配已有 issue，只更新有差异的字段。GAP REPORT 中显示：

```
新增: N 条（外部有，Plane 无）
更新: N 条（两边都有，字段有差异）
无变化: N 条
Plane 独有: N 条（Plane 有，外部无）
```
