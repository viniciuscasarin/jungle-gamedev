const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const report = __dirname;
const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const status = JSON.parse(read(path.join(report, 'archive-status-before.json')));
const root = status.planningHome.root;
const evidencePath = path.join(report, 'archive-sync-evidence.json');
function walk(p) {
  if (!fs.existsSync(p)) return [];
  if (!fs.statSync(p).isDirectory()) return [p];
  return fs.readdirSync(p).flatMap(n => walk(path.join(p, n)));
}
function requirements(text) {
  const matches = [...text.matchAll(/^### Requirement: (.+)\r?$/gm)];
  return matches.map((m, i) => ({name: m[1].trim(), start: m.index,
    raw: text.slice(m.index, matches[i + 1]?.index ?? text.length)}));
}
function purpose(text) {
  const m = /^## Purpose\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/m.exec(text);
  assert(m, 'Purpose required'); return m[0];
}
function section(text, name) {
  const start = text.indexOf('## ' + name + '\n');
  if (start < 0) return '';
  const bodyStart = start + ('## ' + name + '\n').length;
  const next = text.indexOf('\n## ', bodyStart);
  return text.slice(bodyStart, next < 0 ? text.length : next);
}
function compare(e) {
  for (const c of e.capabilities) {
    const actual = read(c.mainPath);
    assert.equal(actual, c.expected, c.name + ': full expected merge');
    assert.equal(purpose(actual), c.before === null ? purpose(c.delta) : purpose(c.before), c.name + ': Purpose');
    assert.equal(actual.split('\n')[0], c.before === null ? '# ' + c.name + ' Specification' : c.before.split('\n')[0]);
    assert.equal((actual.match(/^## Requirements\r?$/gm) || []).length, 1);
    assert(!/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/m.test(actual));
    const current = requirements(actual);
    for (const op of c.operations.filter(o => o.kind !== 'RENAMED')) {
      assert.equal(current.filter(r => r.name === op.name).length, 1);
      assert.equal(current.find(r => r.name === op.name).raw.trimEnd(), op.raw.trimEnd());
    }
    for (const rename of c.operations.filter(o => o.kind === 'RENAMED')) {
      assert(!current.some(r => r.name === rename.from));
      assert(current.some(r => r.name === rename.to));
    }
    if (c.before) for (const old of requirements(c.before)) {
      const changed = c.operations.some(o => o.name === old.name || o.from === old.name);
      if (!changed) assert.equal(current.find(r => r.name === old.name)?.raw, old.raw, 'untouched requirement bytes');
    }
    c.requirements = current.length;
    c.scenarios = (actual.match(/^#### Scenario:/gm) || []).length;
    c.comparison = 'already-synced';
  }
  for (const [p, digest] of Object.entries(e.protectedHashes)) assert.equal(hash(p), digest, 'protected file: ' + p);
}
const [action, capability] = process.argv.slice(2);
if (action === 'plan') {
  assert(status.isPlanningComplete && status.isComplete);
  assert(status.artifacts.every(a => ['done', 'skipped'].includes(a.status)));
  const list = JSON.parse(read(path.join(report, 'archive-list-before.json')));
  const entries = list.changes.filter(c => c.name === status.changeName);
  assert.equal(entries.length, 1);
  assert(Number.isInteger(entries[0].totalTasks) && entries[0].totalTasks >= 0);
  assert.equal(entries[0].totalTasks, 18); assert.equal(entries[0].completedTasks, 18);
  const e = {root, changeRoot: status.changeRoot, capabilities: [], protectedHashes: {}, changeHashes: {}};
  for (const deltaPath of status.artifactPaths.specs.existingOutputPaths) {
    const name = path.relative(path.join(status.changeRoot, 'specs'), path.dirname(deltaPath));
    const mainPath = path.join(root, 'openspec', 'specs', name, 'spec.md');
    const delta = read(deltaPath);
    const before = fs.existsSync(mainPath) ? read(mainPath) : null;
    const operations = [];
    const added = requirements(section(delta, 'ADDED Requirements'));
    const modified = requirements(section(delta, 'MODIFIED Requirements'));
    const renameSection = section(delta, 'RENAMED Requirements');
    const renames = [...renameSection.matchAll(/- FROM: `### Requirement: (.+)`\r?\n- TO: `### Requirement: (.+)`/g)].map(m => ({kind:'RENAMED', from:m[1], to:m[2]}));
    assert.equal(section(delta, 'REMOVED Requirements'), '', 'No removals expected');
    if (before === null) { assert.equal(modified.length, 0); assert.equal(renames.length, 0); assert(added.length); }
    let expected = before;
    if (expected !== null) {
      for (const rename of renames) {
        assert.equal(requirements(expected).filter(r => r.name === rename.from).length, 1);
        expected = expected.replace('### Requirement: ' + rename.from + '\n', '### Requirement: ' + rename.to + '\n');
        operations.push(rename);
      }
      for (const req of modified) {
        const old = requirements(expected).find(r => r.name === req.name); assert(old);
        const oldScenarios = [...old.raw.matchAll(/^#### Scenario: (.+)$/gm)].map(m => m[1]);
        for (const scenario of oldScenarios) assert(req.raw.includes('#### Scenario: ' + scenario), 'preserve scenario: ' + scenario);
        expected = expected.slice(0, old.start) + req.raw.trimEnd() + '\n\n' + expected.slice(old.start + old.raw.length);
        operations.push({kind:'MODIFIED', name:req.name, raw:req.raw});
      }
      for (const req of added) { assert(!requirements(expected).some(r => r.name === req.name)); expected = expected.trimEnd() + '\n\n' + req.raw.trimEnd() + '\n'; operations.push({kind:'ADDED', name:req.name, raw:req.raw}); }
    } else {
      expected = '# ' + name + ' Specification\n\n' + purpose(delta) + '## Requirements\n\n' + section(delta, 'ADDED Requirements').trim() + '\n';
      operations.push(...added.map(r => ({kind:'ADDED', name:r.name, raw:r.raw})));
    }
    e.capabilities.push({name, deltaPath, mainPath, delta, before, expected, operations});
  }
  const protectedRoots = ['src', 'tests', 'assets', 'GDD.md', 'project/automation-state.json', 'openspec/specs'];
  for (const p of protectedRoots.flatMap(p => walk(path.join(root, p)))) {
    if (!e.capabilities.some(c => c.mainPath === p)) e.protectedHashes[p] = hash(p);
  }
  for (const p of fs.readdirSync(root).map(n => path.join(root,n)).filter(p => fs.statSync(p).isFile())) e.protectedHashes[p] = hash(p);
  for (const p of walk(status.changeRoot)) e.changeHashes[path.relative(status.changeRoot,p)] = hash(p);
  fs.writeFileSync(evidencePath, JSON.stringify(e, null, 2) + '\n');
  console.log(JSON.stringify(e.capabilities.map(c => ({name:c.name, new:c.before===null, operations:c.operations.map(({raw,...o})=>o)})), null, 2));
} else {
  const e = JSON.parse(read(evidencePath));
  if (action === 'sync') {
    const c = e.capabilities.find(c => c.name === capability); assert(c);
    assert.equal(fs.existsSync(c.mainPath) ? read(c.mainPath) : null, c.before, 'baseline unchanged');
    fs.mkdirSync(path.dirname(c.mainPath), {recursive:true}); fs.writeFileSync(c.mainPath, c.expected);
    assert.equal(read(c.mainPath), c.expected); console.log('Synced ' + capability);
  } else if (action === 'compare') {
    compare(e); fs.writeFileSync(evidencePath, JSON.stringify(e,null,2)+'\n');
    console.log(JSON.stringify({comparison:'all-four-already-synced', protectedFiles:Object.keys(e.protectedHashes).length, capabilities:e.capabilities.map(c=>({name:c.name, requirements:c.requirements,scenarios:c.scenarios}))},null,2));
  } else if (action === 'final') {
    compare(e);
    const archive = path.join(status.planningHome.changesDir, 'archive', '2026-10-27-'+status.changeName);
    assert(!fs.existsSync(status.changeRoot));
    const moved = walk(archive); assert.equal(moved.length,Object.keys(e.changeHashes).length);
    for(const p of moved) assert.equal(hash(p),e.changeHashes[path.relative(archive,p)],'archive content');
    e.archivePath=archive; e.movedFiles=moved.length; e.finalComparison='passed';
    fs.writeFileSync(evidencePath,JSON.stringify(e,null,2)+'\n');
    console.log(JSON.stringify({archive, movedFiles:e.movedFiles,protectedFiles:Object.keys(e.protectedHashes).length,finalComparison:e.finalComparison}));
  } else throw Error('Unknown action');
}
