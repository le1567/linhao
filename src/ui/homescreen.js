/** 主屏幕 — 页面弹簧滑动 / 图标按压 / 长按抖动 / Dock / 小组件 */
import { Spring } from '../engine/spring.js';
import { gestures, rubber } from '../engine/gestures.js';
import { glassify, pressable } from '../engine/glass.js';
import { tween, stagger } from '../engine/tween.js';
import { state, emit } from './state.js';
import { apps, glyphs } from './icons.js';
import { toast } from './toast.js';

const PAGES = [
  {
    widgets: ['clockWidget', 'weatherWidget'],
    icons: ['photos', 'notes', 'calculator', 'clock', 'weather', 'settings', 'mail', 'maps', 'calendar', 'health', 'wallet', 'appstore'],
  },
  {
    wide: true,
    widgets: ['musicWidget', 'notesWidget'],
    icons: [],
  },
];
const DOCK = ['phone', 'safari', 'message', 'camera', 'music'];

let homeEl, pagesEl, dotsEl;
let pageW = 1;
let pageIndex = 0;
let offset;
const iconEls = new Map(); // id → plate element (用于 app 打开动画)

export function initHomescreen(openApp) {
  homeEl = document.getElementById('homescreen');
  pagesEl = document.getElementById('pages');
  dotsEl = document.getElementById('dots');
  const dots = [...dotsEl.children];

  buildPage(PAGES[0], document.getElementById('page-1'), openApp);
  buildPage(PAGES[1], document.getElementById('page-2'), openApp);
  buildDock(openApp);

  const measure = () => {
    pageW = pagesEl.children[0].getBoundingClientRect().width || 1;
  };
  measure();
  new ResizeObserver(measure).observe(document.getElementById('screen'));

  offset = new Spring(0, { stiffness: 240, damping: 26 });
  offset.onUpdate = (v) => {
    pagesEl.style.transform = `translate3d(${v.toFixed(2)}px,0,0)`;
    const p = -v / pageW;
    dots.forEach((d, i) => d.classList.toggle('on', Math.round(p) === i));
  };

  let startOffset = 0;
  gestures(homeEl, {
    capture: false, // 不抢 capture，让图标/组件的 pressable 收得到 pointerup
    onPanStart: () => {
      startOffset = offset.value;
      offset.set(offset.value);
    },
    onPanMove: (c) => {
      let x = startOffset + c.dx;
      const min = -(PAGES.length - 1) * pageW;
      if (x > 0) x = rubber(x, pageW);
      if (x < min) x = min - rubber(min - x, pageW);
      offset.set(x);
    },
    onPanEnd: (c) => {
      // 相对当前页的连续进度（含 120ms 速度预测）：拖过 30% 页宽，或快速一甩即翻页
      const p = -offset.value / pageW;
      const proj = p - (c.vx * 0.12) / pageW;
      let idx = pageIndex;
      if (proj > pageIndex + 0.3) idx = Math.min(PAGES.length - 1, pageIndex + 1);
      else if (proj < pageIndex - 0.3) idx = Math.max(0, pageIndex - 1);
      goTo(idx, c.vx);
    },
  });

  // 背景点击退出抖动模式
  homeEl.addEventListener('pointerdown', (e) => {
    if (state.jiggle && !e.target.closest('.icon')) exitJiggle();
  });

  function goTo(idx, vx = 0) {
    pageIndex = idx;
    const target = -idx * pageW;
    offset.to(target);
    // 仅在速度方向与目标一致时注入惯性，避免回弹过冲
    if (Math.abs(vx) > 200 && Math.sign(target - offset.value) === Math.sign(vx)) {
      offset.addVelocity(vx * 0.7);
    }
  }

  emit('home-ready');
}

export function iconPlate(id) {
  return iconEls.get(id);
}

export function goToPage(idx) {
  offset?.to(-idx * pageW);
}

/* ---------- 构建 ---------- */

function iconHTML(id, { inDock = false } = {}) {
  const app = apps[id];
  const el = document.createElement('div');
  el.className = 'icon';
  el.dataset.app = id;
  el.innerHTML = `
    <div class="plate" style="--bg:${app.bg}">
      <span class="glyph">${glyphs[id.replace('safari', 'safari')] ?? glyphs.appstore}</span>
      ${inDock ? '' : `<span class="badge">${glyphs.x}</span>`}
    </div>
    ${inDock ? '' : `<span class="label">${app.name}</span>`}`;
  return el;
}

function buildPage(def, pageEl, openApp) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  // 小组件行（各占 2×2；wide 页为整行大组件）
  const wRow = document.createElement('div');
  wRow.className = def.wide ? 'widgets wide' : 'widgets';
  def.widgets.forEach((w) => {
    const el = WIDGETS[w](openApp);
    pressable(el, { scale: 0.97, flash: false, onTap: () => {
      if (!state.jiggle) WIDGET_OPEN[w]?.(openApp);
    } });
    wRow.appendChild(el);
  });
  grid.appendChild(wRow);

  // 图标
  if (def.icons.length) {
    const iRow = document.createElement('div');
    iRow.className = 'icons';
    def.icons.forEach((id) => {
      const el = iconHTML(id);
      iRow.appendChild(el);
      wireIcon(el, id, openApp);
    });
    grid.appendChild(iRow);
  }
  pageEl.appendChild(grid);
}

function buildDock(openApp) {
  const dock = document.getElementById('dock');
  DOCK.forEach((id) => {
    const el = iconHTML(id, { inDock: true });
    el.querySelector('.plate').classList.add('dock-plate');
    dock.appendChild(el);
    wireIcon(el, id, openApp);
  });
  glassify(dock, { blur: 24, tint: 'rgba(18,20,40,0.20)', light: 0.7, refract: true });
}

function wireIcon(el, id, openApp) {
  const plate = el.querySelector('.plate');
  iconEls.set(id, plate);
  plate.style.setProperty('--jd', `${(Math.random() * -0.32).toFixed(2)}s`);

  pressable(plate, {
    scale: 0.86,
    onTap: () => {
      if (state.jiggle) return;
      openApp(id, plate);
    },
    onLongPress: () => {
      if (!state.jiggle && !state.appOpen) enterJiggle();
    },
  });
  plate.querySelector('.badge')?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (state.jiggle) toast('演示模式：图标删不掉的哦');
  });
}

/* ---------- 抖动模式 ---------- */

export function enterJiggle() {
  state.jiggle = true;
  homeEl.classList.add('jiggle');
  emit('jiggle', true);
}

export function exitJiggle() {
  state.jiggle = false;
  homeEl.classList.remove('jiggle');
  emit('jiggle', false);
}

/* ---------- 解锁入场动画 ---------- */

export function revealHome() {
  const plates = [...document.querySelectorAll('#homescreen .plate')];
  plates.forEach((p) => {
    p.style.setProperty('--pop', '0.55');
    p.style.setProperty('--pop-o', '0');
  });
  stagger(plates.length, 0.028, (i) => {
    const p = plates[i];
    tween({
      from: 0.55, to: 1, duration: 0.55,
      ease: (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
      onUpdate: (v) => p.style.setProperty('--pop', v.toFixed(4)),
    });
    tween({
      from: 0, to: 1, duration: 0.4, delay: 0.05,
      onUpdate: (v) => p.style.setProperty('--pop-o', v.toFixed(3)),
    });
  });
}

/* ---------- 小组件 ---------- */

const WIDGET_OPEN = {
  clockWidget: (open) => open('clock'),
  weatherWidget: (open) => open('weather'),
  musicWidget: (open) => open('music'),
  notesWidget: (open) => open('notes'),
};

const WIDGETS = {
  clockWidget() {
    const el = document.createElement('div');
    el.className = 'widget glass';
    el.innerHTML = `
      <div class="w-clock-city">上海</div>
      <div class="w-clock-time" id="w-clock">--:--</div>
      <div class="w-clock-date" id="w-clock-date"></div>`;
    glassify(el, { blur: 20, tint: 'rgba(16,18,42,0.20)', refract: true });
    const tEl = el.querySelector('#w-clock');
    const dtEl = el.querySelector('#w-clock-date');
    const upd = () => {
      const d = new Date();
      tEl.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      const week = '星期日,星期一,星期二,星期三,星期四,星期五,星期六'.split(',');
      dtEl.textContent = `${d.getMonth() + 1}月${d.getDate()}日 ${week[d.getDay()]}`;
    };
    upd();
    setInterval(upd, 10000);
    return el;
  },

  weatherWidget() {
    const el = document.createElement('div');
    el.className = 'widget glass';
    el.innerHTML = `
      <div class="w-wx-top"><span>上海</span><span class="w-wx-glyph">${glyphs.weather}</span></div>
      <div class="w-wx-temp">22°</div>
      <div class="w-wx-sub">多云 · 最高26° 最低19°</div>`;
    glassify(el, { blur: 20, tint: 'rgba(20,40,80,0.20)', refract: true });
    return el;
  },

  musicWidget() {
    const el = document.createElement('div');
    el.className = 'widget glass';
    el.innerHTML = `
      <div class="w-music">
        <div class="w-music-art"></div>
        <div class="w-music-meta">
          <div class="t">Liquid Dreams</div>
          <div class="a">Aurora Engine</div>
        </div>
        <div class="w-music-bars"><span></span><span></span><span></span></div>
      </div>`;
    glassify(el, { blur: 20, tint: 'rgba(40,16,52,0.22)', refract: true });
    return el;
  },

  notesWidget() {
    const el = document.createElement('div');
    el.className = 'widget glass';
    el.innerHTML = `
      <div class="w-notes">
        <div class="t">今日待办</div>
        <div class="item done">设计液态玻璃引擎</div>
        <div class="item done">弹簧物理调参</div>
        <div class="item">部署上线</div>
      </div>`;
    glassify(el, { blur: 20, tint: 'rgba(50,44,12,0.20)', refract: true });
    return el;
  },
};
