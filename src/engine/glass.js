/**
 * 玻璃材质系统
 * - glassify: 注入液态玻璃材质（高光随指针流动 / 折射滤镜 / 按压液感）
 * - pressable: 弹簧驱动按压缩放 + 点击高光脉冲（“丝滑点击”手感）
 */
import { Spring } from './spring.js';
import { gestures } from './gestures.js';
import { tween } from './tween.js';

let distortOK = null;
export function supportsDistort() {
  if (distortOK === null) {
    const css = getComputedStyle(document.documentElement);
    distortOK = CSS.supports('backdrop-filter', 'url(#lg-distort)') ||
      CSS.supports('-webkit-backdrop-filter', 'url(#lg-distort)');
    void css;
  }
  return distortOK;
}

/* ── 全局玻璃调节（设置 APP 实时生效） ── */
const glassRegistry = new Set(); // { el, baseBlur, refract }
let blurScale = 1;
let refractOn = true;

function applyGlass(item) {
  if (!item.el.isConnected) { glassRegistry.delete(item); return; }
  if (item.baseBlur) {
    item.el.style.setProperty('--blur', `${(item.baseBlur * blurScale).toFixed(1)}px`);
  }
  item.el.classList.toggle('refract', item.refract && refractOn && supportsDistort());
}

export function setGlassBlurScale(v) {
  blurScale = v;
  for (const item of [...glassRegistry]) applyGlass(item);
}

export function setGlassRefract(on) {
  refractOn = !!on;
  for (const item of [...glassRegistry]) applyGlass(item);
}

/**
 * 把任意元素变成液态玻璃。
 * opts: { blur: px, tint: rgba背景, refract: 是否尝试折射层(Cromium), light: 高光强度 }
 */
export function glassify(el, opts = {}) {
  el.classList.add('glass');
  if (opts.tint) el.style.setProperty('--tint', opts.tint);
  if (opts.blur) el.style.setProperty('--blur', `${opts.blur}px`);
  if (opts.light) el.style.setProperty('--light', opts.light);
  glassRegistry.add({ el, baseBlur: opts.blur || 0, refract: !!opts.refract });

  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--gx', `${x.toFixed(1)}%`);
    el.style.setProperty('--gy', `${y.toFixed(1)}%`);
  };
  const onLeave = () => {
    el.style.setProperty('--gx', '50%');
    el.style.setProperty('--gy', '40%');
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', onMove);
  el.addEventListener('pointerleave', onLeave);

  if (opts.refract && supportsDistort()) el.classList.add('refract');
  onLeave();
  return el;
}

/**
 * 可按压元素：弹簧缩放跟手 + 高光脉冲 + tap/long-press。
 * 返回 { spring, destroy }
 */
export function pressable(el, opts = {}) {
  const { scale = 0.9, onTap, onLongPress, spring = {}, flash = true } = opts;
  const s = new Spring(1, { stiffness: 380, damping: 24, precision: 0.0008, ...spring });
  s.onUpdate = (v) => {
    el.style.setProperty('--press', v.toFixed(4));
  };

  const flashPulse = () => {
    if (!flash) return;
    el.style.setProperty('--flash', '1');
    tween({
      from: 1, to: 0, duration: 0.5, ease: (t) => t,
      onUpdate: (v) => el.style.setProperty('--flash', v.toFixed(3)),
    });
  };

  const g = gestures(el, {
    capture: false, // 嵌套容器友好
    onPressStart: () => s.to(scale),
    onPressEnd: () => s.to(1),
    onTap: (c) => { flashPulse(); onTap && onTap(c); },
    onLongPress: (c) => { flashPulse(); onLongPress && onLongPress(c); },
  });

  return { spring: s, destroy: g.destroy };
}

/** 全局光源位置（玻璃表面高光统一跟随） */
export const globalLight = { x: 0.5, y: 0.2 };
const lightSubs = new Set();
export function setGlobalLight(x, y) {
  globalLight.x = x;
  globalLight.y = y;
  for (const fn of lightSubs) fn(x, y);
}
export function onLight(fn) {
  lightSubs.add(fn);
  return () => lightSubs.delete(fn);
}
