"""Build hull+turret sprite PNGs from a rectified top-down photo.
config json: src, quad[8], L, W, ppm, margin, zoom:[ox,oy,f] (polygons given in zoomed-crop coords),
hull:[[x,y]...], turret:[[[x,y]..],..], pivot:[x,y], out_ppm, tint(optional)"""
import sys, json, cv2, numpy as np
cfg=json.load(open(sys.argv[1])); name=sys.argv[2]; outdir=sys.argv[3]
ppm=cfg['ppm']; M=cfg['margin']*ppm; L=cfg['L']*ppm; W=cfg['W']*ppm
im=cv2.imread(cfg['src'])
s=np.float32(cfg['quad']).reshape(4,2); d=np.float32([[M,M],[M+L,M],[M+L,M+W],[M,M+W]])
H=cv2.getPerspectiveTransform(s,d)
w=cv2.warpPerspective(im,H,(int(L+2*M),int(W+2*M)),flags=cv2.INTER_CUBIC)
ox,oy,f=cfg.get('zoom',[0,0,1])
P=lambda pts: np.int32([[ox+x/f, oy+y/f] for x,y in pts])
def mask(polys,feather=1.2):
    m=np.zeros(w.shape[:2],np.uint8)
    for p in polys: cv2.fillPoly(m,[P(p)],255,lineType=cv2.LINE_AA)
    return m
hm=mask([cfg['hull']]); tm=mask(cfg['turret'])
# hull layer: inpaint where turret/gun sits, keep only hull outline
fill=cv2.dilate(tm,np.ones((7,7),np.uint8))
hull=cv2.inpaint(w,fill,9,cv2.INPAINT_TELEA)
if cfg.get('deck_color'):  # flatten turret hole to a deck tone (ring hidden by turret anyway)
    pass
def rgba(img,m): return np.dstack([img,m])
hull_rgba=rgba(hull,cv2.bitwise_and(hm,cv2.bitwise_not(cv2.bitwise_and(fill,cv2.bitwise_not(hm)))))
tur_rgba=rgba(w,tm)
# soften alpha edges
for a in (hull_rgba,tur_rgba): a[...,3]=cv2.GaussianBlur(a[...,3],(3,3),0.8)
k=cfg['out_ppm']/ppm
def scale(a): return cv2.resize(a,None,fx=k,fy=k,interpolation=cv2.INTER_AREA)
# hull: crop to the L x W rectangle plus 0.15 m slack
sl=int(0.15*ppm)
hc=hull_rgba[int(M)-sl:int(M+W)+sl, int(M)-sl:int(M+L)+sl]
# turret: crop to bbox of mask, record pivot offset
ys,xs=np.where(tm>0); x0,x1,y0,y1=xs.min()-2,xs.max()+3,ys.min()-2,ys.max()+3
tc=tur_rgba[y0:y1,x0:x1]
px,py=P([cfg['pivot']])[0]
hcx,hcy=M+L/2,M+W/2
meta=dict(
  hull=dict(file=f'{name}_hull.png', w_m=hc.shape[1]/ppm, h_m=hc.shape[0]/ppm),
  turret=dict(file=f'{name}_turret.png', w_m=tc.shape[1]/ppm, h_m=tc.shape[0]/ppm,
              pivot_m=[(px-x0)/ppm,(py-y0)/ppm]),
  pivot_from_hull_centre_m=[(px-hcx)/ppm,(py-hcy)/ppm])
cv2.imwrite(f'{outdir}/{name}_hull.png',scale(hc)); cv2.imwrite(f'{outdir}/{name}_turret.png',scale(tc))
json.dump(meta,open(f'{outdir}/{name}.json','w'),indent=1); print(json.dumps(meta))
# debug composite
dbg=w.copy(); cv2.polylines(dbg,[P(cfg['hull'])],True,(0,0,255),1)
for p in cfg['turret']: cv2.polylines(dbg,[P(p)],True,(0,255,255),1)
cv2.circle(dbg,(int(px),int(py)),3,(255,0,255),-1); cv2.imwrite(f'{outdir}/{name}_debug.png',dbg)
