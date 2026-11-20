import sys, json, cv2, numpy as np
# usage: warp.py src out L W ppm x0 y0 x1 y1 x2 y2 x3 y3 [margin_m]
src,out=sys.argv[1],sys.argv[2]; L,W,ppm=map(float,sys.argv[3:6]); pts=list(map(float,sys.argv[6:14]))
m=float(sys.argv[14]) if len(sys.argv)>14 else 0
im=cv2.imread(src)
Lp,Wp,M=L*ppm,W*ppm,m*ppm
s=np.float32(pts).reshape(4,2); d=np.float32([[M,M],[M+Lp,M],[M+Lp,M+Wp],[M,M+Wp]])
H=cv2.getPerspectiveTransform(s,d)
o=cv2.warpPerspective(im,H,(int(Lp+2*M),int(Wp+2*M)),flags=cv2.INTER_CUBIC)
cv2.imwrite(out,o)
