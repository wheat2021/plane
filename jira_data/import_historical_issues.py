#!/usr/bin/env python3
"""
批量导入历史迭代需求 Issue 并关联 Cycle/Module
"""
import csv
import json
import time
import sys
import os

# Django setup
sys.path.insert(0, "/code")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

import django
django.setup()

from plane.db.models import Issue, CycleIssue, ModuleIssue, Cycle, Module, IssueType, State
from plane.db.models import Workspace, WorkspaceMember
import uuid as _uuid

PROJECT_ID   = "18b7ccc8-4b96-4af0-8c6f-76550cba28a7"
WORKSPACE_ID = None  # will be resolved

def get_workspace():
    return Workspace.objects.get(slug="ficc")

def get_created_by():
    ws = get_workspace()
    return WorkspaceMember.objects.filter(workspace=ws, role=20).first().member

def import_csv(csv_path, cycle_label):
    ws = get_workspace()
    created_by = get_created_by()

    with open(csv_path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"\n[{cycle_label}] 开始导入 {len(rows)} 条...")
    created_issues = []
    errors = []

    for i, row in enumerate(rows):
        try:
            ep_raw = row.get("extra_properties", "{}")
            ep = json.loads(ep_raw) if ep_raw else {}

            # extra_properties 字段处理：移除 techLead（用 Issue 标准字段）
            # 保留其余 extra property 键值
            extra_props = {k: v for k, v in ep.items() if k not in ("techLead",)}

            issue = Issue(
                project_id=PROJECT_ID,
                workspace=ws,
                name=row["name"][:255],
                description_html=row.get("description_html", "") or "",
                state_id=row["state_id"],
                type_id=row["type_id"] or None,
                external_id=row.get("external_id") or None,
                external_source=row.get("external_source") or None,
                created_by=created_by,
                updated_by=created_by,
                extra_properties=extra_props,
            )
            issue.save()
            created_issues.append({
                "id": str(issue.id),
                "name": row["name"],
                "cycle_id": row.get("cycle_id", ""),
                "module_id": row.get("module_id", ""),
            })

            if (i + 1) % 10 == 0:
                print(f"  [{cycle_label}] {i+1}/{len(rows)} 已创建...")
            time.sleep(0.1)

        except Exception as e:
            errors.append({"row": i+1, "name": row.get("name","?"), "error": str(e)})
            print(f"  ✗ 行{i+1} 错误: {e}")

    print(f"  [{cycle_label}] 创建完成: {len(created_issues)}/{len(rows)}, 错误: {len(errors)}")

    # 关联 Cycle
    cycle_id = rows[0].get("cycle_id", "") if rows else ""
    if cycle_id:
        cycle_issues = [
            CycleIssue(
                cycle_id=cycle_id,
                issue_id=item["id"],
                project_id=PROJECT_ID,
                workspace=ws,
                created_by=created_by,
                updated_by=created_by,
            )
            for item in created_issues
        ]
        CycleIssue.objects.bulk_create(cycle_issues, ignore_conflicts=True)
        print(f"  [{cycle_label}] 关联 Cycle {cycle_id[:8]}...: {len(cycle_issues)} 条")

    # 关联 Module（仅 module_id 非空的行）
    module_items = [item for item in created_issues if item["module_id"]]
    if module_items:
        module_issues = [
            ModuleIssue(
                module_id=item["module_id"],
                issue_id=item["id"],
                project_id=PROJECT_ID,
                workspace=ws,
                created_by=created_by,
                updated_by=created_by,
            )
            for item in module_items
        ]
        ModuleIssue.objects.bulk_create(module_issues, ignore_conflicts=True)
        print(f"  [{cycle_label}] 关联 Module: {len(module_issues)} 条")

    return created_issues, errors


if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))

    all_results = {}
    for cycle, csv_file in [
        ("0131", "26-0131_import_ready.csv"),
        ("0307", "26-0307_import_ready.csv"),
        ("0328", "26-0328_import_ready.csv"),
    ]:
        path = os.path.join(base, csv_file)
        issues, errs = import_csv(path, cycle)
        all_results[cycle] = {"count": len(issues), "errors": len(errs), "issues": issues}

        # 保存 JSON
        out_path = f"/tmp/{cycle}_imported_issues.json"
        with open(out_path, "w") as f:
            json.dump(issues, f, ensure_ascii=False, indent=2)
        print(f"  已保存 UUID 列表 → {out_path}")

    print("\n=== 导入汇总 ===")
    total = 0
    for cycle, res in all_results.items():
        print(f"  {cycle}: {res['count']} 条成功, {res['errors']} 条错误")
        total += res["count"]
    print(f"  合计: {total} 条")
