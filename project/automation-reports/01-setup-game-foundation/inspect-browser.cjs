// Local validation helper using the preinstalled Codex runtime, not a project dependency.
const { createRequire } = require('node:module');
const fs = require('node:fs/promises');
const path = require('node:path');
const runtimeRequire = createRequire('C:/Users/Vinicius/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/');
const { chromium } = runtimeRequire('playwright');
const reportDir = __dirname;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Vinicius/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe', headless: true });
  const results = { browser: await browser.version(), pages: [], cycles: [], failure: null };
  try {
    for (const [server, port] of [['dev',5173], ['preview',4173]]) {
      const page = await browser.newPage({ viewport: {width:1280,height:900}, deviceScaleFactor:1 });
      const issues = [];
      page.on('pageerror', error => issues.push({type:'pageerror',message:error.message}));
      page.on('console', msg => { if (['error','warning'].includes(msg.type())) issues.push({type:msg.type(),message:msg.text()}); });
      await page.addInitScript(() => {
        const OriginalObserver = window.ResizeObserver;
        const observers = new Set();
        const resizeListeners = new Set();
        const animationFrames = new Set();
        window.__previewAudit = { observers, resizeListeners, animationFrames };
        const requestFrame = window.requestAnimationFrame.bind(window);
        const cancelFrame = window.cancelAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => {
          const id=requestFrame(time=>{animationFrames.delete(id);callback(time);});
          animationFrames.add(id);return id;
        };
        window.cancelAnimationFrame = id => {animationFrames.delete(id);return cancelFrame(id);};
        window.ResizeObserver = class extends OriginalObserver {
          observe(...args) { observers.add(this); return super.observe(...args); }
          disconnect() { observers.delete(this); return super.disconnect(); }
        };
        const add = window.addEventListener.bind(window);
        const remove = window.removeEventListener.bind(window);
        window.addEventListener = (type, listener, options) => { if(type==='resize') resizeListeners.add(listener); return add(type,listener,options); };
        window.removeEventListener = (type, listener, options) => { if(type==='resize') resizeListeners.delete(listener); return remove(type,listener,options); };
      });
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.getByRole('status').filter({hasText:'Static renderer preview'}).waitFor();
      for (const [label, width, height] of [['desktop',1280,900],['320px',320,740]]) {
        await page.setViewportSize({width,height});
        await page.waitForFunction(() => document.querySelector('canvas').width === document.querySelector('.preview-canvas').clientWidth);
        await page.waitForTimeout(150);
        const observed = await page.evaluate(() => ({
          title: document.querySelector('h1').textContent,
          status: document.querySelector('[role=status]').textContent,
          viewportWidth: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          canvasCount: document.querySelectorAll('canvas').length,
          canvasHidden: document.querySelector('canvas').closest('[aria-hidden=true]') !== null,
          canvasSize: [document.querySelector('canvas').width, document.querySelector('canvas').height],
          observerCount: window.__previewAudit.observers.size,
          resizeListeners: window.__previewAudit.resizeListeners.size,
          pendingAnimationFrames: window.__previewAudit.animationFrames.size,
          buttons: document.querySelectorAll('button').length,
        }));
        assert(observed.title === 'Pirate Battle', 'Missing semantic title');
        assert(observed.scrollWidth === width, 'Horizontal overflow');
        assert(observed.canvasCount === 1 && observed.canvasHidden, 'Canvas count or accessibility failure');
        console.log('Preview observation', server, label, JSON.stringify(observed));
        // Pixi's CanvasObserver also owns one ResizeObserver per live canvas.
        assert(observed.observerCount === 2 && observed.resizeListeners === 1, 'Unexpected live preview subscriptions');
        assert(observed.pendingAnimationFrames === 0, 'Unexpected continuously scheduled animation loop');
        assert(observed.buttons === 0, 'Unexpected fake gameplay action');
        const aria = await page.locator('body').ariaSnapshot();
        assert(!aria.includes('canvas'), 'Decorative canvas exposed');
        const screenshot = `${server}-${label}.png`;
        await page.screenshot({path:path.join(reportDir,screenshot),fullPage:true});
        results.pages.push({server,viewport:label,...observed,aria,screenshot,issues:[...issues]});
      }
      if (server === 'dev') {
        await page.setViewportSize({width:1280,height:900});
        for(let cycle=1;cycle<=5;cycle++) {
          await page.evaluate(async () => {
            const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
            const {createElement,StrictMode}=(await import('/node_modules/.vite/deps/react.js')).default;
            const {App}=await import('/src/ui/App.tsx');
            const host=document.createElement('div');host.id='lifecycle-check';document.body.append(host);
            const root=createRoot(host);window.__lifecycleRoot=root;
            root.render(createElement(StrictMode,null,createElement(App)));
          });
          await page.locator('#lifecycle-check [role=status]').filter({hasText:'Static renderer preview'}).waitFor();
          await page.waitForFunction(() => window.__previewAudit.animationFrames.size === 0);
          const mounted=await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,observers:window.__previewAudit.observers.size,listeners:window.__previewAudit.resizeListeners.size,pendingAnimationFrames:window.__previewAudit.animationFrames.size}));
          assert(mounted.canvases===2 && mounted.observers===4 && mounted.listeners===2, 'Duplicate mounted resources');
          await page.evaluate(()=>{window.__lifecycleRoot.unmount();document.querySelector('#lifecycle-check').remove();});
          await page.waitForFunction(() => window.__previewAudit.animationFrames.size === 0);
          const unmounted=await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,observers:window.__previewAudit.observers.size,listeners:window.__previewAudit.resizeListeners.size,pendingAnimationFrames:window.__previewAudit.animationFrames.size}));
          assert(unmounted.canvases===1 && unmounted.observers===2 && unmounted.listeners===1, 'Resources retained after unmount');
          assert(mounted.pendingAnimationFrames===0 && unmounted.pendingAnimationFrames===0, 'Animation loop retained during lifecycle check');
          results.cycles.push({cycle,mounted,unmounted});
        }
      }
      const unexpected=issues.filter(issue=>!(issue.type==='warning' && issue.message.includes('GPU stall due to ReadPixels')));
      assert(unexpected.length===0, `Unexpected browser issues: ${JSON.stringify(unexpected)}`);
      results.pages.push({server,consoleAfterCycles:issues});
      await page.close();
    }
    const failure=await browser.newPage({viewport:{width:320,height:740}});
    const errors=[];
    failure.on('pageerror', error=>errors.push(error.message));
    await failure.addInitScript(()=>{
      // Pixi 8.22 also falls back to Canvas2D, so deny every rendering context.
      HTMLCanvasElement.prototype.getContext=function(){return null;};
    });
    await failure.goto('http://127.0.0.1:4173/');
    await failure.getByRole('status').filter({hasText:'Renderer preview unavailable'}).waitFor();
    results.failure={status:await failure.getByRole('status').innerText(),title:await failure.getByRole('heading',{level:1}).innerText(),canvasCount:await failure.locator('canvas').count(),pageErrors:errors};
    assert(results.failure.canvasCount===0 && errors.length===0,'Failure left canvas or unhandled rejection');
    await failure.screenshot({path:path.join(reportDir,'preview-graphics-failure-320px.png'),fullPage:true});
    await failure.close();
    await fs.writeFile(path.join(reportDir,'browser-observations.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
