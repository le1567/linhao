/** 入口 — 组装引擎与 UI，接通全局流体交互 */
import { ticker } from './engine/ticker.js';
import { Fluid } from './engine/fluid.js';
import { glassify, pressable, setGlobalLight } from './engine/glass.js';
import { gestures } from './engine/gestures.js';
import { tween } from './engine/tween.js';
import { initClock } from './ui/statusbar.js';
import { initIsland } from './ui/island.js';
import { initHomescreen } from './ui/homescreen.js';
import { initLockscreen } from './ui/lockscreen.js';
import { initControlCenter, closeControlCenter } from './ui/controlcenter.js';
import { initApps, openApp, closeApp, isAppOpen } from './ui/apps.js';
import { initToast } from './ui/toast.js';
import { initSettings } from './ui/settings.js';
import { on, state } from './ui/state.js';

const screen = document.getElementById('screen');
const canvas = document.getElementById('fluid');

initToast();
initClock();
initApps();

/* ── 流体壁纸 ── */
const fluid = new Fluid(canvas);
let fluidOK = fluid.ok;
if (fluidOK) {
  // 限到 ~40fps，并把单步 dt 收在 1/24 内：降低 GPU 占用的同时让流场更稳定
  let fluidAcc = 0;
  ticker.add((dt) => {
    fluidAcc += dt;
    if (fluidAcc < 1 / 40) return;
    fluid.step(Math.min(fluidAcc, 1 / 24));
    fluidAcc = 0;
  });
  new ResizeObserver(() => fluid.resize()).observe(screen);
} else {
  screen.classList.add('no-fluid'); // CSS 渐变兜底
}

function splatAt(clientX, clientY, dx = 0, dy = 0, force = 1, color = null) {
  if (!fluidOK) return;
  const r = screen.getBoundingClientRect();
  const x = (clientX - r.left) / r.width;
  const y = (clientY - r.top) / r.height;
  fluid.splat(x, y, dx * force, dy * force, color);
}

/* 指尖拖动 → 流体 */
let lastPX = 0, lastPY = 0, lastPT = 0, accDist = 0, gestureColor = null;
screen.addEventListener('pointerdown', (e) => {
  lastPX = e.clientX; lastPY = e.clientY; lastPT = performance.now(); accDist = 0;
  gestureColor = fluidOK ? fluid.nextColor() : null;
  splatAt(e.clientX, e.clientY, 0, 0, 1, gestureColor);
});
screen.addEventListener('pointermove', (e) => {
  const now = performance.now();
  const dx = e.clientX - lastPX;
  const dy = e.clientY - lastPY;
  lastPX = e.clientX; lastPY = e.clientY; lastPT = now;
  accDist += Math.hypot(dx, dy);
  if (accDist < 9) return;
  accDist = 0;
  const r = screen.getBoundingClientRect();
  splatAt(e.clientX, e.clientY, (dx / r.width) * 150, (dy / r.height) * 150, 1, gestureColor);
  setGlobalLight((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});
screen.addEventListener('pointerup', () => { gestureColor = null; });

/* 空置时只做极轻的环境扰动，主体氛围交给 CSS 壁纸 */
if (fluidOK) {
  setInterval(() => {
    if (document.hidden) return;
    const r = screen.getBoundingClientRect();
    const x = r.left + Math.random() * r.width;
    const y = r.top + Math.random() * r.height;
    const a = Math.random() * Math.PI * 2;
    fluid.splat(
      (x - r.left) / r.width, (y - r.top) / r.height,
      Math.cos(a) * 26, Math.sin(a) * 26,
      fluid.nextColor()
    );
  }, 3600);
}

/* ── UI 装配 ── */
initIsland(() => openApp('music'));
initLockscreen(openApp);
initHomescreen(openApp);
initControlCenter(openApp);

on('flash-toggle', () => {
  const el = document.getElementById('flash-overlay');
  const onNow = el.classList.toggle('on');
  onNow && tween({
    from: 0, to: 1, duration: 0.18, onUpdate: (v) => (el.style.opacity = String(v * 0.92)),
  });
  if (!onNow) el.style.opacity = '0';
});

on('flash-blink', () => {
  const el = document.getElementById('flash-overlay');
  el.classList.add('on');
  tween({
    from: 0, to: 1, duration: 0.12,
    onUpdate: (v) => (el.style.opacity = String(v * 0.9)),
    onComplete: () => tween({
      from: 1, to: 0, duration: 0.3, onUpdate: (v) => (el.style.opacity = String(v * 0.9)),
      onComplete: () => { el.classList.remove('on'); el.style.opacity = '0'; },
    }),
  });
});

/* 解锁流程：锁屏退场 → 主屏图标弹入 */
on('unlock', () => {
  import('./ui/homescreen.js').then((m) => m.revealHome());
});

/* ── Home 条 ── */
const homebar = document.getElementById('homebar-zone');
gestures(homebar, {
  onTap: () => {
    if (state.ccOpen) return closeControlCenter();
    if (isAppOpen()) closeApp();
  },
  onPanEnd: (c) => {
    if (c.vy < -300 || c.dy < -30) {
      if (state.ccOpen) closeControlCenter();
      else if (isAppOpen()) closeApp();
    }
  },
});

/* ── 设备缩放（桌面端展示完整平板机身） ── */
const device = document.getElementById('device');
const DEV_W = 1208, DEV_H = 848;
function fitDevice() {
  const vw = window.innerWidth, vh = window.innerHeight;
  // 手机竖屏：由 CSS 接管为全屏自适应布局，不再缩放平板机身
  const phone = vw < 700 && vh > vw;
  if (phone) { device.style.transform = 'none'; return; }
  const s = vw < 860
    ? Math.min(vw / DEV_W, vh / DEV_H)
    : Math.min((vw - 88) / DEV_W, (vh - 128) / DEV_H, 1.12);
  device.style.transform = `scale(${s.toFixed(4)})`;
}
fitDevice();
window.addEventListener('resize', fitDevice);
window.addEventListener('contextmenu', (e) => e.preventDefault());

/* ── 设置 → 引擎实时生效 ── */
on('setting-change', ({ key, value }) => {
  if (key !== 'fluid') return;
  fluidOK = value && fluid.ok;
  screen.classList.toggle('no-fluid', !fluidOK);
});
initSettings();

/* 开机引导一次：提示可交互 */
setTimeout(() => {
  const t = document.getElementById('toast');
  if (t && !state.unlocked) {
    t.textContent = '触摸屏幕 · 流体随指尖流动';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }
}, 1400);
