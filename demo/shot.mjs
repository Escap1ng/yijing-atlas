import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PAGE = 'file:///D:/000GH%20more/zhouyi/demo/index.html';
const PORT = 9333;

const proc = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=D:/000GH more/zhouyi/demo/.edge-cdp',
  '--window-size=1440,1000',
  PAGE
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPage() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const p = list.find((x) => x.type === 'page' && x.url.includes('index.html'));
      if (p) return p;
    } catch (e) { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('no page target');
}

const page = await getPage();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
function send(method, params = {}) {
  return new Promise((res) => {
    const id = ++seq;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result && r.result.result && r.result.result.value;
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(new URL(name, import.meta.url), Buffer.from(r.result.data, 'base64'));
}
async function click(id, times = 1) {
  const expr = '(function(){for(var i=0;i<' + times + ';i++)document.getElementById(' +
    JSON.stringify(id) + ').click();return true;})()';
  await evalJs(expr);
}

await send('Page.enable');
await sleep(900);

await shot('shot-initial.png');

await click('btnStep', 5);
await sleep(750);
await shot('shot-step.png');
console.log('step check:', await evalJs("document.getElementById('check').textContent"));
console.log('step formula:', await evalJs("document.getElementById('formula').textContent"));

await click('btnReset');
await click('btnLine', 6);
await sleep(750);
await evalJs("document.getElementById('textBlock').scrollIntoView({block:'start'})");
await sleep(120);
await shot('shot-canon.png');
await evalJs("document.querySelector('.glossary').open=true");
await evalJs("document.querySelector('.glossary').scrollIntoView({block:'center'})");
await sleep(120);
await shot('shot-glossary.png');

await evalJs("var d=document.querySelector('.lz-long'); if(d){d.open=true; d.scrollIntoView({block:'center'});}");
await sleep(120);
await shot('shot-wangbi.png');
await evalJs('window.scrollTo(0, document.body.scrollHeight)');
await sleep(100);
await shot('shot-final.png');
console.log('final:', await evalJs("document.getElementById('hexMeta').innerText"));
console.log('status:', await evalJs("document.getElementById('status').textContent"));
console.log('steps:', await evalJs("document.getElementById('stepCount').textContent"));

await evalJs("document.querySelector('#tabs button[data-view=stars]').click()");
await sleep(250);
await shot('shot-stars.png');

await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: true });
await send('Page.reload');
await sleep(800);
await shot('shot-mobile.png');
await evalJs("document.querySelector('#tabs button[data-view=stars]').click()");
await sleep(250);
await shot('shot-stars-mobile.png');

await send('Browser.close');
ws.close();
proc.kill();
