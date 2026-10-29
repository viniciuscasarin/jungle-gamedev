"""Reproduce the shoreline measurement. Requires Pillow; run from repository root.
Sand is selected by measured warm RGB color, not by the opaque water/alpha bounds.
Alpha only excludes transparent pixels; grass and sea fail the color predicates.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json
import re

report = Path(__file__).resolve().parent
root = report.parents[2]
image = Image.new('RGBA', (256, 192))
for row, ids in enumerate([[6,7,8,9], [22,23,24,25], [54,55,56,57]]):
    for column, tile in enumerate(ids):
        image.paste(Image.open(root / f'assets/png/default/tiles/tile_{tile}.png'), (column*64,row*64))
sand = set()
for y in range(image.height):
    for x in range(image.width):
        red, green, blue, alpha = image.getpixel((x,y))
        if alpha >= 128 and red >= 150 and green >= 100 and red > 1.04*green and green > 1.25*blue:
            sand.add((x,y))
# Outer silhouettes only: interior grass is not a coastline boundary.
boundary = set()
for y in range(image.height):
    xs = [x for x in range(image.width) if (x,y) in sand]
    if xs: boundary.update([(min(xs),y), (max(xs),y)])
for x in range(image.width):
    ys = [y for y in range(image.height) if (x,y) in sand]
    if ys: boundary.update([(x,min(ys)), (x,max(ys))])

def cross(o,a,b):
    return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
points = sorted(sand)
lower, upper = [], []
for sequence, output in [(points,lower), (list(reversed(points)),upper)]:
    for point in sequence:
        while len(output)>1 and cross(output[-2],output[-1],point)<=0: output.pop()
        output.append(point)
hull = lower[:-1] + upper[:-1]
vertices = [{'xUnits':x*.625, 'yUnits':y*.625} for x,y in hull]
configured = json.loads(re.search(r'const shorelineOutline = (\[.*?\]);', (root/'src/domain/config.ts').read_text()).group(1))
# The configured outline may conservatively follow the antialiased sand edge.
segments = [( (a['xUnits']/.625,a['yUnits']/.625), (b['xUnits']/.625,b['yUnits']/.625)) for a,b in zip(configured, configured[1:]+configured[:1])]
def distance(point,a,b):
    dx,dy = b[0]-a[0],b[1]-a[1]
    t = max(0,min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return ((point[0]-a[0]-t*dx)**2+(point[1]-a[1]-t*dy)**2)**.5
error = max(min(distance(point,a,b) for a,b in segments) for point in boundary)*.625
# Reverse comparison samples each outline segment: neither direction hides an overshoot.
reverse = max(min(((a[0]+(b[0]-a[0])*t/20-x)**2+(a[1]+(b[1]-a[1])*t/20-y)**2)**.5 for x,y in boundary) for a,b in segments for t in range(21))*.625
assert error<=4 and reverse<=4, (error,reverse)
result = {'sourcePixels':[256,192], 'logicalUnits':[160,120], 'method':'RGB warm sand mask: a>=128,r>=150,g>=100,r>1.04*g,g>1.25*b. Outer row/column silhouettes; nearest outline segment, and reverse sampled outline-to-sand distance.', 'boundarySamples':len(boundary), 'maxBoundaryErrorUnits':error, 'maxReverseErrorUnits':reverse, 'vertices':configured}
(report/'shoreline-measurements.json').write_text(json.dumps(result,indent=2))
canvas = Image.new('RGB',(768,576),'#2c9fac')
resized = image.resize((768,576));canvas.paste(resized,(0,0),resized)
draw = ImageDraw.Draw(canvas)
coords=[(p['xUnits']/.625*3,p['yUnits']/.625*3) for p in configured]
draw.line(coords+coords[:1],fill='#ff2255',width=3)
canvas.save(report/'shoreline-overlay.png')
print(json.dumps({key:value for key,value in result.items() if key!='vertices'},indent=2))
