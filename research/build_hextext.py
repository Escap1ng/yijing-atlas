# -*- coding: utf-8 -*-
"""Build demo/hextext.js from the downloaded hexagram JSON files.

Fetch first:
  mkdir -p research/.tmp-yijing
  gh api repos/liujuntao123/yijing/tarball/HEAD > research/.tmp-yijing/src.tar.gz
  tar -xzf research/.tmp-yijing/src.tar.gz -C research/.tmp-yijing

Only the classical text (judgment, tuan, xiang, line texts) is taken.
Modern summaries/translations from the source are NOT copied.
"""
import glob
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = glob.glob(os.path.join(ROOT, "research", ".tmp-yijing", "*", "src", "data", "hexagrams", "*.json"))[0]
OUT = os.path.join(ROOT, "demo", "hextext.js")

TRIGRAM = {"天": "乾", "地": "坤", "水": "坎", "火": "离", "雷": "震", "风": "巽", "山": "艮", "泽": "兑"}
TV = {"乾": 7, "兑": 3, "离": 5, "震": 1, "巽": 6, "坎": 2, "艮": 4, "坤": 0}


def clean(s):
    s = re.sub(r"\s+", "", s)
    return s.strip()


def strip_prefix(s, names):
    for n in names:
        if s.startswith(n + "："):
            return s[len(n) + 1:]
        if s.startswith("《" + n + "》曰："):
            return s[len(n) + 4:]
    return s


data = {}
errors = []
files = sorted(glob.glob(os.path.join(os.path.dirname(SRC), "*.json")))
for path in files:
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    hid = raw["id"]
    name = raw["name"].replace("卦", "")
    name = {"遁": "遯"}.get(name, name)
    canon = raw["canon"]
    guaci = clean("".join(canon.get("guaci", [])))
    tuan = clean("".join(canon.get("tuan", [])))
    xiang = clean("".join(canon.get("xiang", [])))
    guaci = strip_prefix(guaci, [name])
    tuan = strip_prefix(tuan, ["彖"])
    xiang = strip_prefix(xiang, ["象"])
    lines = []
    extra = []
    for i, ln in enumerate(canon.get("lines", [])):
        text = clean(ln.get("text", ""))
        text = strip_prefix(text, [ln.get("name", "")])
        item = {"name": ln.get("name", ""), "text": text,
                "imageText": clean(ln.get("imageText", ""))}
        (lines if i < 6 else extra).append(item)
    up = TRIGRAM.get(raw["upper"])
    lo = TRIGRAM.get(raw["lower"])
    h_bits = sum(b << i for i, b in enumerate(raw["bits"][:6]))
    h_tri = TV[lo] + TV[up] * 8
    if h_bits != h_tri:
        errors.append("id %d: bits=%d trigrams=%d" % (hid, h_bits, h_tri))
    if len(lines) != 6:
        errors.append("id %d: %d lines" % (hid, len(lines)))
    # 大象 = 象传中第一条小象之前的部分；用小象正文做锚点切分
    cut = None
    for ln in lines:
        it = ln.get("imageText", "")
        body = it.split("：", 1)[1] if "：" in it else it
        for probe in (body[:8], body[:4]):
            idx = xiang.find(probe)
            if idx > 0:
                cut = idx if cut is None else min(cut, idx)
                break
    if cut:
        daxiang = xiang[:cut]
    else:
        m = re.search(r"(君子|先王|后|上|大人)以", xiang)
        if m:
            end = xiang.find("。", m.end())
            daxiang = xiang[:end + 1] if end > 0 else xiang
        else:
            daxiang = xiang

    data[str(hid)] = {"id": hid, "name": name, "guaci": guaci, "tuan": tuan,
                      "xiang": xiang, "daxiang": daxiang, "lines": lines,
                      "extra": extra, "h": h_bits}

with open(OUT, "w", encoding="utf-8") as f:
    f.write("// 经文为公有领域。结构取自 liujuntao123/yijing 的公开数据，仅摘原文，未取现代解读。\n")
    f.write("window.HEXTEXT=")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

print("files:", len(files), "entries:", len(data))
print("errors:", len(errors))
for e in errors[:10]:
    print("  ", e)
print("bytes:", os.path.getsize(OUT))
