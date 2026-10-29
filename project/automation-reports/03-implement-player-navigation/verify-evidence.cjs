// Read-only audit of the retained APPLY report, attachments and current core.
// Run from the repository root with Node; only verify-evidence.json is written.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const reportRoot = __dirname;
const evidenceRoot = path.join(reportRoot, 'browser-evidence');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function unzip(bytes) {
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert(end >= 0, 'Embedded ZIP end directory');
  const files = new Map();
  let offset = bytes.readUInt32LE(end + 16);
  const count = bytes.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const method = bytes.readUInt16LE(offset + 10), size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28), extra = bytes.readUInt16LE(offset + 30), comment = bytes.readUInt16LE(offset + 32);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString();
    const local = bytes.readUInt32LE(offset + 42);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + size);
    assert(method === 8 || method === 0);
    files.set(name, method === 8 ? zlib.inflateRawSync(data) : data);
    offset += 46 + nameLength + extra + comment;
  }
  return files;
}

const html = fs.readFileSync(path.join(reportRoot, 'playwright-report/index.html'), 'utf8');
const encoded = html.match(/base64,(UEs[A-Za-z0-9+/=]+)/);
assert(encoded, 'Retained HTML report contains ZIP');
const entries = unzip(Buffer.from(encoded[1], 'base64'));
const report = JSON.parse(entries.get('report.json').toString());
assert.deepEqual(report, readJson(path.join(evidenceRoot, 'report.json')));
assert.deepEqual(report.stats, { total: 14, expected: 14, unexpected: 0, flaky: 0, skipped: 0, ok: true });
assert.equal(report.errors.length, 0);
let imageAttachments = 0, jsonAttachments = 0;
const attachmentBodies = new Map();
for (const file of report.files) {
  const detail = JSON.parse(entries.get(file.fileId + '.json').toString());
  for (const test of detail.tests) {
    assert.equal(test.ok, true);
    for (const result of test.results) for (const attachment of result.attachments) {
      if (attachment.path) {
        assert(fs.existsSync(path.join(reportRoot, 'playwright-report', attachment.path)));
        imageAttachments++;
      } else if (attachment.body !== undefined) {
        const body = JSON.parse(attachment.body);
        attachmentBodies.set(test.projectName + '-' + attachment.name, body);
        jsonAttachments++;
        if (attachment.name === 'console-issues') assert.deepEqual(body, []);
      }
    }
  }
}

// The core stays DOM-free. Transpile only for this Node-side inspection; no app loop.
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const { DEFAULT_CONFIG } = require(path.resolve('src/domain/config.ts'));
const { hullIsValid } = require(path.resolve('src/simulation/collision.ts'));
const projects = [];
for (const project of ['dev', 'preview']) {
  const loads = {};
  for (const type of ['resource-cycles', 'navigation-observations', 'focus-observations', 'viewport-observations']) {
    loads[type] = readJson(path.join(evidenceRoot, project + '-' + type + '.json'));
    assert.deepEqual(loads[type], attachmentBodies.get(project + '-' + type), 'Standalone JSON matches retained report');
  }
  const cycles = loads['resource-cycles'];
  assert.equal(cycles.cycles.length, 5);
  for (const { mounted, unmounted } of cycles.cycles) {
    for (const key of ['applications', 'resources', 'subscriptions', 'canvases', 'frames']) assert.equal(mounted[key], 1);
    assert.equal(mounted.inputListeners, 7);
    assert.equal(mounted.cache.leases, 1);
    for (const key of ['applications', 'resources', 'subscriptions', 'inputListeners', 'canvases', 'observers', 'resize', 'density', 'frames']) assert.equal(unmounted[key], 0);
    assert.equal(unmounted.cache.leases, 0);
    assert.equal(unmounted.nativeInput, cycles.initial.nativeInput);
    assert.equal(mounted.nativeInput, cycles.cycles[0].mounted.nativeInput);
  }
  const navigation = loads['navigation-observations'];
  assert.equal(navigation.observations.length, 10);
  const snapshots = [...navigation.observations.map(item => item.snapshot), ...['frontal', 'oblique', 'southeast', 'final'].map(key => navigation[key].snapshot)];
  for (const snapshot of snapshots) {
    assert(hullIsValid(snapshot.player.position, DEFAULT_CONFIG));
    assert.equal(snapshot.player.health, 100);
    assert.equal(snapshot.score, 0);
    assert.equal(snapshot.enemies.length, 0);
    assert.equal(snapshot.projectiles.length, 0);
    assert.equal(snapshot.activeTimeMs, snapshot.step * DEFAULT_CONFIG.timing.fixedStepMs);
  }
  for (const { waypoint, snapshot } of navigation.observations) assert(Math.hypot(snapshot.player.position.xUnits - waypoint[0], snapshot.player.position.yUnits - waypoint[1]) < 12);
  assert(navigation.oblique.snapshot.player.position.yUnits < navigation.frontal.snapshot.player.position.yUnits - 30);
  assert(navigation.final.snapshot.player.position.yUnits < navigation.southeast.snapshot.player.position.yUnits - 30);
  const focus = loads['focus-observations'];
  for (const item of [focus.paused, focus.hidden]) {
    assert.equal(item.snapshot.state, 'paused'); assert.equal(item.snapshot.autoSailEnabled, false); assert.equal(item.target, null);
  }
  assert.deepEqual(focus.afterResume, focus.paused.snapshot.player.position);
  assert.match(focus.visibilitySignal, /document.hidden getter \+ visibilitychange/);
  projects.push({ project, cases: report.files.flatMap(file => file.tests).filter(test => test.projectName === project).length,
    resourceCycles: cycles.cycles.length, validNavigationSnapshots: snapshots.length, routeWaypoints: navigation.observations.length,
    blur: 'native second-tab focus transition with CDP focus emulation disabled', hidden: 'emulated platform getter and visibilitychange; no gameplay setters',
    nativeInputBaseline: cycles.initial.nativeInput, nativeInputMounted: cycles.cycles[0].mounted.nativeInput,
    contact: navigation.frontal.snapshot.player.position, slide: navigation.oblique.snapshot.player.position });
}
for (const folder of ['test-results', 'stencil-smoke-results']) assert.equal(readJson(path.join(reportRoot, folder, '.last-run.json')).status, 'passed');
const sourceFiles = ['src/simulation/engine.ts', 'src/simulation/accumulator.ts', 'src/simulation/collision.ts', 'src/input/desktop.ts', 'src/render/navigationLoop.ts', 'src/render/pixiPreview.ts', 'src/render/previewOwner.ts', 'src/render/loadingAttempt.ts', 'src/ui/App.tsx', 'tests/navigation.test.ts', 'tests/e2e/arena.spec.ts'];
const result = { audit: 'passed', executedAtUtc: new Date().toISOString(), retainedE2E: report.stats,
  retainedE2EStartedAtUtc: new Date(report.startTime).toISOString(), imageAttachments, jsonAttachments, projects,
  sourceHashes: Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(file))])),
  limitations: ['Historical APPLY browser execution was audited, not rerun in VERIFY; current product source unchanged.', 'Native OS document-hidden behavior is not claimed; visibility signal path is emulated.', 'Final stencil adjustment has separate 4-case smoke evidence and passed marker; full retained report predates that graphics-only flag.'] };
fs.writeFileSync(path.join(reportRoot, 'verify-evidence.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
