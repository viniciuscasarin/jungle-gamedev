from PIL import Image, ImageDraw
from pathlib import Path
import json, re, math
root = Path.cwd()
report = root/'project/automation-reports/infinite-world'
base = json.loads(re.search(r'const shorelineOutline = (\[.*?\]);', (root/'src/domain/historicalFiniteConfig.ts').read_text()).group(1))
metrics=[]
for family,w,h in [('compact',160,120),('elongated',160,280),('wide',320,120)]:
    cols,rows=w//40,h//40
    image=Image.new('RGBA',(cols*64,rows*64))
    for y in range(rows):
        ids=[6,7,8,9] if y==0 else [54,55,56,57] if y==rows-1 else [22,23,24,25]
        for x in range(cols):
            i=0 if x==0 else 3 if x==cols-1 else 1 if x<cols/2 else 2
            image.paste(Image.open(root/f'assets/png/default/tiles/tile_{ids[i]}.png'),(x*64,y*64))
    sand=set()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=image.getpixel((x,y))
            if a>=128 and r>=150 and g>=100 and r>1.04*g and g>1.25*b: sand.add((x,y))
    boundary=set()
    for y in range(image.height):
        xs=[x for x in range(image.width) if (x,y) in sand]
        if xs: boundary.update([(min(xs),y),(max(xs),y)])
    for x in range(image.width):
        ys=[y for y in range(image.height) if (x,y) in sand]
        if ys: boundary.update([(x,min(ys)),(x,max(ys))])
    outline=[(p['xUnits']+(w-160 if p['xUnits']>=80 else 0),p['yUnits']+(h-120 if p['yUnits']>=60 else 0)) for p in base]
    def distance(p,a,b):
        dx,dy=b[0]-a[0],b[1]-a[1]
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    edges=list(zip(outline,outline[1:]+outline[:1]))
    error=max(min(distance((x*.625,y*.625),a,b) for a,b in edges) for x,y in boundary)
    reverse=max(min(math.hypot(a[0]+(b[0]-a[0])*t/40-x*.625,a[1]+(b[1]-a[1])*t/40-y*.625) for x,y in boundary) for a,b in edges for t in range(41))
    metrics.append(dict(family=family,widthUnits=w,heightUnits=h,samples=len(boundary),maxBoundaryErrorUnits=error,maxReverseErrorUnits=reverse))
    canvas=image.convert('RGB').resize((image.width*2,image.height*2))
    ImageDraw.Draw(canvas).line([(x/.625*2,y/.625*2) for x,y in outline+outline[:1]], fill='#ff2255',width=3)
    canvas.save(report/f'{family}-shoreline.png')
    assert error<=4 and reverse<=4,(family,error,reverse)
(report/'shoreline-measurements.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics,indent=2))
