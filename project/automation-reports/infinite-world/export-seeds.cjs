const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const modules = new Map();
function load(file) {
  file = path.resolve(file.endsWith('.ts') ? file : file + '.ts');
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const relativeRequire = id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id)) : require(id);
  new Function('require', 'module', 'exports', js)(relativeRequire, module, module.exports);
  return module.exports;
}
const c = load('src/domain/config.ts').DEFAULT_CONFIG;
const generate = load('src/simulation/world/generator.ts').generateRegion;
const samples = [];
for (const family of ['compact', 'elongated', 'wide']) {
  let seed = 0, region;
  do { region = generate(c.world, seed, { x: 0, y: 0 }); if (region.islands[0].modelId === family) break; seed++; } while (seed < 10000);
  const { solidOutline, ...island } = region.islands[0];
  samples.push({ family, seed, layoutId: region.layoutId, island, vertices: solidOutline.length });
}
fs.writeFileSync('project/automation-reports/infinite-world/island-family-seeds.json', JSON.stringify(samples, null, 2));
console.log(JSON.stringify(samples.map(s => ({ family: s.family, seed: s.seed, layout: s.layoutId }))));
