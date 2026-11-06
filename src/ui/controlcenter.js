/** 控制中心 — 玻璃面板下拉/收起、液面滑杆、开关磁贴 */
import { Spring } from '../engine/spring.js';
import { gestures, rubber } from '../engine/gestures.js';
import { glassify, pressable } from '../engine/glass.js';
import { tween } from '../engine/tween.js';
import { state, emit } from './state.js';
import { glyphs } from './icons.js';
import { isPlaying, togglePlay } from './audio.js';
import { toast } from './toast.js';
import { applyBrightness } from './settings.js';

let panel, scrim, ccEl;
let ySpring, scrimTw = null;
let open = false;

export function initControlCenter(openApp) {
  ccEl = document.getElementById('cc');
  panel = document.getElementById('cc-panel');
  scrim = document.getElementById('cc-scrim');
  const grab = document.getElementById('cc-grab');

  glassify(panel, { blur: 30, tint: 'rgba(14,16,36,0.34)', light: 1, refract: true });
  panel.querySelectorAll('.cc-card').forEach((c) =>
    glassify(c, { blur: 16, tint: 'rgba(255,255,255,0.05)' })
  );

  const apply = (v) => {
    panel.style.transform = `translate3d(0,${v.toFixed(1)}px,0)`;
  };
  ySpring = new Spring(-panelH(), { stiffness: 320, damping: 30 });
  ySpring.onUpdate = apply;
  apply(ySpring.value);
  ccEl.classList.add('hidden-layer');

  const openCC = (animate = true) => {
    open = true;
    state.ccOpen = true;
    ccEl.classList.add('open');
    ccEl.classList.remove('hidden-layer');
    ySpring.to(0);
    fadeScrim(1);
    emit('cc-open');
  };
  const closeCC = () => {
    open = false;
    state.ccOpen = false;
    ccEl.classList.remove('open');
    ySpring.to(-panelH());
    fadeScrim(0);
    setTimeout(() => !open && ccEl.classList.add('hidden-layer'), 380);
    emit('cc-close');
  };
  ccEl._close = closeCC;

  function panelH() {
    return panel.getBoundingClientRect().height || 430;
  }

  function fadeScrim(target) {
    scrimTw?.cancel();
    const from = parseFloat(getComputedStyle(scrim).opacity) || 0;
    scrimTw = tween({
      from, to: target, duration: 0.32,
      onUpdate: (v) => (scrim.style.opacity = v.toFixed(3)),
    });
  }

  // 顶部右侧下拉区
  let startY = 0;
  gestures(grab, {
    onPanStart: () => {
      ccEl.classList.remove('hidden-layer');
      startY = ySpring.value;
      ySpring.set(ySpring.value);
    },
    onPanMove: (c) => {
      let y = startY + c.dy;
      const min = -panelH();
      if (y < min) y = min + rubber(min - y, panelH(), 0.4);
      if (y > 0) y = 0;
      ySpring.set(y);
      scrim.style.opacity = String(Math.min(1, (y + panelH()) / panelH()));
    },
    onPanEnd: (c) => {
      const shown = (ySpring.value + panelH()) / panelH();
      if (shown > 0.32 || c.vy > 420) openCC();
      else closeCC();
    },
  });

  // 面板上滑 / 点遮罩关闭
  gestures(panel, {
    capture: false, // 面板内开关/滑杆需要正常收到 pointerup
    onPanEnd: (c) => {
      if (c.vy < -420) closeCC();
    },
  });
  scrim.addEventListener('pointerdown', () => closeCC());

  // ── 开关 ──
  const toggles = {
    'cc-airplane': () => toast('飞行模式 已切换'),
    'cc-wifi': () => toast('Wi-Fi 已切换'),
    'cc-bt': () => toast('蓝牙 已切换'),
  };
  for (const [id, fn] of Object.entries(toggles)) {
    const el = document.getElementById(id);
    pressable(el, {
      scale: 0.86,
      onTap: () => {
        el.classList.toggle('on');
        el.classList.contains('on')
          ? el.style.setProperty('--accent', accentOf(id))
          : el.style.removeProperty('--accent');
        fn();
      },
    });
  }

  // ── 滑杆 ──
  slider(document.getElementById('cc-bright'), (v) => applyBrightness(v));
  slider(document.getElementById('cc-vol'), (v) => {});

  // ── 磁贴 ──
  tile('cc-tile-flash', () => emit('flash-toggle'));
  tile('cc-tile-calc', () => { closeCC(); openApp('calculator'); });
  tile('cc-tile-cam', () => { closeCC(); openApp('camera'); });
  tile('cc-tile-dnd', (el) => {
    el.classList.toggle('on');
    toast(el.classList.contains('on') ? '勿扰模式 已开启' : '勿扰模式 已关闭');
  });

  // 音乐迷你卡
  const playBtn = document.getElementById('cc-play');
  pressable(playBtn, {
    scale: 0.85,
    onTap: () => {
      const p = togglePlay();
      playBtn.innerHTML = p ? glyphs.pause : glyphs.play;
    },
  });
}

function accentOf(id) {
  return id === 'cc-airplane' ? '#ff9f0a' : id === 'cc-wifi' ? '#0a84ff' : '#0a84ff';
}

function tile(id, onTap) {
  const el = document.getElementById(id);
  pressable(el, {
    scale: 0.9,
    onTap: () => onTap(el),
  });
}

/** 垂直液面滑杆：拖动跟手，松手弹簧收场 */
function slider(el, onValue) {
  const fill = el.querySelector('.cc-fill');
  const s = new Spring(0.62, { stiffness: 220, damping: 24 });
  s.onUpdate = (v) => {
    fill.style.height = `${(v * 100).toFixed(2)}%`;
  };
  s.set(0.62);

  const setFrom = (c) => {
    const r = el.getBoundingClientRect();
    const v = Math.min(1, Math.max(0, 1 - (c.event.clientY - r.top) / r.height));
    s.set(v);
    onValue(v);
  };
  gestures(el, {
    onPanStart: (c) => setFrom(c),
    onPanMove: (c) => setFrom(c),
    onPanEnd: (c) => {
      const r = el.getBoundingClientRect();
      const v = Math.min(1, Math.max(0, 1 - (c.event.clientY - r.top) / r.height));
      s.to(v);
      s.addVelocity(c.vy * 0.0006);
    },
  });
  // 阻止冒泡到面板（避免触发面板关闭手势）
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
}

export function closeControlCenter() {
  if (open) ccEl?._close?.();
}
