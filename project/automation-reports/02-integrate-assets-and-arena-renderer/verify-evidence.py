"""Independent report, artifact and geometric evidence audit (stdlib + Pillow)."""
import base64
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile
from PIL import Image

report = Path(__file__).resolve().parent
root = report.parents[2]
html = (report / 'playwright-report/index.html').read_text(encoding='utf8')
encoded = re.search(r'data:application/zip;base64,([A-Za-z0-9+/=]+)', html).group(1)
archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(encoded)))
summary = json.loads(archive.read('report.json'))
files = [json.loads(archive.read(name)) for name in archive.namelist() if name.endswith('.json') and name != 'report.json']
tests = [test for file in files for test in file['tests']]
assert len(tests) == 10 and all(test['outcome'] == 'expected' for test in tests)
observations = json.loads((report / 'browser-observations.json').read_text())
indexed = {(test['project'], test['title']): test for test in observations['tests']}
attachments_checked = 0
json_bodies_checked = 0
for test in tests:
    for result in test['results']:
        for attachment in result['attachments']:
            if attachment['contentType'] == 'application/json':
                assert json.loads(attachment['body']) == indexed[(test['projectName'], test['title'])][attachment['name']]
                json_bodies_checked += 1
            if attachment.get('path'):
                path = report / 'playwright-report' / attachment['path']
                assert path.is_file(), path
                if attachment['contentType'] == 'image/png':
                    source = report / 'browser-evidence' / f"{test['projectName']}-{attachment['name']}.png"
                    assert hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(path.read_bytes()).digest()
                attachments_checked += 1
assert len(observations['tests']) == 10
for test in observations['tests']:
    assert test['console-issues'] == []
    if 'resource-cycles' in test:
        assert len(test['resource-cycles']['cycles']) == 5
        for cycle in test['resource-cycles']['cycles']:
            mounted, unmounted = cycle['mounted'], cycle['unmounted']
            assert [mounted[k] for k in ['applications', 'resources', 'subscriptions', 'canvases', 'observers', 'resize', 'density', 'frames']] == [1,1,1,1,2,1,1,0]
            assert [unmounted[k] for k in ['applications', 'resources', 'subscriptions', 'canvases', 'observers', 'resize', 'density', 'frames']] == [0]*8
            assert mounted['cache']['leases'] == 1 and unmounted['cache']['leases'] == 0
            assert mounted['cache']['textures'] == unmounted['cache']['textures'] == 30
images = {p.name: list(Image.open(p).size) for p in sorted((report/'browser-evidence').glob('*.png'))}
assert images['dev-844x390-dpr2.png'] == images['preview-844x390-dpr2.png'] == [1688,780]
source_latest = max(p.stat().st_mtime for p in (root/'src').rglob('*') if p.is_file())
assert source_latest < (report/'e2e-final.log').stat().st_mtime
result = {'htmlTests': len(tests), 'outcomes': [test['outcome'] for test in tests], 'existingAttachmentsChecked': attachments_checked, 'jsonBodiesMatchedToHTML': json_bodies_checked, 'consoleIssues': 0, 'sourceOlderThanFinalE2E': True, 'imageSizes': images}
(report/'verify-evidence.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result,indent=2))
