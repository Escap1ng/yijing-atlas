# -*- coding: utf-8 -*-
"""Merge the vernacular layer from chengjun/iching (MIT) into demo/hextext.js.

Only the "白话文解释" sentences are taken; later modern fortune-telling
sections (邵雍/傅佩荣/张铭仁 etc.) are deliberately skipped.
Fetch first:
  mkdir -p research/.tmp-iching
  gh api repos/chengjun/iching/tarball/HEAD > research/.tmp-iching/src.tar.gz
  tar -xzf research/.tmp-iching/src.tar.gz -C research/.tmp-iching
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "demo", "hextext.js")
SRC = glob.glob(os.path.join(ROOT, "research", ".tmp-iching", "*", "data"))[0]

LINE_RE = re.compile(r"(初[九六]|[九六][二三四五]|上[九六])爻辞")

# 源数据缺小过大象白话，补一条通行读法
FALLBACK_DAXIANG = {
    "小过": "山上响雷，是小过的卦象；君子由此行事宁可过于恭敬，居丧宁可过于哀伤，用度宁可过于节俭。",
}


def baihua_of(seg):
    i = seg.find("白话文解释")
    if i < 0:
        return ""
    j = seg.find("《象辞》说：", i)
    out = seg[i + 5:j] if j > 0 else seg[i + 5:i + 240]
    return re.sub(r"\s+", "", out)


def daxiang_of(head):
    i = head.find("《象辞》说：")
    if i < 0:
        return ""
    j = head.find("\n\n", i)
    out = head[i + 6:j] if j > 0 else head[i + 6:i + 200]
    return re.sub(r"\s+", "", out)


def parse(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"^(\S{1,3}?)卦原文", t)
    gua_name = m.group(1) if m else ""
    gua_name = {"遁": "遯"}.get(gua_name, gua_name)
    parts = LINE_RE.split(t)
    head = parts[0]
    segs = [(parts[k], parts[k + 1]) for k in range(1, len(parts) - 1, 2)]
    by_name = {}
    for name, body in segs:
        by_name.setdefault(name, baihua_of(body))
    return gua_name, baihua_of(head), daxiang_of(head), by_name


with open(TARGET, encoding="utf-8") as f:
    raw = f.read()
start = raw.index("{")
end = raw.rindex("}")
data = json.loads(raw[start:end + 1])

missing_gua = []
missing_line = []
for path in sorted(glob.glob(os.path.join(SRC, "*.text"))):
    code = os.path.basename(path).split(".")[0]
    gua_name, gua, daxiang, by_name = parse(path)
    entry = next((e for e in data.values() if e["name"] == gua_name), None)
    if entry is None:
        print("no entry for", code, gua_name)
        continue
    entry["baihua"] = gua
    entry["daxiangBaihua"] = daxiang or FALLBACK_DAXIANG.get(gua_name, "")
    if not gua:
        missing_gua.append(entry["id"])
    for i, ln in enumerate(entry["lines"]):
        b = by_name.get(ln["name"], "")
        ln["baihua"] = b
        if not b:
            missing_line.append((entry["id"], ln["name"]))

print("entries:", len(data))
print("missing gua baihua:", len(missing_gua), missing_gua[:8])
print("missing line baihua:", len(missing_line), missing_line[:8])

with open(TARGET, "w", encoding="utf-8") as f:
    f.write("// 经文为公有领域；白话取自 chengjun/iching（MIT）。仅摘「白话文解释」，未取现代命理评断。\n")
    f.write("window.HEXTEXT=")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("bytes:", os.path.getsize(TARGET))
