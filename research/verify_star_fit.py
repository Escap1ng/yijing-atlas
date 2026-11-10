# -*- coding: utf-8 -*-
import math, random
MOD = 365.25
ju = [12,9,15,5,5,18,11,26.25,8,12,10,17,16,9,16,12,14,11,16,2,9,33,4,15,7,18,18,17]
bounds=[]; c=0
for w in ju:
    bounds.append(c); c+=w
def cdist(a,b):
    d=abs(a-b)%MOD
    return min(d, MOD-d)
def stat(phi, anchors, points):
    off = anchors[0]-points[0]
    return sum(cdist(p+phi, a)**2 for p,a in zip(points,anchors))
# anchors = 28 mansion starts (in gu-du), points = 24 solar terms
terms=[k*MOD/24 for k in range(24)]
best=(1e18,None)
phi=0.0
while phi < MOD:
    s=sum(min(cdist(t+phi,b) for b in bounds)**2 for t in terms)
    if s<best[0]: best=(s,phi)
    phi+=0.25
print("best phi:", round(best[1],2), " SSR:", round(best[0],3), " RMS:", round(math.sqrt(best[0]/24),3), "gu-du")
# null: random rotation, same statistic
random.seed(20261110)
vals=[]
for _ in range(20000):
    phi=random.uniform(0,MOD)
    vals.append(sum(min(cdist(t+phi,b) for b in bounds)**2 for t in terms))
vals.sort()
obs=best[0]
p=sum(1 for v in vals if v<=obs)/len(vals)
print("null mean SSR:", round(sum(vals)/len(vals),3), " median:", round(vals[len(vals)//2],3))
print("p-value (random rotation <= best):", p)
# uniform-sector reference: 28 equal sectors, nearest-boundary RMS expected
print("mean sector width:", round(MOD/28,3), "  expected RMS if uniform ~ width/sqrt(12):", round(MOD/28/math.sqrt(12),3))
# winter solstice anchor: 斗宿 start = 75 gu-du, +21.25
print("winter solstice at:", 75+21.25, "gu-du from Jiao")
# how many solar terms land within 2 gu-du of a mansion start?
phi=best[1]
print("terms within 2 gu-du:", sum(1 for t in terms if min(cdist(t+phi,b) for b in bounds)<=2), "/24")
