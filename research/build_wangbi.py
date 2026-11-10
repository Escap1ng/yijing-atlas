# -*- coding: utf-8 -*-
"""Merge Wang Bi's Zhouyi commentary into demo/hextext.js.

Source: 四库全书本《周易注》(via garychowcmu/daizhigev20). The edition
interleaves commentary in 【】 inside the classic text, so alignment is done
on a commentary-free copy. Pronunciation glosses are dropped; variants are
normalized for matching only. Requires zhconv.

Fetch first:
  mkdir -p research/.tmp-wangbi
  gh api "repos/garychowcmu/daizhigev20/contents/%E6%98%93%E8%97%8F/%E6%98%93%E7%BB%8F/%E5%91%A8%E6%98%93%E6%B3%A8.txt" \
    --jq .content | base64 -d > research/.tmp-wangbi/wangbi.txt
"""
import json
import os
import re

import zhconv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "demo", "hextext.js")
SRC = os.path.join(ROOT, "research", ".tmp-wangbi", "wangbi.txt")

PUNCT = set("，。；：、！？「」『』（）《》·“”‘’")
VARIANTS = {"頥": "颐", "兊": "兑", "於": "于", "徳": "德", "㡬": "几", "髙": "高", "亁": "干"}


def is_pua(ch):
    return 0xE000 <= ord(ch) <= 0xF8FF


def match_char(ch):
    if ch.isspace() or ch in PUNCT or is_pua(ch):
        return ""
    ch = VARIANTS.get(ch, ch)
    return "干" if ch == "乾" else ch


def clean_note(raw):
    seg = raw.split("　")[0]
    seg = "".join(ch for ch in seg if not is_pua(ch)).strip()
    if not seg:
        return ""
    if len(seg) <= 12 and ("反" in seg or seg.startswith("音")):
        return ""
    return seg


text = zhconv.convert(open(SRC, encoding="utf-8", errors="replace").read(), "zh-cn")

chars = []
idxmap = []
for m in re.finditer(r"【[^】]*】|[^【]+", text):
    s = m.group(0)
    if s.startswith("【"):
        continue
    for k, ch in enumerate(s):
        c = match_char(ch)
        if c:
            chars.append(c)
            idxmap.append(m.start() + k)
M = "".join(chars)


def norm(s):
    return "".join(match_char(ch) for ch in s)


def notes_between(o1, o2):
    out = []
    for mm in re.finditer(r"【([^】]*)】", text[o1:o2]):
        n = clean_note(mm.group(1))
        if n:
            out.append(n)
    return "".join(out)


with open(TARGET, encoding="utf-8") as f:
    raw = f.read()
data = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])

cursor = 0
missing_gua = []
missing_line = []
for hid in range(1, 65):
    entry = data[str(hid)]
    g = norm(entry["guaci"])
    candidates = [g[:14], g[:10], g[:8], g[3:13], g[4:12], norm(entry["name"] + entry["guaci"][:4])]
    pos, used = -1, 0
    for c in candidates:
        if len(c) >= 4:
            pos = M.find(c, cursor)
            if pos >= 0:
                used = len(c)
                break
    if pos < 0:
        missing_gua.append(entry["name"])
        continue

    positions = []
    q = pos + used
    for ln in entry["lines"]:
        nl = norm(ln["name"] + ln["text"][:6])
        lp = M.find(nl, q)
        if lp < 0:
            lp = M.find(norm(ln["name"]), q)
        if lp < 0:
            missing_line.append((entry["name"], ln["name"]))
            continue
        positions.append((lp, lp + len(nl)))
        q = lp + len(nl)

    if positions:
        b = positions[0][0]
        entry["zhu"] = notes_between(idxmap[pos], idxmap[b - 1] + 1)
    else:
        entry["zhu"] = ""

    for i, (s, en) in enumerate(positions):
        if i + 1 < len(positions):
            b = positions[i + 1][0]
        else:
            cuts = [x for x in (M.find("彖曰", en), M.find("用九", en), M.find("用六", en)) if x > 0]
            b = min(cuts) if cuts else en + 200
        entry["lines"][i]["zhu"] = notes_between(idxmap[s], idxmap[b - 1] + 1)

    cursor = pos + used

lens = [len(l.get("zhu", "")) for e in data.values() for l in e["lines"] if l.get("zhu")]
print("entries", len(data))
print("missing gua", len(missing_gua), missing_gua)
print("missing line", len(missing_line), missing_line[:6])
print("gua notes", sum(1 for e in data.values() if e.get("zhu")))
print("line notes", len(lens), "avg", round(sum(lens) / len(lens), 1), "max", max(lens))

with open(TARGET, "w", encoding="utf-8") as f:
    f.write("// 经文为公有领域；白话取自 chengjun/iching（MIT）；王弼注据四库本，音义未收。\n")
    f.write("window.HEXTEXT=")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("bytes", os.path.getsize(TARGET))
