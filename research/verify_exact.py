# -*- coding: utf-8 -*-
"""Exact distribution for the strict uniform-split model.

A split is uniform over L = 1..n-2 (right pile needs at least 2 rods so that
the hang-one step is possible). Enumeration by path counting is WRONG: it
overweights branches that have fewer splits. Use dynamic programming.
ASCII output only.
"""


def stage(n):
    d = {}
    m = n - 2
    for L in range(1, n - 1):
        R = n - L
        rl = L % 4 or 4
        rr = (R - 1) % 4 or 4
        take = rl + rr + 1
        d[n - take] = d.get(n - take, 0.0) + 1.0 / m
    return d


def run(n0, changes=3):
    st = {n0: 1.0}
    for _ in range(changes):
        nxt = {}
        for n, p in st.items():
            for r, q in stage(n).items():
                nxt[r] = nxt.get(r, 0.0) + p * q
        st = nxt
    return st


for n0 in (49, 64, 50):
    d = run(n0)
    print("n0 =", n0, " total =", round(sum(d.values()), 9))
    for r in sorted(d):
        print("   remaining %3d  /4 = %5.2f  p = %.5f" % (r, r / 4, d[r]))

print()
print("49-rod, order old-yang / old-yin / young-yang / young-yin:")
d = run(49)
print("   %.5f %.5f %.5f %.5f" % (d[36], d[24], d[28], d[32]))
print("   ideal 12:4:20:28  ->  0.18750 0.06250 0.31250 0.43750")
