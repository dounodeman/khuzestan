import sys, json
from PIL import Image
outdir=sys.argv[1]; names=sys.argv[2:]; ppm=40
tiles=[]
for n in names:
    m=json.load(open(f'{outdir}/{n}.json'))
    h=Image.open(f'{outdir}/{n}_hull.png').convert('RGBA'); t=Image.open(f'{outdir}/{n}_turret.png').convert('RGBA')
    for ang in (0,35):
        c=Image.new('RGBA',(560,300),(196,176,128,255))
        cx,cy=230,150
        c.alpha_composite(h,(int(cx-h.width/2),int(cy-h.height/2)))
        px,py=m['turret']['pivot_m']; ox,oy=m['pivot_from_hull_centre_m']
        # rotate turret about pivot
        big=Image.new('RGBA',(t.width*3,t.height*3)); big.alpha_composite(t,(int(t.width*1.5-px*ppm),int(t.height*1.5-py*ppm)))
        big=big.rotate(-ang,center=(t.width*1.5,t.height*1.5),resample=Image.BICUBIC)
        c.alpha_composite(big,(int(cx+ox*ppm-t.width*1.5),int(cy+oy*ppm-t.height*1.5)))
        tiles.append(c)
S=Image.new('RGB',(1120,300*len(names)))
for i,c in enumerate(tiles): S.paste(c,((i%2)*560,(i//2)*300))
S.save(f'{outdir}/preview.png')
