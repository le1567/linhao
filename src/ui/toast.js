import { tween } from '../engine/tween.js';
import { glassify } from '../engine/glass.js';

let el = null;
let timer = 0;

export function initToast() {
  el = document.getElementById('toast');
}

export function toast(msg, dur = 1600) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), dur);
  // 轻微弹跳
  tween({
    from: 0.96, to: 1, duration: 0.4,
    ease: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
    onUpdate: (v) => (el.style.setProperty('--pop', v.toFixed(4))),
  });
}

export const glassToast = () => glassify(el, { blur: 18 });
