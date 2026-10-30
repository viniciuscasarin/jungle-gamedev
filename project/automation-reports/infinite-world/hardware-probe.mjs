import { chromium } from '@playwright/test';
import fs from 'node:fs';
const paths = [
  'C:/Users/Vinicius/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const results=[];
for(const executablePath of paths){
  let browser;
  try{
    browser=await chromium.launch({executablePath,headless:true,args:['--enable-gpu','--use-angle=d3d11'],timeout:20000});
    const page=await browser.newPage();
    const gpu=await page.evaluate(()=>{
      const c=document.createElement('canvas'),gl=c.getContext('webgl2');
      if(!gl)return {available:false};
      const ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {available:true,renderer:ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unknown'};
    });
    results.push({executablePath,...gpu});
  }catch(error){results.push({executablePath,error:String(error).split('\n')[0]});}
  finally{await browser?.close();}
}
fs.writeFileSync('project/automation-reports/infinite-world/hardware-probe-native.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
