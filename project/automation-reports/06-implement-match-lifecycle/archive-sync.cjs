// Auditoria e merge restritos aos caminhos concretos retornados pela CLI nesta fase.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const report = __dirname;
const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const json = p => JSON.parse(read(p));
const save = (name, data) => fs.writeFileSync(path.join(report, name), JSON.stringify(data, null, 2) + '\n');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const status = json(path.join(report, 'archive-pre-status.json'));
const root = status.planningHome.root;
const change = status.changeRoot;
const mainRoot = path.join(root, 'openspec', 'specs');
const inside = (p, base) => { const rel = path.relative(base, p); assert(rel && !rel.startsWith('..') && !path.isAbsolute(rel), `Caminho fora da raiz: ${p}`); };
const requirements = text => [...text.matchAll(/^### Requirement: (.+)\r?$/gm)].map((m, i, matches) => {
  const end = matches[i + 1]?.index ?? text.length;
  const raw = text.slice(m.index, end);
  return { name: m[1].trim(), index: m.index, end, content: raw.trimEnd(), tail: raw.slice(raw.trimEnd().length) };
});
const scenarios = block => [...block.matchAll(/^#### Scenario: (.+)\r?$/gm)].map(m => m[1].trim());
const purpose = text => text.match(/^## Purpose\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
const normalized = s => s.replace(/\r\n/g, '\n').trimEnd();
function parseDelta(text) {
  const ops = [...text.matchAll(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\r?$/gm)];
  assert(ops.length, 'Delta sem operações');
  return ops.flatMap((m, i) => {
    assert(['ADDED', 'MODIFIED'].includes(m[1]), 'Operação fora da avaliação desta change');
    return requirements(text.slice(m.index + m[0].length, ops[i + 1]?.index ?? text.length)).map(r => ({ ...r, op: m[1] }));
  });
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function protectedFiles() {
  const dirs = ['src', 'tests', 'assets', 'openspec/changes/archive'];
  const files = dirs.flatMap(d => walk(path.join(root, d)));
  for (const e of fs.readdirSync(path.join(root, 'project/automation-reports'), { withFileTypes: true })) {
    if (e.isDirectory() && /^0[1-5]-/.test(e.name)) files.push(...walk(path.join(root, 'project/automation-reports', e.name)));
  }
  files.push(...fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isFile()).map(e => path.join(root, e.name)));
  files.push(path.join(root, 'project/automation-state.json'));
  return Object.fromEntries(files.map(p => [p, hash(p)]));
}
function expected(before, delta, capability) {
  const ops = parseDelta(delta);
  if (before === null) {
    assert(ops.every(o => o.op === 'ADDED'), 'Capability nova só aceita ADDED');
    assert(purpose(delta)?.trim().length >= 50, 'Purpose novo inválido');
    return `# ${capability} Specification\n\n## Purpose\n${purpose(delta)}## Requirements\n\n${ops.map(o => o.content).join('\n\n')}\n`;
  }
  let output = before;
  const old = requirements(before);
  const names = new Set(ops.map(o => o.name));
  assert.equal(names.size, ops.length, 'Requisito duplicado no delta');
  for (const op of ops) {
    const existing = requirements(output).find(r => r.name === op.name);
    if (op.op === 'MODIFIED') assert(existing, `Requisito MODIFIED inexistente: ${op.name}`);
    if (existing) {
      for (const s of scenarios(existing.content)) assert(scenarios(op.content).includes(s), `Cenário omitido: ${s}`);
      output = output.slice(0, existing.index) + op.content + existing.tail + output.slice(existing.end);
    } else output = output.trimEnd() + '\n\n' + op.content + '\n';
  }
  assert.equal(purpose(output), purpose(before), 'Purpose alterado');
  assert.equal(output.split(/\r?\n/)[0], before.split(/\r?\n/)[0], 'Título alterado');
  for (const r of old.filter(r => !names.has(r.name))) {
    assert.equal(requirements(output).find(n => n.name === r.name)?.content, r.content, `Conteúdo não mencionado alterado: ${r.name}`);
  }
  return output;
}
const mode = process.argv[2];
if (mode === 'inspect') {
  const list = json(path.join(report, 'archive-pre-list.json'));
  assert(list.root && status.root, 'Raiz ausente');
  const selected = list.changes.filter(c => c.name === status.changeName);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].totalTasks, 24);
  assert.equal(selected[0].completedTasks, 24);
  assert(status.artifacts.every(a => ['done', 'skipped'].includes(a.status)));
  const paths = status.artifactPaths.specs.existingOutputPaths;
  assert.equal(paths.length, 7);
  const specs = paths.map(deltaPath => {
    inside(deltaPath, path.join(change, 'specs'));
    const relative = path.relative(path.join(change, 'specs'), deltaPath);
    const mainPath = path.join(mainRoot, relative);
    inside(mainPath, mainRoot);
    const capability = path.dirname(relative).replaceAll('\\', '/');
    const delta = read(deltaPath);
    const before = fs.existsSync(mainPath) ? read(mainPath) : null;
    const after = expected(before, delta, capability);
    const ops = parseDelta(delta);
    return { capability, deltaPath, mainPath, delta, before, expected: after,
      added: ops.filter(o => o.op === 'ADDED').length, modified: ops.filter(o => o.op === 'MODIFIED').length,
      deltaScenarios: ops.reduce((n, o) => n + scenarios(o.content).length, 0),
      untouchedRequirements: before ? requirements(before).filter(r => !ops.some(o => o.name === r.name)).length : 0 };
  });
  save('archive-sync-baseline.json', { specs, protectedHashes: protectedFiles(), changeHashes: Object.fromEntries(walk(change).map(p => [path.relative(change, p), hash(p)])) });
  const assessment = specs.map(({ capability, added, modified, deltaScenarios, untouchedRequirements }) => ({ capability, added, modified, deltaScenarios, untouchedRequirements, syncNeeded: true, blocked: false }));
  save('archive-sync-assessment.json', assessment);
  console.log(JSON.stringify(assessment, null, 2));
} else if (mode === 'sync') {
  const baseline = json(path.join(report, 'archive-sync-baseline.json'));
  for (const spec of baseline.specs) {
    assert.equal(read(spec.deltaPath), spec.delta, 'Delta mudou desde avaliação');
    assert.equal(fs.existsSync(spec.mainPath) ? read(spec.mainPath) : null, spec.before, 'Main mudou desde avaliação');
    fs.mkdirSync(path.dirname(spec.mainPath), { recursive: true });
    fs.writeFileSync(spec.mainPath, spec.expected);
    console.log(`Synced ${spec.capability}: +${spec.added}, ~${spec.modified}`);
  }
} else if (mode === 'verify' || mode === 'verify-archive') {
  const baseline = json(path.join(report, 'archive-sync-baseline.json'));
  const checks = baseline.specs.map(spec => {
    const current = read(spec.mainPath);
    assert.equal(current, spec.expected, `Merge divergente: ${spec.capability}`);
    assert.equal(expected(current, spec.delta, spec.capability), current, 'Merge não idempotente');
    assert(!/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/m.test(current));
    assert.equal((current.match(/^## Requirements\r?$/gm) || []).length, 1);
    assert.equal(purpose(current), spec.before === null ? purpose(spec.delta) : purpose(spec.before));
    const parsed = requirements(current);
    for (const op of parseDelta(spec.delta)) {
      assert.equal(normalized(parsed.find(r => r.name === op.name)?.content ?? ''), normalized(op.content));
    }
    return { capability: spec.capability, requirements: parsed.length, scenarios: parsed.reduce((n, r) => n + scenarios(r.content).length, 0), deltaRequirements: spec.added + spec.modified, deltaScenarios: spec.deltaScenarios, titlePurposeAndUntouchedContentPreserved: true, alreadySynced: true };
  });
  for (const [p, h] of Object.entries(baseline.protectedHashes)) assert.equal(hash(p), h, `Arquivo protegido alterado: ${p}`);
  let archivePath = null;
  if (mode === 'verify-archive') {
    archivePath = process.argv[3];
    inside(archivePath, status.planningHome.changesDir);
    assert(!fs.existsSync(change), 'Change continua ativa no disco');
    const archiveFiles = walk(archivePath);
    assert.equal(archiveFiles.length, Object.keys(baseline.changeHashes).length);
    for (const [rel, h] of Object.entries(baseline.changeHashes)) assert.equal(hash(path.join(archivePath, rel)), h, `Artefato arquivado alterado: ${rel}`);
  }
  const result = { passed: true, checks, protectedFileCount: Object.keys(baseline.protectedHashes).length, archivePath, archivedFilesUnchanged: archivePath ? true : null };
  save(mode === 'verify' ? 'archive-sync-comparison.json' : 'archive-final-comparison.json', result);
  console.log(JSON.stringify(result, null, 2));
} else throw new Error('Use inspect, sync, verify ou verify-archive');
