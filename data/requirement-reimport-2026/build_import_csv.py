#!/usr/bin/env python3
"""
将 5 个迭代 XLSX 文件统一转换为 requirements_import_ready.csv（v1.3 格式）

用法：
  python build_import_csv.py

输出：
  jira_data/requirements_import_ready.csv
"""

import csv
import json
import os
import re
import warnings

import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation

# ── 修复 openpyxl DataValidation bug ─────────────────────────────────────────
_orig_dv_init = DataValidation.__init__
def _patched_dv_init(self, **kwargs):
    kwargs.pop("id", None)
    _orig_dv_init(self, **kwargs)
DataValidation.__init__ = _patched_dv_init
warnings.filterwarnings("ignore")

# ── 常量 ──────────────────────────────────────────────────────────────────────
DIR = os.path.dirname(os.path.abspath(__file__))
TYPE_ID  = "5e8c9352-8553-4e87-97dc-88594010f83a"   # Requirement
STATE_ID = "4657dc96-1572-41e3-becd-0ba3d4ff8e22"   # Backlog

# 姓名 → User UUID（从 Dev 环境导出）
NAME_UUID: dict[str, str] = {
    "朱泓飞": "b0c16d7f-e6db-46ed-b34e-ff2059b1c211",
    "王盛朋": "e7b11737-6f57-458f-9892-5a168e411edf",
    "胡越梅": "4978e59b-1897-4e58-bac2-d7c4ce167265",
    "高国伟": "1e6f0841-a0f9-40e4-82e5-dac8e39f2532",
    "钱高翔": "535b3838-1804-4a1f-8353-5320babd97b8",
    "郁东辉": "4c096d8f-4252-4a30-b322-91ea8cfbf644",
    "叶恺翔": "5ea6d7aa-57e3-4fc8-b536-a9fc3ba47ece",
    "朱海洋": "e81b9f1b-4561-4eee-9b5a-20dcd9755b8f",
    "何骁龙": "f51af434-3efc-4ae5-80be-5a62dbfa19fc",
    "刘爽": "0742034c-41bb-44c6-9710-f83c297eb80d",
    "刘佩金": "daa28f62-9d59-4c8a-9c93-28d931e72b99",
    "方乾": "2bbec74b-683c-404b-9b10-af8fac6d5083",
    "胡小忠": "2a0b966a-a46c-4f0c-bb69-13857f40940c",
    "姜健": "6068c167-7672-4b66-835c-4c5a9f382de7",
    "张梦易": "fbc9f87f-7f47-4238-a689-fe1372df4687",
    "韩文晋": "91200b08-e953-4179-9cba-1ef2d92ad510",
    "姚团结": "44e6b989-7847-4405-9f1c-2d216832bf04",
    "汪延明": "6a823509-470b-451a-a21c-fd65b5917cbf",
    "李润洲": "0af93331-bb2e-4c26-863f-ad9e28a53817",
    "姜玉珠": "15e4d327-6119-4941-85ac-624f7b021630",
    "赵亚丹": "25dc399e-2ba4-46bc-ad1f-e4909390629f",
    "孙林翠": "02bb21f9-3962-4f36-b57c-52501254f8e1",
    "楚尧杰": "b42ea0a5-92e8-49c5-b7a7-829a1c3af6d7",
    "耿贝贝": "85f855f9-8389-40a5-a2a7-93223348b734",
    "周硕飙": "a3ba7b13-1bb3-4ea9-b6a1-627a20e0dab7",
    "范恒亮": "57674c02-e8d7-4604-8f45-410c3fa7b922",
    "吴萍": "d7ec9715-c728-4649-95b8-8059fd8060f8",
    "黄树林": "38c1373b-2856-408d-806b-a4f98ef33cc0",
    "奚杰杰": "632980e5-a81f-49a0-b4dd-113257654d4b",
    "朱洲": "40e354f6-736f-43a4-9a11-194effc656e4",
    "夏庆飞": "6c2cb768-b63a-45b0-859e-859ab2345c4e",
    "唐超": "b9307fcf-2e0c-4081-b526-b84f755f6a37",
    "闻磊": "f3c11761-c49a-4e0c-befc-d08c882ad1d3",
    "张怀庆": "16acb2ba-0130-450f-a4ed-4dc5ba8d5135",
    "胡于凡": "1f032804-4e24-4b85-a5d3-e57bb39f84b4",
    "曾慧聪": "86316c00-0847-43a8-8176-834f264e0307",
    "李源畅": "1e739cda-5995-45e7-bc51-2caee897a355",
    "成楠": "6fe8459b-3b6b-4197-a29a-f95f2a7e20cc",
    "何薛树": "60e69163-9c1a-450b-b2ed-d76904957b38",
    "毕成功": "b5cf400d-4a1a-4daf-8ad7-dc33d720391c",
    "张勇": "16582936-504e-456b-9e53-43ac1a82b3cb",
    "夏清": "9a969130-2666-4604-9326-c2b17ca09ef1",
    "姚忠兵": "74c21a3b-1b9b-47f2-b7ab-b8195738260d",
    "徐可": "4c5f42cb-ef4c-434d-a3a2-5ff95917f260",
    "高波": "48cb3e78-8ff5-4a2f-abf1-87f01dcee12a",
    "高宇航": "a61b8e34-ca8c-45b9-91c4-72d66cf8b2bb",
    "齐秋灏": "c8955ad9-d86d-4b37-89df-b454a066b342",
    "李致远": "e202ab34-a1ae-43f4-a954-6acb32f61375",
    "赵俊普": "936fe47f-0e46-43e4-8ee9-4904fd9eafe1",
    "李华晋": "323e352b-2aed-4194-9989-a16ec32f1d66",
    "曹军": "add50f37-27f9-4dcd-9c0d-6bdbc5d77556",
    "董月升": "8dcc540d-dba9-49d8-82dd-d25105174ffc",
    "张煦渤": "32626855-220a-4324-9109-ff74c925038c",
    "孙大卫": "50fdbbab-4326-464d-a159-07e47bf4c7fb",
    "崔冬": "4a31d3be-ce15-4ecc-8c3e-a1fbcbe4f597",
    "严乐乐": "27c016ee-2235-49a4-887a-7dfffd86096a",
    "卞恺": "cf98ab15-e19a-4e28-acdb-100c9a0ca3d3",
    "孙权": "cdaef0e8-d2a7-43eb-a28f-6137f77ebc21",
    "王辉": "a72343b1-6d74-4fb0-b8ee-48882b846e94",
    "刘涛": "a3d9f610-6cfe-46ee-961a-b574ec7a172b",
    "习云飞": "329e8423-074d-4cda-99fa-472740687bf0",
    "王轮樟": "98cb9446-ac30-4857-9c77-644999e62d52",
    "王西峰": "ee31178b-09ee-4d85-a3dd-7302c10c3af5",
    "孙丰鑫": "cad6e39e-09bb-4d35-a356-db0a48db884f",
    "戚挺": "0d5d1a69-68ee-4885-9bb7-bf93e92eb4aa",
    "何鑫": "f4dc842e-9dcc-4050-8a58-03be227e36d4",
    "赵昱": "a308fe91-694e-4592-b3fe-93257785a28d",
    "于晓雨": "6fdf12b2-d15c-4ab8-ac5a-2f287aee8359",
    "吴克易琼": "943c1313-5035-46a0-b1e2-91e3a19546a6",
    "张天翼": "f81bb5d7-a37c-4d34-b1fc-f92d46f5b2a8",
    "沈彦捷": "2352b082-1616-4423-a9a2-8ac1e8b9a389",
    "刘德宽": "7ed5c2c4-497b-4392-9619-4b1987473308",
    "邓光明": "f3835cd4-74ae-4b08-ba57-6f59236d7c17",
    "陆中骞": "e2434a19-0815-493f-8f9c-e4a08d72b9cc",
    "王玥": "b51d6712-35b2-4c9b-8480-09bec319c4a2",
    "姜瀚": "c2929876-1c9a-4ce1-9258-cf3e287df9c6",
    "许可": "14b265fe-200d-46aa-8e25-66f57a1e130d",
    "孙玉涵": "8baed4ad-64c0-4922-b4bb-e9d77a865fd7",
    "王亮": "903d85c3-2f0a-4582-8ad8-e3f3c53f4240",
    "马志伟": "83886f15-62af-4860-b67e-ddc8f74b645d",
    "原志伟": "3239c00e-ddb4-4fbf-9b01-8b2c88ff8870",
    "王俊": "37e8cf69-53d3-4f11-a1ec-594e56b4119e",
    "陈志宝": "3a43fac4-6a60-42e4-a1b8-3f434ce9cf87",
    "张龙": "f571c740-8443-46cc-9ab0-a38c095b93ad",
    "张弦": "144bf735-9e10-4029-84d0-85e3749bf5d3",
    "季鸿坤": "c0cca8c8-df5a-472b-b9a6-80c518d47dde",
    "张俊": "ee12bda6-18fc-4ad5-a35e-74c256781157",
    "陈思唯": "419abc95-ee44-4353-8090-a58bc8723922",
    "李楠": "a2fd47da-ee6f-4f0a-963f-e6ff769eb0a1",
    "陈宇": "5ac3485a-8d93-454c-bd0d-0c048df1ba42",
    "李健华": "14a99e14-7fc4-464c-9d7f-ec7e50cf91b3",
    "罗文辉": "35625ebb-7684-4d2f-a60e-e845c140afe9",
    "陈治平": "77342d2f-a6cf-4a2d-8142-2f5f84d0636a",
}

# ── 迭代配置（每列索引从 1 开始） ────────────────────────────────────────────
# cols 中 None 表示该迭代无此字段
ITERATIONS = [
    {
        "xlsx": "26-0131迭代需求管理（业务+内生）.xlsx",
        "sheet": "0131-需求列表",
        "cycle_name": "大象-常规-26-0131",
        "skip_rows": 1,
        "cols": {
            "department": 1, "req_source": 2, "name": 3, "description": None,
            "domestic_overseas": 4, "category_l1": 5, "category_l2": 6, "category_l3": 7,
            "center": 8, "team": 9, "biz_pm": 11, "biz_priority": None,
            "it_pm": 12, "tech_lead": 13, "module": None,
            "admission": 14, "in_delivery": 15,
            "estimated_iteration": 16, "delivery_content": 17, "remarks": None,
        },
    },
    {
        "xlsx": "26-0307迭代需求(业务+内生).xlsx",
        "sheet": "0307-需求列表",
        "cycle_name": "大象-常规-26-0307",
        "skip_rows": 1,
        "cols": {
            "department": 1, "req_source": 2, "name": 3, "description": 4,
            "domestic_overseas": 5, "category_l1": 6, "category_l2": 7, "category_l3": 8,
            "center": 9, "team": 10, "biz_pm": 12, "biz_priority": 13,
            "it_pm": 14, "tech_lead": 15, "module": None,
            "admission": 16, "in_delivery": 17,
            "estimated_iteration": 18, "delivery_content": None, "remarks": None,
        },
    },
    {
        "xlsx": "26-0328迭代需求(业务+内生).xlsx",
        "sheet": "0328-需求列表",
        "cycle_name": "大象-常规-26-0328",
        "skip_rows": 1,
        "cols": {
            "department": 1, "req_source": 2, "name": 3, "description": 4,
            "domestic_overseas": 5, "category_l1": 6, "category_l2": 7, "category_l3": 8,
            "center": 9, "team": 10, "biz_pm": 12, "biz_priority": 13,
            "it_pm": 14, "tech_lead": 15, "module": 16,
            "admission": 17, "in_delivery": 18,
            "estimated_iteration": None, "delivery_content": None, "remarks": None,
        },
    },
    {
        "xlsx": "26-0425迭代需求(业务+内生).xlsx",
        "sheet": None,   # 使用默认 active sheet
        "cycle_name": "大象-常规-26-0425",
        "skip_rows": 2,  # 两行表头
        "cols": {
            "department": 2, "req_source": 3, "name": 4, "description": None,
            "domestic_overseas": 1, "category_l1": None, "category_l2": None, "category_l3": None,
            "center": 5, "team": 6, "biz_pm": None, "biz_priority": 13,
            "it_pm": 8, "tech_lead": 9, "module": None,
            "admission": None, "in_delivery": None,
            "estimated_iteration": None, "delivery_content": 14, "remarks": None,
        },
    },
    {
        "xlsx": "26-0523迭代需求(业务+内生).xlsx",
        "sheet": None,
        "cycle_name": "大象-常规-26-0523",
        "skip_rows": 1,
        "cols": {
            "department": 1, "req_source": 2, "name": 3, "description": 4,
            "domestic_overseas": 5, "category_l1": 6, "category_l2": 7, "category_l3": 8,
            "center": 9, "team": 10, "biz_pm": 12, "biz_priority": 13,
            "it_pm": 14, "tech_lead": 15, "module": 16,
            "admission": 17, "in_delivery": 18,
            "estimated_iteration": 19, "delivery_content": 20, "remarks": 21,
        },
    },
]

CSV_COLUMNS = [
    "name", "description_html", "type_id", "state_id", "priority",
    "assignees", "extra_properties", "cycle_name", "module_name",
]


# ── 工具函数 ──────────────────────────────────────────────────────────────────

def cell(row: tuple, idx: int | None) -> str | None:
    """1-indexed，返回去空格字符串或 None"""
    if idx is None or idx < 1:
        return None
    i = idx - 1
    if i >= len(row):
        return None
    v = row[i]
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def make_description_html(text: str | None) -> str:
    if not text:
        return "<p></p>"
    paragraphs = str(text).strip().split("\n")
    result = "".join(f"<p>{p.strip()}</p>" for p in paragraphs if p.strip())
    return result or "<p></p>"


def resolve_names_to_uuids(raw: str | None) -> list[str]:
    """将复合姓名（"甲/乙"）解析为 UUID 列表，未匹配的跳过并打印 warning"""
    if not raw:
        return []
    parts = [p.strip() for p in re.split(r"[/，,、]", raw) if p.strip()]
    uuids = []
    for name in parts:
        uid = NAME_UUID.get(name)
        if uid:
            uuids.append(uid)
        else:
            print(f"  ⚠ 姓名未匹配: {name!r}")
    return uuids


def resolve_name_to_uuid(raw: str | None) -> str | None:
    """单个姓名（复合时取第一个匹配），返回 UUID 或 None"""
    if not raw:
        return None
    parts = [p.strip() for p in re.split(r"[/，,、]", raw) if p.strip()]
    for name in parts:
        uid = NAME_UUID.get(name)
        if uid:
            return uid
    if parts:
        print(f"  ⚠ 技术负责人未匹配: {raw!r}")
    return None


def bool_field(raw: str | None) -> bool | None:
    if raw is None:
        return None
    return raw.strip() in ("是", "yes", "Yes", "true", "True", "1")


def load_xlsx(xlsx_name: str, sheet: str | None) -> list[tuple]:
    path = os.path.join(DIR, "source", xlsx_name)
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[sheet] if sheet else wb.active
    return list(ws.iter_rows(values_only=True))


# ── 主解析函数 ────────────────────────────────────────────────────────────────

def parse_iteration(cfg: dict) -> list[dict]:
    rows = load_xlsx(cfg["xlsx"], cfg["sheet"])
    data_rows = rows[cfg["skip_rows"]:]
    cols = cfg["cols"]
    cycle_name = cfg["cycle_name"]

    records = []
    skipped = 0

    for row in data_rows:
        name = cell(row, cols["name"])
        if not name:
            skipped += 1
            continue

        req_source = cell(row, cols["req_source"])

        # ── assignees：IT产品经理 → UUID 列表 ──────────────────────────────
        it_pm_raw = cell(row, cols["it_pm"])
        assignees = resolve_names_to_uuids(it_pm_raw)

        # ── extra_properties ──────────────────────────────────────────────
        ep: dict = {}

        def ep_set(key: str, col_key: str):
            v = cell(row, cols.get(col_key))
            if v:
                ep[key] = v

        if req_source:
            ep["req_source"] = req_source

        ep_set("department",          "department")
        ep_set("domestic_overseas",   "domestic_overseas")
        ep_set("category_l1",         "category_l1")
        ep_set("category_l2",         "category_l2")
        ep_set("category_l3",         "category_l3")
        ep_set("center",              "center")
        ep_set("team",                "team")
        ep_set("biz_pm",              "biz_pm")
        ep_set("biz_priority",        "biz_priority")
        ep_set("estimated_iteration", "estimated_iteration")
        ep_set("delivery_content",    "delivery_content")
        ep_set("remarks",             "remarks")

        # techLead → extra_properties（取第一个匹配）
        tech_lead_uuid = resolve_name_to_uuid(cell(row, cols["tech_lead"]))
        if tech_lead_uuid:
            ep["techLead"] = tech_lead_uuid

        # bool 字段
        admission_val = bool_field(cell(row, cols.get("admission")))
        if admission_val is not None:
            ep["admission"] = str(admission_val).lower()  # "true"/"false"

        in_delivery_val = bool_field(cell(row, cols.get("in_delivery")))
        if in_delivery_val is not None:
            ep["in_delivery"] = str(in_delivery_val).lower()

        # ── module_name ───────────────────────────────────────────────────
        raw_module = cell(row, cols.get("module"))
        module_name = "" if (not raw_module or raw_module == "无") else raw_module

        records.append({
            "name": name,
            "description_html": make_description_html(cell(row, cols["description"])),
            "type_id": TYPE_ID,
            "state_id": STATE_ID,
            "priority": "none",
            "assignees": json.dumps(assignees, ensure_ascii=False),
            "extra_properties": json.dumps(ep, ensure_ascii=False),
            "cycle_name": cycle_name,
            "module_name": module_name,
        })

    print(f"  {cfg['cycle_name']}: {len(records)} 条，跳过 {skipped} 行")
    return records


# ── 入口 ──────────────────────────────────────────────────────────────────────

def main():
    output_path = os.path.join(DIR, "requirements_import_ready.csv")
    all_records: list[dict] = []

    print("开始转换 XLSX → CSV ...")
    for cfg in ITERATIONS:
        all_records.extend(parse_iteration(cfg))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(all_records)

    print(f"\n✅ 已生成 {output_path}")
    print(f"   总行数: {len(all_records)}")


if __name__ == "__main__":
    main()
