/** 锁屏 — 跟手上滑解锁（橡皮筋 + 速度判定 + 弹簧收场） */
import { Spring } from '../engine/spring.js';
import { gestures } from '../engine/gestures.js';
import { glassify, pressable } from '../engine/glass.js';
import { state, emit } from './state.js';
import { glyphs } from './icons.js';
import { toast } from './toast.js';

let lockEl, innerEl;
let offset;
let unlocked = false;

export function initLockscreen(openApp) {
  lockEl = document.getElementById('lockscreen');
  innerEl = lockEl.querySelector('.lock-inner');

  glassify(lockEl.querySelector('.notif'), { blur: 20, tint: 'rgba(16,18,40,0.30)', refract: true });
  glassify(document.getElementById('btn-flash'), { blur: 14 });
  glassify(document.getElementById('btn-cam'), { blur: 14 });

  pressable(document.getElementById('btn-flash'), {
    scale: 0.82,
    onTap: () => emit('flash-toggle'),
  });
  pressable(document.getElementById('btn-cam'), {
    scale: 0.82,
    onTap: () => {
      toast('先解锁哦 → 上滑');
    },
  });

  const hint = lockEl.querySelector('.lock-hint');
  const apply = (v) => {
    lockEl.style.transform = `translate3d(0,${v.toFixed(1)}px,0)`;
    const H = lockEl.getBoundingClientRect().height || 800;
    const p = Math.min(1, Math.max(0, -v / (H * 0.34)));
    innerEl.style.setProperty('--fade', p.toFixed(3));
    hint.style.opacity = String(1 - p * 1.6);
  };
  offset = new Spring(0, { stiffness: 300, damping: 32 });
  offset.onUpdate = apply;

  let startY = 0;
  gestures(lockEl, {
    capture: false, // 通知卡/锁屏按钮的 pressable 需要收到 pointerup
    onPanStart: (c) => {
      startY = offset.value;
      offset.set(offset.value);
    },
    onPanMove: (c) => {
      let y = startY + c.dy;
      if (y > 0) y *= 0.25; // 向下拽给一点阻力
      offset.set(y);
    },
    onPanEnd: (c) => {
      const H = lockEl.getBoundingClientRect().height;
      const shouldUnlock = -offset.value > 78 || c.vy < -320;
      if (!unlocked && shouldUnlock) unlock(H);
      else offset.to(0);
    },
  });

  function unlock(H) {
    unlocked = true;
    state.unlocked = true; // 立即放行交互，动画只负责视觉退场
    lockEl.style.pointerEvents = 'none';
    document.getElementById('screen')?.classList.remove('locked');
    emit('unlock');
    offset.to(-H * 1.15);
    offset.onRest = () => {
      lockEl.style.display = 'none';
      offset.onRest = null;
    };
    // 兜底：低帧率下弹簧 onRest 可能迟到，保证锁屏一定退场
    setTimeout(() => {
      if (!unlocked) return;
      lockEl.style.display = 'none';
      offset.onRest = null;
    }, 900);
    emit('unlock-start');
  }
}

export function isUnlocked() {
  return unlocked;
}
