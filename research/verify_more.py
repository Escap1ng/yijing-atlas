# -*- coding: utf-8 -*-
from collections import Counter
def bits(h): return [(h>>i)&1 for i in range(6)]   # b0 = line 1 (bottom)
def from_bits(b):
    return sum(x<<i for i,x in enumerate(b))
def hu(h):
    b = bits(h)
    # lower hu = lines 2,3,4 ; upper hu = lines 3,4,5
    lo = b[1] | (b[2]<<1) | (b[3]<<2)
    up = b[2] | (b[3]<<1) | (b[4]<<2)
    return (up<<3) | lo

img = {hu(h) for h in range(64)}
fixed = [h for h in range(64) if hu(h)==h]
print("hu image size:", len(img), " fixed points:", len(fixed))

# self-opposite under hu^2, hu^3 ... cycles reachable from each
def orbit(h):
    seen=[]; x=h
    while x not in seen:
        seen.append(x); x=hu(x)
    return seen
cycles = Counter()
for h in range(64):
    o = orbit(h)
    # tail + cycle
    cyc = o[o.index(hu(o[-1])):] if hu(o[-1]) in o else o
    cycles[len(cyc)] += 1
print("hu orbit cycle lengths (count of start nodes):", sorted(cycles.items()))

# gua-qi: modern-degree position of 60-gua ring; 6.0875 days per gua
print("60*6.0875 =", 60*6.0875)
print("365.25/64 =", 365.25/64)
print("365.25/28 =", 365.25/28)

# Wen Wang order (standard) sanity: 64 entries, check permutation
wen = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
       33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
print("wen wang permutation ok:", sorted(wen)==list(range(1,65)))

# 8x8 square: check 180 rotation == cuo; transpose == swap trigrams
def hex_of(r,c): return (c<<3)|r
print("cuo==180rot:", all(((hex_of(r,c)^63)==hex_of(7-r,7-c)) for r in range(8) for c in range(8)))
print("transpose==swap trigrams:", all(hex_of(r,c)==((c<<3)|r) for r in range(8) for c in range(8)))
