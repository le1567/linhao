/** 应用层 — 打开/关闭过渡（FLIP 弹簧缩放 + 圆角形变）与内置演示应用 */
import { Spring } from '../engine/spring.js';
import { pressable } from '../engine/glass.js';
import { glassify } from '../engine/glass.js';
import { ticker } from '../engine/ticker.js';
import { state, emit } from './state.js';
import { glyphs, apps } from './icons.js';
import { spectrum, isPlaying, togglePlay } from './audio.js';
import { toast } from './toast.js';
import { gestures } from '../engine/gestures.js';
import { settings, setSetting, applyBrightness } from './settings.js';

let appEl, contentEl, screenEl;
let scaleS, radiusS;
let openId = null;
let visualUnsub = null;

export function initApps() {
  appEl = document.getElementById('appscreen');
  contentEl = document.getElementById('app-content');
  screenEl = document.getElementById('screen');

  scaleS = new Spring(0.2, { stiffness: 300, damping: 27 });
  radiusS = new Spring(40, { stiffness: 300, damping: 27 });
  scaleS.onUpdate = (v) => (appEl.style.transform = `scale(${v.toFixed(4)})`);
  radiusS.onUpdate = (v) => (appEl.style.borderRadius = `${v.toFixed(2)}px`);
}

export function isAppOpen() {
  return openId !== null;
}

export function openApp(id, iconEl) {
  if (openId || state.unlocked === false) {
    if (!state.unlocked) return;
  }
  if (openId) return;
  const app = apps[id];
  if (!app) return;
  if (app.open === 'toast') {
    toast(`${app.name} · 演示占位`);
    return;
  }

  openId = id;
  state.appOpen = { id, iconEl };
  contentEl.innerHTML = '';
  const build = BUILDERS[id];
  try {
    if (build) build(contentEl);
    else genericApp(contentEl, id);
  } catch (err) {
    console.error('[openApp] build failed:', id, err);
    genericApp(contentEl, id);
  }

  const r = iconEl.getBoundingClientRect();
  const sr = screenEl.getBoundingClientRect();
  const k = r.width / sr.width;
  appEl.style.transformOrigin = `${r.left + r.width / 2 - sr.left}px ${r.top + r.height / 2 - sr.top}px`;

  scaleS.set(k);
  radiusS.set(r.width / 2);
  appEl.classList.add('open');
  appEl.style.visibility = 'visible';
  screenEl.classList.add('app-open');
  iconEl.style.visibility = 'hidden';

  requestAnimationFrame(() => {
    scaleS.to(1);
    radiusS.to(30);
  });
  if (id !== 'music' && openId !== 'music') emit('app-open', id);
  else emit('app-open', id);
  navigator.vibrate?.(8);
}

export function closeApp() {
  if (!openId) return;
  const { iconEl } = state.appOpen ?? {};
  const id = openId;
  openId = null;
  state.appOpen = null;

  if (iconEl) {
    const r = iconEl.getBoundingClientRect();
    const sr = screenEl.getBoundingClientRect();
    appEl.style.transformOrigin = `${r.left + r.width / 2 - sr.left}px ${r.top + r.height / 2 - sr.top}px`;
    scaleS.to(r.width / sr.width);
    radiusS.to(r.width / 2);
  }
  screenEl.classList.remove('app-open');
  emit('app-close', id);
  visualUnsub?.();
  visualUnsub = null;

  scaleS.onRest = () => {
    appEl.classList.remove('open');
    appEl.style.visibility = 'hidden';
    contentEl.innerHTML = '';
    if (iconEl) iconEl.style.visibility = 'visible';
    scaleS.onRest = null;
  };
}

/* ───────── 应用内容 ───────── */

const BUILDERS = {
  music(el) {
    el.appendChild(div('app music-app'));
    const root = el.firstChild;
    root.innerHTML = `
      <div class="m-art"><div class="m-disc"></div></div>
      <div class="m-side">
        <div class="m-meta">
          <div class="t">Liquid Dreams</div>
          <div class="a">Aurora Engine · 液态玻璃</div>
        </div>
        <div class="m-progress"><div class="m-bar" id="m-bar"></div></div>
        <div class="m-viz" id="m-viz"></div>
        <div class="m-ctrl">
          <span class="m-btn" id="m-prev">${glyphs.back}</span>
          <span class="m-btn big glass" id="m-play">${glyphs.play}</span>
          <span class="m-btn" id="m-next">${glyphs.fwd}</span>
        </div>
      </div>`;
    glassify(root.querySelector('#m-play'), { blur: 14 });

    const viz = root.querySelector('#m-viz');
    const bars = [];
    const springs = [];
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('span');
      viz.appendChild(b);
      bars.push(b);
      const s = new Spring(0.1, { stiffness: 240, damping: 15 });
      s.onUpdate = (v) => (b.style.transform = `scaleY(${Math.max(0.06, v).toFixed(3)})`);
      springs.push(s);
    }
    let phase = 0;
    visualUnsub = ticker.add((dt, t) => {
      phase += dt;
      const spec = spectrum(22);
      for (let i = 0; i < 22; i++) {
        const target = isPlaying()
          ? Math.max(0.08, spec[i] * 1.15)
          : 0.12 + Math.sin(t * 1.8 + i * 0.55) * 0.09;
        springs[i].to(target);
      }
    });

    const playBtn = root.querySelector('#m-play');
    playBtn._set = (p) => (playBtn.innerHTML = p ? glyphs.pause : glyphs.play);
    playBtn._set(isPlaying());
    pressable(playBtn, {
      scale: 0.88,
      onTap: () => playBtn._set(togglePlay()),
    });
    pressable(root.querySelector('#m-prev'), { scale: 0.8, onTap: () => toast('上一首（演示）') });
    pressable(root.querySelector('#m-next'), { scale: 0.8, onTap: () => toast('下一首（演示）') });
  },

  weather(el) {
    el.appendChild(div('app weather-app'));
    const root = el.firstChild;
    const hours = ['现在', '14时', '15时', '16时', '17时', '18时', '19时', '20时']
      .map((h, i) => `<div class="wx-h"><span>${h}</span><span class="g">${glyphs.weather}</span><span>${22 - i}°</span></div>`)
      .join('');
    const days = ['今天', '明天', '周六', '周日', '周一']
      .map((d, i) => `<div class="wx-d"><span>${d}</span><span class="g">${glyphs.weather}</span><span>${26 - i}° / ${19 - i}°</span></div>`)
      .join('');
    root.innerHTML = `
      <div class="wx-main">
        <div class="wx-city">上海</div>
        <div class="wx-temp">22°</div>
        <div class="wx-desc">多云 · 体感 21°</div>
        <div class="wx-range">最高 26° · 最低 19°</div>
      </div>
      <div class="wx-cards">
        <div class="glass wx-card">${hours}</div>
        <div class="glass wx-card wx-days">${days}</div>
        <div class="glass wx-card wx-note">
          <span class="g">${glyphs.moon}</span> 夜间晴朗，微风 2 级。划动屏幕，看玻璃后面的流体慢慢晕开。
        </div>
      </div>`;
    el.querySelectorAll('.wx-card').forEach((c) => glassify(c, { blur: 16, tint: 'rgba(20,40,90,0.28)' }));
  },

  clock(el) {
    el.appendChild(div('app clock-app'));
    const root = el.firstChild;
    root.innerHTML = `
      <div class="ck-face">
        <span class="ck-h" id="ck-h"></span>
        <span class="ck-m" id="ck-m"></span>
        <span class="ck-s" id="ck-s"></span>
        <span class="ck-pin"></span>
      </div>
      <div class="ck-side">
        <div class="ck-digital" id="ck-d">--:--:--</div>
        <div class="ck-zone">Asia / Shanghai · 液态时区</div>
      </div>`;
    const H = root.querySelector('#ck-h');
    const M = root.querySelector('#ck-m');
    const S = root.querySelector('#ck-s');
    const D = root.querySelector('#ck-d');
    visualUnsub = ticker.add((dt, t) => {
      const d = new Date();
      const ms = d.getMilliseconds() / 1000;
      const sec = d.getSeconds() + ms;
      const min = d.getMinutes() + sec / 60;
      const hr = (d.getHours() % 12) + min / 60;
      S.style.transform = `rotate(${sec * 6}deg)`;
      M.style.transform = `rotate(${min * 6}deg)`;
      H.style.transform = `rotate(${hr * 30}deg)`;
      D.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0')).join(':');
    });
  },

  calculator(el) {
    el.appendChild(div('app calc-app'));
    const root = el.firstChild;
    root.innerHTML = `
      <div class="calc-screen" id="calc-screen">0</div>
      <div class="calc-grid" id="calc-grid"></div>`;
    glassify(root.querySelector('.calc-screen'), { blur: 12 });
    const keys = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
    const grid = root.querySelector('#calc-grid');
    const screen = root.querySelector('#calc-screen');
    let cur = '0', prev = null, op = null, fresh = true;

    const show = (v) => {
      screen.textContent = String(v).slice(0, 10);
      screen.style.fontSize = String(v).length > 7 ? '44px' : '56px';
    };
    const calc = (a, b, o) =>
      o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b;

    for (const key of keys) {
      const k = document.createElement('button');
      k.className = `calc-key ${'÷×−+'.includes(key) ? 'op' : key === '=' ? 'eq' : 'num'}`;
      k.textContent = key;
      if (key === '0') k.classList.add('zero');
      pressable(k, { scale: 0.9, spring: { stiffness: 500, damping: 28 } });
      k.addEventListener('pointerdown', (e) => e.stopPropagation());
      k.addEventListener('click', () => {
        if (/[0-9]/.test(key)) {
          cur = fresh || cur === '0' ? key : cur + key;
          fresh = false;
        } else if (key === '.') {
          if (fresh) { cur = '0.'; fresh = false; }
          else if (!cur.includes('.')) cur += '.';
        } else if (key === 'AC') { cur = '0'; prev = null; op = null; fresh = true; }
        else if (key === '±') cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur;
        else if (key === '%') cur = String(parseFloat(cur) / 100);
        else if (key === '=') {
          if (op && prev !== null) {
            const r = calc(prev, parseFloat(cur), op);
            cur = Number.isFinite(r) ? String(Math.round(r * 1e8) / 1e8) : '错误';
            op = null; prev = null; fresh = true;
          }
        } else { // 运算符
          if (op && prev !== null && !fresh) {
            const r = calc(prev, parseFloat(cur), op);
            prev = Number.isFinite(r) ? r : 0;
            cur = String(Math.round(r * 1e8) / 1e8);
          } else prev = parseFloat(cur);
          op = key; fresh = true;
        }
        show(cur);
      });
      grid.appendChild(k);
    }
    show(cur);
  },

  camera(el) {
    el.appendChild(div('app camera-app'));
    const root = el.firstChild;
    root.innerHTML = `
      <div class="cam-view">
        <div class="cam-frame glass">
          <div class="cam-hint">流体取景器 · 指尖划过屏幕试试</div>
        </div>
      </div>
      <div class="cam-shutter" id="cam-shutter"></div>`;
    glassify(root.querySelector('.cam-frame'), { blur: 20, tint: 'rgba(10,12,30,0.2)', refract: true });
    const shutter = root.querySelector('#cam-shutter');
    pressable(shutter, { scale: 0.88, onTap: () => emit('flash-blink') });
  },

  /* ── 备忘录：双栏 + localStorage 持久化 ── */
  notes(el) {
    el.appendChild(div('app notes-app'));
    const root = el.firstChild;
    root.innerHTML = `
      <div class="nt-side glass">
        <div class="nt-head">
          <span>备忘录</span>
          <button class="nt-add" id="nt-add">${glyphs.x}</button>
        </div>
        <div class="nt-list" id="nt-list"></div>
      </div>
      <div class="nt-editor glass">
        <div class="nt-toolbar">
          <span class="nt-time" id="nt-time"></span>
          <button class="nt-del" id="nt-del">删除</button>
        </div>
        <textarea class="nt-text" id="nt-text" placeholder="写点什么，会自动保存…" spellcheck="false"></textarea>
      </div>`;
    glassify(root.querySelector('.nt-side'), { blur: 18, tint: 'rgba(60,52,14,0.30)' });
    glassify(root.querySelector('.nt-editor'), { blur: 14, tint: 'rgba(255,255,255,0.035)' });

    const KEY = 'lg-notes-v1';
    let notes = [];
    try { notes = JSON.parse(localStorage.getItem(KEY)) || []; } catch { notes = []; }
    if (!notes.length) {
      notes = [
        { id: 1, text: '液态玻璃引擎设计\n\n· 弹簧物理驱动一切\n· 折射 + 高光 + 流体\n· 丝滑跟手', ts: Date.now() - 86400000 },
        { id: 2, text: '今日待办\n\n· 调好阻尼参数\n· 部署上线', ts: Date.now() },
      ];
    }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch {} };
    const listEl = root.querySelector('#nt-list');
    const textEl = root.querySelector('#nt-text');
    const timeEl = root.querySelector('#nt-time');
    let activeId = notes[0]?.id ?? null;
    let saveTimer = 0;

    const fmtTs = (ts) => {
      const d = new Date(ts);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const renderList = () => {
      listEl.innerHTML = '';
      [...notes].sort((a, b) => b.ts - a.ts).forEach((n) => {
        const row = document.createElement('div');
        row.className = `nt-item${n.id === activeId ? ' on' : ''}`;
        const firstLine = (n.text.split('\n')[0] || '新备忘录').slice(0, 18) || '新备忘录';
        const preview = (n.text.split('\n').slice(1).join(' ').trim() || '无附加文字').slice(0, 24);
        row.innerHTML = `<div class="nt-item-t">${escapeHtml(firstLine)}</div>
          <div class="nt-item-s"><span>${fmtTs(n.ts)}</span><span>${escapeHtml(preview)}</span></div>`;
        pressable(row, { scale: 0.98, flash: false, onTap: () => select(n.id) });
        listEl.appendChild(row);
      });
    };
    const select = (id) => {
      activeId = id;
      const n = notes.find((x) => x.id === id);
      textEl.value = n ? n.text : '';
      timeEl.textContent = n ? `编辑于 ${fmtTs(n.ts)}` : '';
      renderList();
    };
    textEl.addEventListener('input', () => {
      const n = notes.find((x) => x.id === activeId);
      if (!n) return;
      n.text = textEl.value;
      n.ts = Date.now();
      timeEl.textContent = `编辑于 ${fmtTs(n.ts)}`;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (!textEl.isConnected) return;
        save();
        renderList();
      }, 500);
    });
    root.querySelector('#nt-add').addEventListener('click', () => {
      const id = Date.now();
      notes.push({ id, text: '', ts: Date.now() });
      save();
      select(id);
      textEl.focus();
    });
    root.querySelector('#nt-del').addEventListener('click', () => {
      if (activeId == null) return;
      notes = notes.filter((x) => x.id !== activeId);
      save();
      select(notes[0]?.id ?? null);
      if (!notes.length) { textEl.value = ''; timeEl.textContent = '没有备忘录'; renderList(); }
      toast('已删除');
    });
    if (notes.length) select(activeId ?? notes[0].id);
    else timeEl.textContent = '点击 + 新建';
    renderList();
  },

  /* ── 照片：生成艺术网格 + 弹簧放大查看 ── */
  photos(el) {
    el.appendChild(div('app photos-app'));
    const root = el.firstChild;
    const N = 24;
    const art = (i) => {
      const h = (i * 47 + 12) % 360;
      return `radial-gradient(120% 120% at 18% 12%, hsl(${h} 92% 74%), transparent 58%),
        radial-gradient(130% 130% at 84% 82%, hsl(${(h + 95) % 360} 88% 56%), transparent 56%),
        linear-gradient(${(h + 40) % 360}deg, hsl(${(h + 190) % 360} 78% 44%), hsl(${(h + 60) % 360} 92% 62%))`;
    };
    const names = ['极光', '深空', '熔岩', '苔原', '暮色', '海雾', '霓虹', '晨曦', '琉璃', '曜石', '花火', '冰川',
      '薄荷', '落日', '紫罗兰', '琥珀', '青柠', '胭脂', '靛蓝', '珊瑚', '鎏金', '霜降', '暖砂', '夜潮'];
    root.innerHTML = `
      <div class="ph-head">
        <div class="ph-title">回忆</div>
        <div class="ph-sub">${N} 张 · 液态生成艺术</div>
      </div>
      <div class="ph-grid"></div>
      <div class="ph-viewer" id="ph-viewer">
        <div class="ph-big" id="ph-big"></div>
        <div class="ph-cap"><span id="ph-name"></span><span id="ph-idx"></span></div>
        <button class="ph-nav glass" id="ph-prev">${glyphs.back}</button>
        <button class="ph-nav glass" id="ph-next">${glyphs.fwd}</button>
        <button class="ph-close glass" id="ph-close">${glyphs.x}</button>
      </div>`;
    const grid = root.querySelector('.ph-grid');
    const viewer = root.querySelector('#ph-viewer');
    const big = root.querySelector('#ph-big');
    let cur = 0;

    const show = (i) => {
      cur = (i + N) % N;
      big.style.background = art(cur);
      root.querySelector('#ph-name').textContent = names[cur];
      root.querySelector('#ph-idx').textContent = `${cur + 1} / ${N}`;
      big.animate([{ opacity: 0.35, transform: 'scale(0.985)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    };
    for (let i = 0; i < N; i++) {
      const tile = document.createElement('div');
      tile.className = 'ph-tile';
      tile.style.background = art(i);
      pressable(tile, { scale: 0.93, onTap: () => openViewer(i) });
      grid.appendChild(tile);
    }
    const openViewer = (i) => {
      show(i);
      viewer.classList.add('show');
      viewer.animate(
        [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 380, easing: 'cubic-bezier(0.22, 1.2, 0.36, 1)' }
      );
    };
    const closeViewer = () => {
      viewer.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.92)' }],
        { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
      ).onfinish = () => viewer.classList.remove('show');
    };
    pressable(root.querySelector('#ph-close'), { scale: 0.85, onTap: closeViewer });
    pressable(root.querySelector('#ph-prev'), { scale: 0.85, onTap: () => show(cur - 1) });
    pressable(root.querySelector('#ph-next'), { scale: 0.85, onTap: () => show(cur + 1) });
    const nav = (dir) => {
      if (viewer.classList.contains('show')) show(cur + dir);
      else closeViewer();
    };
    gestures(viewer, { capture: false, onPanEnd: (c) => {
      if (Math.abs(c.vx) > Math.abs(c.vy) && Math.abs(c.vx) > 260) nav(c.vx > 0 ? -1 : 1);
    } });
  },

  /* ── 设置：开关 / 滑杆全部实时生效 ── */
  settings: settingApp,
};

function settingApp(el) {
  el.appendChild(div('app settings-app'));
  const root = el.firstChild;
  root.innerHTML = `
    <div class="st-wrap">
      <div class="st-title">设置</div>
      <div class="st-group glass">
        ${row('st-row-fluid', glyphs.sun, '流体壁纸', 'sw', true)}
        ${row('st-row-refract', glyphs.weather, '玻璃折射', 'sw', true)}
      </div>
      <div class="st-group glass">
        <div class="st-row"><div class="st-ic">${glyphs.settings}</div><div class="st-body">
          <div class="st-label">玻璃模糊强度</div>
          <div class="st-slider" id="st-blur"><div class="st-fill"></div></div>
        </div><span class="st-val" id="st-blur-v"></span></div>
        <div class="st-row"><div class="st-ic">${glyphs.sun}</div><div class="st-body">
          <div class="st-label">屏幕亮度</div>
          <div class="st-slider" id="st-bright"><div class="st-fill"></div></div>
        </div><span class="st-val" id="st-bright-v"></span></div>
      </div>
      <div class="st-group glass">
        <div class="st-row"><div class="st-ic">${glyphs.appstore}</div><div class="st-body">
          <div class="st-label">引擎</div><div class="st-sub">Liquid Glass Engine v1.0</div></div></div>
        <div class="st-row"><div class="st-ic">${glyphs.photos}</div><div class="st-body">
          <div class="st-label">渲染</div><div class="st-sub">WebGL2 流体 + 弹簧物理 + 折射滤镜</div></div></div>
      </div>
    </div>`;
  el.querySelectorAll('.st-group').forEach((g) =>
    glassify(g, { blur: 14, tint: 'rgba(255,255,255,0.045)' })
  );

  function row(id, icon, label, kind, on) {
    return `<div class="st-row" id="${id}"><div class="st-ic">${icon}</div>
      <div class="st-body"><div class="st-label">${label}</div></div>
      ${kind === 'sw' ? `<button class="st-switch${on ? ' on' : ''}"><span class="st-knob"></span></button>` : ''}</div>`;
  }

  // 开关
  const fluidRow = root.querySelector('#st-row-fluid .st-switch');
  const refractRow = root.querySelector('#st-row-refract .st-switch');
  fluidRow.classList.toggle('on', settings.fluid);
  refractRow.classList.toggle('on', settings.refract);
  pressable(fluidRow, { scale: 0.94, flash: false, onTap: () => {
    const on = !settings.fluid;
    setSetting('fluid', on);
    fluidRow.classList.toggle('on', on);
    toast(on ? '流体壁纸 已开启' : '已切换为静态壁纸');
  } });
  pressable(refractRow, { scale: 0.94, flash: false, onTap: () => {
    const on = !settings.refract;
    setSetting('refract', on);
    refractRow.classList.toggle('on', on);
    toast(on ? '玻璃折射 已开启' : '玻璃折射 已关闭');
  } });

  // 滑杆（水平）
  const hSlider = (id, value, fmt, onLive) => {
    const elS = root.querySelector(id);
    const fill = elS.querySelector('.st-fill');
    const apply = (v) => {
      fill.style.width = `${(v * 100).toFixed(1)}%`;
      elS.style.setProperty('--x', `${(v * 100).toFixed(1)}%`);
    };
    apply(value);
    const setFrom = (ev) => {
      const r = elS.getBoundingClientRect();
      const v = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      apply(v);
      onLive(v);
      return v;
    };
    elS.addEventListener('pointerdown', (e) => {
      elS.setPointerCapture(e.pointerId);
      setFrom(e);
      const move = (ev) => setFrom(ev);
      const up = () => {
        elS.removeEventListener('pointermove', move);
        elS.removeEventListener('pointerup', up);
        elS.removeEventListener('pointercancel', up);
      };
      elS.addEventListener('pointermove', move);
      elS.addEventListener('pointerup', up);
      elS.addEventListener('pointercancel', up);
      e.stopPropagation();
    });
  };
  const blurEl = root.querySelector('#st-blur-v');
  hSlider('#st-blur', (settings.blur - 0.4) / 1.4, null, (v) => {
    const s = 0.4 + v * 1.4;
    blurEl.textContent = `${Math.round(s * 100)}%`;
    setSetting('blur', s);
  });
  blurEl.textContent = `${Math.round(settings.blur * 100)}%`;

  const brightEl = root.querySelector('#st-bright-v');
  hSlider('#st-bright', settings.bright, null, (v) => {
    brightEl.textContent = `${Math.round(v * 100)}%`;
    setSetting('bright', v);
  });
  brightEl.textContent = `${Math.round(settings.bright * 100)}%`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function genericApp(el, id) {
  el.appendChild(div('app generic-app'));
  const root = el.firstChild;
  const app = apps[id];
  root.innerHTML = `
    <div class="g-icon" style="--bg:${app?.bg}">${glyphs[id] ?? glyphs.appstore}</div>
    <div class="g-name">${app?.name ?? id}</div>
    <div class="g-sub">这个应用还在液态中酝酿…</div>`;
}

function div(cls) {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}
