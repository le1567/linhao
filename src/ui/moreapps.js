/**
 * 内置应用补全 —— Safari / 电话 / 信息 / 邮件 / 地图 / 日历 / 健康 / 钱包 / App Store
 * 全部可交互，使用同一套液态玻璃材质与弹簧手感。
 */
import { pressable as bindPressable } from '../engine/glass.js';
import { tween } from '../engine/tween.js';
import { glyphs } from './icons.js';
import { toast } from './toast.js';

let disposers = [];
const every = (ms, fn) => { const id = setInterval(fn, ms); disposers.push(() => clearInterval(id)); return id; };
const after = (ms, fn) => { const id = setTimeout(fn, ms); disposers.push(() => clearTimeout(id)); return id; };
export function cleanupExtraApps() {
  for (const d of disposers) { try { d(); } catch (_) {} }
  disposers = [];
}

/** 带自动清理的 pressable，避免重复打开应用后累积 window 监听 */
const pressable = (el, opts) => {
  const h = bindPressable(el, opts);
  disposers.push(h.destroy);
  return h;
};

const make = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const shell = (el, cls) => {
  const root = make('div', cls);
  el.appendChild(root);
  return root;
};
const svg = (d, attrs = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${d}</svg>`;

/* ============================= Safari ============================= */

const SAFARI = {
  engine: {
    kicker: '工程手记',
    title: '液态玻璃，为什么看起来会流动？',
    meta: 'Liquid Glass Engine · 3 分钟阅读',
    domain: 'glass.lab/engine',
    accent: '#7c5cff',
    body: `
      <p>这块玻璃不是一张贴图。它由四层结构叠加而成：<b>背景模糊</b>、<b>饱和提亮</b>、<b>渐变描边</b>与<b>镜面光斑</b>。光斑的位置跟随你的指尖，于是玻璃表面像被持续擦拭。</p>
      <h3>弹簧驱动的界面</h3>
      <p>所有位移都由半隐式欧拉积分的弹簧系统计算。它不会在到达目标时戛然而止，而是带着一点点余韵，这正是 iOS 手感的核心。</p>
      <div class="sf-quote">“动效不是装饰，而是让界面解释自己的方式。”</div>
      <h3>与流体共存</h3>
      <p>壁纸下方是一块 WebGL2 流场。指尖划过的轨迹会成为染料注入速度场，涡旋随时间自然扩散。界面越通透，流体越像真实存在。</p>`,
  },
  fluid: {
    kicker: '实验场',
    title: '把手指放进流体里',
    meta: 'WebGL2 · Stable Fluids',
    domain: 'glass.lab/fluid',
    accent: '#2fd0ff',
    body: `
      <p>流场用 256×256 的浮点纹理演化：注入 → 涡量 → 散度 → 压力 → 平流。每一步都在 GPU 上完成，界面只负责把结果铺在壁纸下面。</p>
      <h3>为什么要点 40 帧</h3>
      <p>高刷新率会让压力迭代的误差被放大，画面出现轻微闪烁。引擎把流体步进限制在 40fps，把省下来的算力留给玻璃层的高斯模糊。</p>
      <h3>折射的代价</h3>
      <p>SVG 位移滤镜虽然好看，但和 backdrop-filter 叠加时会让合成器反复重算图层。默认关闭，只在你需要时打开——稳定比炫技更重要。</p>`,
  },
  design: {
    kicker: '设计语言',
    title: '克制的高光',
    meta: 'Design Notes · 2 分钟阅读',
    domain: 'glass.lab/design',
    accent: '#ff5f8f',
    body: `
      <p>高光只出现在两处：边缘的 1.2px 描边，和左上角一团柔和的光。其余部分保持低对比，让内容成为主角。</p>
      <h3>圆角是连续的</h3>
      <p>28px 圆角的卡片、26px 的面板、21px 的图标，比例来自同一套 4px 栅格。它们相邻时不会互相抢视线。</p>
      <div class="sf-quote">通透不是把东西变亮，而是让背后的颜色愿意透出来。</div>
      <h3>动效的节奏</h3>
      <p>打开应用 300ms，翻页跟手，按下缩放 0.86。所有数值都写在引擎里，可以被调参，也可以被替换。</p>`,
  },
  about: {
    kicker: '关于',
    title: 'Liquid Pad',
    meta: '一台跑在浏览器里的平板',
    domain: 'glass.lab/about',
    accent: '#5cffb2',
    body: `
      <p>这不是对某个系统的复刻，而是一次材质实验：如果界面本身是液体，它会怎么回应触摸？</p>
      <h3>技术清单</h3>
      <p>纯 ES Modules，无构建步骤；自研 ticker / spring / gesture / tween；WebGL2 流体；CSS backdrop-filter 玻璃；SVG 位移滤镜（可选）。</p>
      <h3>你可以做什么</h3>
      <p>锁屏上滑解锁、在主屏翻页、长按图标抖动、下拉控制中心、打开任意一个应用——它们都能真正使用。</p>`,
  },
};

function safariApp(el) {
  const root = shell(el, 'app sf-app');
  root.innerHTML = `
    <div class="sf-topbar glass">
      <button class="sf-ic" id="sf-back" aria-label="返回">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
      <div class="sf-url" id="sf-url"><span class="sf-lock">${svg('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 'stroke-width="1.6"')}</span><span id="sf-url-t">液态引擎 · 开始页</span></div>
      <button class="sf-ic" id="sf-reload" aria-label="刷新">${svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>')}</button>
      <div class="sf-tabs">2</div>
    </div>
    <div class="sf-viewport">
      <div class="sf-progress" id="sf-prog"></div>
      <div class="sf-start" id="sf-start">
        <div class="sf-kicker">开始页</div>
        <div class="sf-wordmark">Liquid<span>Glass</span></div>
        <div class="sf-tagline">为触控而生的流体浏览器</div>
        <div class="sf-favs">
          <button class="sf-fav" data-page="engine"><span class="sf-fav-ic" style="--c:#7c5cff">${glyphs.settings}</span><span>液态引擎</span></button>
          <button class="sf-fav" data-page="fluid"><span class="sf-fav-ic" style="--c:#2fd0ff">${glyphs.weather}</span><span>流体实验</span></button>
          <button class="sf-fav" data-page="design"><span class="sf-fav-ic" style="--c:#ff5f8f">${glyphs.photos}</span><span>设计手记</span></button>
          <button class="sf-fav" data-page="about"><span class="sf-fav-ic" style="--c:#5cffb2">${glyphs.appstore}</span><span>关于</span></button>
        </div>
        <div class="sf-read glass">
          <div class="sf-read-h">阅读列表</div>
          <div class="sf-read-item" data-page="engine"><span class="sf-read-dot" style="--c:#7c5cff"></span><div><b>液态玻璃，为什么看起来会流动？</b><i>3 分钟阅读</i></div></div>
          <div class="sf-read-item" data-page="design"><span class="sf-read-dot" style="--c:#ff5f8f"></span><div><b>克制的高光：这套设计语言的取舍</b><i>2 分钟阅读</i></div></div>
        </div>
      </div>
      <div class="sf-article" id="sf-art"></div>
    </div>`;

  const start = root.querySelector('#sf-start');
  const art = root.querySelector('#sf-art');
  const urlT = root.querySelector('#sf-url-t');
  const back = root.querySelector('#sf-back');
  const prog = root.querySelector('#sf-prog');
  let current = null;

  const home = () => {
    current = null;
    start.classList.remove('hide');
    art.classList.remove('show');
    art.innerHTML = '';
    urlT.textContent = '液态引擎 · 开始页';
    back.classList.remove('on');
  };

  const load = (key) => {
    const p = SAFARI[key];
    if (!p) return;
    current = key;
    start.classList.add('hide');
    art.classList.add('show');
    art.style.setProperty('--accent', p.accent);
    art.innerHTML = `
      <div class="sf-kicker">${p.kicker}</div>
      <h1 class="sf-h1">${p.title}</h1>
      <div class="sf-meta">${p.meta}</div>
      <div class="sf-body">${p.body}</div>
      <div class="sf-end">— 阅读完毕 · Liquid Glass —</div>`;
    urlT.textContent = p.domain;
    back.classList.add('on');
    prog.style.opacity = '1';
    prog.style.width = '0%';
    tween({
      from: 0, to: 1, duration: 0.55,
      onUpdate: (v) => { prog.style.width = `${(v * 100).toFixed(1)}%`; },
      onComplete: () => { prog.style.opacity = '0'; },
    });
    navigator.vibrate?.(5);
  };

  root.querySelectorAll('[data-page]').forEach((b) => {
    pressable(b, { scale: 0.94, flash: false, onTap: () => load(b.dataset.page) });
  });
  pressable(back, { scale: 0.9, flash: false, onTap: () => (current ? home() : toast('已经在开始页')) });
  pressable(root.querySelector('#sf-reload'), { scale: 0.9, flash: false, onTap: () => {
    if (current) load(current); else toast('开始页已刷新');
  } });
}

/* ============================= 电话 ============================= */

const PAD = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

function phoneApp(el) {
  const root = shell(el, 'app phone-app');
  root.innerHTML = `
    <div class="phone-body">
      <div class="phone-display">
        <div class="phone-num" id="phone-num">输入号码</div>
        <button class="phone-del" id="phone-del" aria-label="退格">${svg('<path d="M20 5H9L3 12l6 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="M17 9l-5 6M12 9l5 6" stroke-width="1.6"/>')}</button>
      </div>
      <div class="phone-pad" id="phone-pad">
        ${PAD.map(([k, s]) => `<button class="phone-key" data-k="${k}"><span>${k}</span>${s ? `<i>${s}</i>` : ''}</button>`).join('')}
      </div>
      <div class="phone-actions">
        <button class="phone-call" id="phone-call" aria-label="呼叫">${svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>', 'fill="currentColor" stroke="none"')}</button>
      </div>
    </div>
    <div class="phone-overlay" id="phone-overlay">
      <div class="phone-ava" id="phone-ava">林</div>
      <div class="phone-call-name" id="phone-call-name">林浩</div>
      <div class="phone-call-state" id="phone-call-state">正在呼叫…</div>
      <div class="phone-call-grid">
        <button class="phone-cbtn" id="phone-mute"><span>${svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>')}</span>静音</button>
        <button class="phone-cbtn" id="phone-speaker"><span>${svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}</span>免提</button>
        <button class="phone-cbtn" id="phone-keypad"><span>${svg('<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01"/>', 'stroke-width="1.6"')}</span>键盘</button>
        <button class="phone-cbtn end" id="phone-end"><span>${svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>', 'fill="currentColor" stroke="none"')}</span>挂断</button>
      </div>
    </div>`;

  const numEl = root.querySelector('#phone-num');
  const pad = root.querySelector('#phone-pad');
  const overlay = root.querySelector('#phone-overlay');
  let num = '';
  let calling = false;
  let seconds = 0;
  let callTimer = 0;
  let muted = false, speaker = false;

  const paint = () => { numEl.textContent = num || '输入号码'; numEl.classList.toggle('empty', !num); };
  const press = (k) => {
    if (num.length >= 15) return;
    num += k;
    paint();
    navigator.vibrate?.(6);
    if (k !== '*' && k !== '#') {
      numEl.animate([{ transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
        { duration: 220, easing: 'cubic-bezier(.2,1.4,.4,1)' });
    }
  };

  root.querySelectorAll('.phone-key').forEach((b) => {
    pressable(b, { scale: 0.86, spring: { stiffness: 480, damping: 26 }, onTap: () => press(b.dataset.k) });
  });
  pressable(root.querySelector('#phone-del'), { scale: 0.85, flash: false, onTap: () => {
    if (calling) return;
    num = num.slice(0, -1); paint();
  } });
  pressable(root.querySelector('#phone-call'), { scale: 0.88, onTap: startCall });

  function startCall() {
    if (calling) return;
    calling = true;
    seconds = 0;
    const who = num || '林浩';
    root.querySelector('#phone-call-name').textContent = who;
    root.querySelector('#phone-ava').textContent = num ? '☎' : '林';
    root.querySelector('#phone-call-state').textContent = '正在呼叫…';
    overlay.classList.add('show');
    muted = speaker = false;
    root.querySelectorAll('.phone-cbtn').forEach((b) => b.classList.remove('on'));
    after(1100, () => {
      if (!calling) return;
      root.querySelector('#phone-call-state').textContent = '通话中 00:00';
      callTimer = every(1000, () => {
        seconds++;
        const s = String(seconds % 60).padStart(2, '0');
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        root.querySelector('#phone-call-state').textContent = `通话中 ${m}:${s}`;
      });
    });
    navigator.vibrate?.(12);
  }

  const end = () => {
    calling = false;
    clearInterval(callTimer);
    overlay.classList.remove('show');
    root.querySelector('#phone-call-state').textContent = '正在呼叫…';
  };

  pressable(root.querySelector('#phone-end'), { scale: 0.85, onTap: end });
  pressable(root.querySelector('#phone-mute'), { scale: 0.9, flash: false, onTap: (e) => {
    muted = !muted;
    root.querySelector('#phone-mute').classList.toggle('on', muted);
    toast(muted ? '已静音' : '取消静音');
  } });
  pressable(root.querySelector('#phone-speaker'), { scale: 0.9, flash: false, onTap: () => {
    speaker = !speaker;
    root.querySelector('#phone-speaker').classList.toggle('on', speaker);
    toast(speaker ? '免提已开启' : '免提已关闭');
  } });
  pressable(root.querySelector('#phone-keypad'), { scale: 0.9, flash: false, onTap: () => toast('通话中键盘 · 演示') });
  paint();
}

/* ============================= 信息 ============================= */

const MSG_SEED = [
  {
    id: 'lin', name: '林浩', initial: '林', status: '在线',
    color: 'linear-gradient(135deg,#7c5cff,#2fd0ff)',
    msgs: [
      { me: false, t: '新做的液态玻璃主页上线了，你看到了吗？', ts: '10:24' },
      { me: true, t: '看到了，翻页的手感很顺，跟手。', ts: '10:25' },
      { me: false, t: '流体在玻璃后面晕开的那一下，是我最喜欢的。', ts: '10:26' },
      { me: true, t: '指尖划过的时候其实有涟漪，只是很轻。', ts: '10:27' },
    ],
  },
  {
    id: 'team', name: '设计小组', initial: '设', status: '4 人',
    color: 'linear-gradient(135deg,#ff5f8f,#ffb36b)',
    msgs: [
      { me: false, t: '高光再收一点，边缘会显得更贵。', ts: '09:12' },
      { me: true, t: '同意，1.2px 描边已经够亮了。', ts: '09:14' },
      { me: false, t: '下午四点过一遍动效节奏？', ts: '09:15' },
    ],
  },
  {
    id: 'mom', name: '妈妈', initial: '妈', status: '家人',
    color: 'linear-gradient(135deg,#5cffb2,#2fd0ff)',
    msgs: [
      { me: false, t: '今天降温了，记得穿外套。', ts: '08:02' },
      { me: true, t: '穿啦，晚上回去吃饭。', ts: '08:20' },
    ],
  },
];

const REPLIES = [
  '这个效果真的有液体的感觉。',
  '我刚在平板上试了，长按图标会抖，细节到位。',
  '流体那层如果再慢一点点会更像真实的水。',
  '收到，我把参数再调一版。',
  '哇，玻璃边缘的高光像真的被擦过一样。',
];

function messagesApp(el) {
  const root = shell(el, 'app msg-app');
  let threads;
  try { threads = JSON.parse(localStorage.getItem('lg-msg-v2')) || MSG_SEED; } catch { threads = MSG_SEED; }
  if (!Array.isArray(threads) || !threads.length) threads = MSG_SEED;
  const save = () => { try { localStorage.setItem('lg-msg-v2', JSON.stringify(threads)); } catch (_) {} };

  let active = threads[0].id;
  let replyIdx = 0;
  let replyTimer = 0;

  root.innerHTML = `
    <aside class="msg-list glass">
      <div class="msg-head"><span>信息</span><i>${threads.length}</i></div>
      <div id="msg-contacts"></div>
    </aside>
    <section class="msg-chat glass">
      <header class="msg-chat-head">
        <button class="msg-back" id="msg-back">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
        <div class="msg-ava" id="msg-ava">林</div>
        <div class="msg-who"><b id="msg-name">林浩</b><span id="msg-status">在线</span></div>
        <button class="msg-info" id="msg-info">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>', 'stroke-width="1.7"')}</button>
      </header>
      <div class="msg-thread" id="msg-thread"></div>
      <div class="msg-input">
        <button class="msg-plus" id="msg-plus">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
        <input id="msg-field" type="text" placeholder="iMessage" autocomplete="off" spellcheck="false">
        <button class="msg-send" id="msg-send">${svg('<path d="M12 19V5M5 12l7-7 7 7"/>')}</button>
      </div>
    </section>`;

  const listEl = root.querySelector('#msg-contacts');
  const threadEl = root.querySelector('#msg-thread');
  const field = root.querySelector('#msg-field');
  const back = root.querySelector('#msg-back');

  function lastOf(t) { return t.msgs[t.msgs.length - 1]; }

  function renderList() {
    listEl.innerHTML = '';
    [...threads].sort((a, b) => (lastOf(b)?.ts || '').localeCompare(lastOf(a)?.ts || '')).forEach((t) => {
      const row = make('button', `msg-row${t.id === active ? ' on' : ''}`);
      const last = lastOf(t);
      row.innerHTML = `
        <span class="msg-ava" style="background:${t.color}">${t.initial}</span>
        <span class="msg-row-body">
          <b>${t.name}</b>
          <i>${last ? (last.me ? '你：' : '') + last.t : '开始聊天'}</i>
        </span>
        <span class="msg-time">${last?.ts || ''}</span>`;
      pressable(row, { scale: 0.97, flash: false, onTap: () => select(t.id) });
      listEl.appendChild(row);
    });
  }

  function renderThread() {
    const t = threads.find((x) => x.id === active) || threads[0];
    active = t.id;
    root.querySelector('#msg-ava').textContent = t.initial;
    root.querySelector('#msg-ava').style.background = t.color;
    root.querySelector('#msg-name').textContent = t.name;
    root.querySelector('#msg-status').textContent = t.status;
    threadEl.innerHTML = `<div class="msg-day">今天 ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</div>`;
    t.msgs.forEach((m, i) => {
      const b = make('div', `msg-bubble ${m.me ? 'me' : ''}`);
      b.innerHTML = `${m.t}<span>${m.ts}</span>`;
      b.style.setProperty('--i', String(i));
      threadEl.appendChild(b);
    });
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function select(id) {
    active = id;
    root.classList.add('chatting');
    renderList();
    renderThread();
    field.value = '';
  }

  function send() {
    const text = field.value.trim();
    if (!text) return;
    const t = threads.find((x) => x.id === active);
    const now = new Date();
    t.msgs.push({ me: true, t: text, ts: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` });
    field.value = '';
    save();
    renderThread();
    renderList();
    if (t.id === 'lin' || t.id === 'team') {
      const typing = make('div', 'msg-bubble typing');
      typing.innerHTML = '<span></span><span></span><span></span>';
      threadEl.appendChild(typing);
      threadEl.scrollTop = threadEl.scrollHeight;
      clearTimeout(replyTimer);
      replyTimer = setTimeout(() => {
        typing.remove();
        if (!threadEl.isConnected) return;
        const r = REPLIES[replyIdx++ % REPLIES.length];
        t.msgs.push({ me: false, t: r, ts: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` });
        save();
        renderThread();
        renderList();
      }, 1500);
      disposers.push(() => clearTimeout(replyTimer));
    }
  }

  pressable(root.querySelector('#msg-send'), { scale: 0.88, onTap: send });
  pressable(root.querySelector('#msg-plus'), { scale: 0.88, flash: false, onTap: () => toast('附件 · 演示') });
  pressable(root.querySelector('#msg-info'), { scale: 0.9, flash: false, onTap: () => toast('会话详情 · 演示') });
  pressable(back, { scale: 0.9, flash: false, onTap: () => root.classList.remove('chatting') });
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  field.addEventListener('pointerdown', (e) => e.stopPropagation());

  renderList();
  renderThread();
  if (window.matchMedia('(max-width: 699px)').matches) root.classList.remove('chatting');
}

/* ============================= 邮件 ============================= */

const MAILS = [
  { from: 'Liquid Weekly', initial: 'L', color: 'linear-gradient(135deg,#7c5cff,#2fd0ff)', subject: '第 42 期：界面正在变成液体', preview: '当背景模糊、折射和弹簧物理相遇，界面开始有了体积感…', time: '10:12', unread: true, body: '这期我们聊三件事：\n\n1. 玻璃材质的分层做法——模糊、提亮、描边、光斑，每一层只做一件事。\n2. 为什么弹簧比贝塞尔曲线更像真实世界。\n3. 流体壁纸的性能边界：40fps 下的稳定优先。\n\n完整的参数表在附件里。' },
  { from: '林浩', initial: '林', color: 'linear-gradient(135deg,#5cffb2,#2fd0ff)', subject: 'Re: 翻页手感', preview: '我试了 30% 阈值 + 速度预测，左右双向都顺了。', time: '09:41', unread: true, body: '我试了 30% 阈值 + 速度预测，左右双向都顺了。\n\n不过第二页的页宽之前量错了，锁屏缩放把 rect 放大了 1.05 倍，改成 offsetWidth 之后一次就修好了。\n\n今晚可以把 build 发我。' },
  { from: 'App Review', initial: 'A', color: 'linear-gradient(135deg,#ff9f0a,#ff5f8f)', subject: '你的应用已通过审核', preview: 'Liquid Pad 1.0 已在 App Store 上架。', time: '昨天', unread: false, body: '恭喜！Liquid Pad 1.0 已通过审核并上架。\n\n我们特别标注了你的玻璃材质与流体交互，编辑推荐位正在排期。' },
  { from: '设计小组', initial: '设', color: 'linear-gradient(135deg,#ff5f8f,#ffb36b)', subject: '下午四点的动效评审', preview: '会议室 3F · 带上你的弹簧参数表。', time: '昨天', unread: false, body: '下午四点动效评审，会议室 3F。\n\n请带上：\n· 弹簧参数表（stiffness / damping）\n· 打开与关闭的帧率采样\n· 玻璃模糊强度的三档对比' },
  { from: 'Apple Developer', initial: 'D', color: 'linear-gradient(135deg,#3a3d46,#1c1e24)', subject: '开发者协议更新', preview: '新的条款将于下月生效，请查看详情。', time: '周一', unread: false, body: '开发者协议已更新，涉及应用内购买与隐私清单的若干条款。\n\n请在开发者后台查看完整文本。' },
  { from: '摄影周刊', initial: 'P', color: 'linear-gradient(135deg,#42a8ff,#1f6dff)', subject: '光在玻璃上的七种形状', preview: '本期图集：折射、全反射与高光。', time: '周一', unread: false, body: '光穿过玻璃时从来不是直线。\n\n本期收录 24 张以玻璃为介质的照片，附拍摄参数与布光图。' },
];

function mailApp(el) {
  const root = shell(el, 'app mail-app');
  let mails = MAILS.map((m) => ({ ...m }));
  let active = -1;

  root.innerHTML = `
    <header class="mail-head">
      <div><div class="mail-title">邮件</div><div class="mail-sub">收件箱 · <span id="mail-unread">2</span> 封未读</div></div>
      <button class="mail-compose-btn glass" id="mail-compose-btn">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
    </header>
    <div class="mail-list" id="mail-list"></div>
    <div class="mail-reader" id="mail-reader">
      <div class="mail-reader-panel glass">
        <div class="mail-reader-top">
          <button class="mail-back" id="mail-back">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
          <div class="mail-reader-sub" id="mail-reader-sub"></div>
          <button class="mail-tool" id="mail-star">${svg('<path d="M12 3l2.9 6.2 6.6.8-4.9 4.5 1.3 6.5-5.9-3.3-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/>', 'stroke-width="1.6"')}</button>
        </div>
        <div class="mail-reader-head">
          <div class="mail-ava" id="mail-ava">L</div>
          <div><div class="mail-from" id="mail-from"></div><div class="mail-time" id="mail-time"></div></div>
        </div>
        <h2 class="mail-subject" id="mail-subject"></h2>
        <div class="mail-body" id="mail-body"></div>
      </div>
    </div>
    <div class="mail-sheet" id="mail-sheet">
      <div class="mail-sheet-panel glass">
        <div class="mail-sheet-head"><span>新邮件</span><button id="mail-sheet-x">${glyphs.x}</button></div>
        <input class="mail-input" id="mail-to" placeholder="收件人" spellcheck="false">
        <input class="mail-input" id="mail-subj" placeholder="主题" spellcheck="false">
        <textarea class="mail-textarea" id="mail-body-input" placeholder="正文…" spellcheck="false"></textarea>
        <button class="mail-send" id="mail-send">发送</button>
      </div>
    </div>`;

  const listEl = root.querySelector('#mail-list');
  const reader = root.querySelector('#mail-reader');
  const sheet = root.querySelector('#mail-sheet');
  const unreadEl = root.querySelector('#mail-unread');

  function render() {
    listEl.innerHTML = '';
    mails.forEach((m, i) => {
      const row = make('button', `mail-row${m.unread ? ' unread' : ''}`);
      row.innerHTML = `
        <span class="mail-ava" style="background:${m.color};${m.color.includes('gradient') ? '' : `background:${m.color}`}">${m.initial}</span>
        <span class="mail-row-body">
          <span class="mail-row-top"><b>${m.from}</b><i>${m.time}</i></span>
          <span class="mail-row-subject">${m.subject}</span>
          <span class="mail-row-preview">${m.preview}</span>
        </span>
        ${m.unread ? '<span class="mail-dot"></span>' : ''}`;
      pressable(row, { scale: 0.985, flash: false, onTap: () => open_(i) });
      listEl.appendChild(row);
    });
    unreadEl.textContent = String(mails.filter((m) => m.unread).length);
  }

  function open_(i) {
    const m = mails[i];
    active = i;
    m.unread = false;
    render();
    root.querySelector('#mail-ava').textContent = m.initial;
    root.querySelector('#mail-ava').style.background = m.color;
    root.querySelector('#mail-from').textContent = m.from;
    root.querySelector('#mail-time').textContent = m.time;
    root.querySelector('#mail-subject').textContent = m.subject;
    root.querySelector('#mail-body').textContent = m.body;
    root.querySelector('#mail-reader-sub').textContent = '收件箱';
    root.querySelector('#mail-star').classList.remove('on');
    reader.classList.add('show');
  }

  pressable(root.querySelector('#mail-back'), { scale: 0.9, flash: false, onTap: () => reader.classList.remove('show') });
  pressable(root.querySelector('#mail-star'), { scale: 0.9, flash: false, onTap: () => {
    root.querySelector('#mail-star').classList.toggle('on');
    toast('已标记');
  } });
  pressable(root.querySelector('#mail-compose-btn'), { scale: 0.88, onTap: () => {
    sheet.classList.add('show');
    root.querySelector('#mail-to').focus();
  } });
  pressable(root.querySelector('#mail-sheet-x'), { scale: 0.9, flash: false, onTap: () => sheet.classList.remove('show') });
  root.querySelector('#mail-send').addEventListener('click', () => {
    const to = root.querySelector('#mail-to').value.trim() || '未命名收件人';
    const subj = root.querySelector('#mail-subj').value.trim() || '（无主题）';
    const body = root.querySelector('#mail-body-input').value.trim() || '（无正文）';
    mails.unshift({
      from: to, initial: to.slice(0, 1), color: 'linear-gradient(135deg,#2fd0ff,#7c5cff)',
      subject: subj, preview: body.slice(0, 30), time: '刚刚', unread: false, body,
    });
    ['#mail-to', '#mail-subj', '#mail-body-input'].forEach((s) => (root.querySelector(s).value = ''));
    sheet.classList.remove('show');
    render();
    toast('邮件已发送');
  });
  ['#mail-to', '#mail-subj', '#mail-body-input'].forEach((s) =>
    root.querySelector(s).addEventListener('pointerdown', (e) => e.stopPropagation()));

  render();
}

/* ============================= 地图 ============================= */

const PLACES = [
  { name: '液态咖啡馆', cat: '咖啡 · 甜点', dist: '320 m', rate: '4.8', x: 52, y: 36, color: '#ff9f0a', glyph: glyphs.music },
  { name: '玻璃美术馆', cat: '艺术 · 展览', dist: '680 m', rate: '4.9', x: 26, y: 24, color: '#7c5cff', glyph: glyphs.photos },
  { name: '流体公园', cat: '公园 · 户外', dist: '1.2 km', rate: '4.6', x: 70, y: 62, color: '#5cffb2', glyph: glyphs.weather },
  { name: '凌霄书店', cat: '书店 · 咖啡', dist: '450 m', rate: '4.7', x: 38, y: 70, color: '#ff5f8f', glyph: glyphs.notes },
  { name: '夜航电影院', cat: '影院 · 娱乐', dist: '2.1 km', rate: '4.5', x: 80, y: 30, color: '#2fd0ff', glyph: glyphs.clock },
];

function mapsApp(el) {
  const root = shell(el, 'app map-app');
  root.innerHTML = `
    <div class="map-card">
      <div class="map-world" id="map-world">
        <div class="map-bg"></div>
        <div class="map-river"></div>
        <div class="map-park p1"></div>
        <div class="map-park p2"></div>
        <div class="map-road r1"></div>
        <div class="map-road r2"></div>
        <div class="map-road r3"></div>
        <div class="map-blocks"></div>
        <div class="map-labels">
          <span style="left:24%;top:25%">光谷大道</span>
          <span style="left:66%;top:16%">湖滨路</span>
          <span style="left:38%;top:60%">玻璃巷</span>
          <span style="left:74%;top:74%">流体公园</span>
        </div>
        <div class="map-pins" id="map-pins"></div>
      </div>
      <div class="map-top">
        <div class="map-search glass">
          <span>${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'stroke-width="1.7"')}</span>
          <input id="map-input" placeholder="搜索地点、街道、关键词" autocomplete="off">
        </div>
        <button class="map-me glass" id="map-me">${svg('<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>', 'stroke-width="1.7"')}</button>
      </div>
      <div class="map-chips" id="map-chips">
        <button class="map-chip on" data-cat="全部">全部</button>
        <button class="map-chip" data-cat="咖啡">咖啡</button>
        <button class="map-chip" data-cat="艺术">艺术</button>
        <button class="map-chip" data-cat="公园">公园</button>
      </div>
      <div class="map-zoom">
        <button id="map-in">+</button><button id="map-out">−</button>
      </div>
      <div class="map-sheet" id="map-sheet">
        <div class="map-sheet-grip"></div>
        <div class="map-sheet-top"><span class="map-badge" id="map-badge">4.8</span><div><b id="map-name">液态咖啡馆</b><i id="map-cat">咖啡 · 甜点</i></div><span class="map-dist" id="map-dist">320 m</span></div>
        <div class="map-acts">
          <button class="map-act primary" id="map-go">${svg('<path d="M3 11l18-8-8 18-2-8z"/>', 'stroke-width="1.8"')}导航</button>
          <button class="map-act" id="map-fav">${svg('<path d="M12 3l2.9 6.2 6.6.8-4.9 4.5 1.3 6.5-5.9-3.3-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/>', 'stroke-width="1.6"')}收藏</button>
        </div>
      </div>
    </div>`;

  const world = root.querySelector('#map-world');
  const pinsEl = root.querySelector('#map-pins');
  const sheet = root.querySelector('#map-sheet');
  let scale = 1;
  let active = 0;

  PLACES.forEach((p, i) => {
    const pin = make('button', 'map-pin');
    pin.dataset.i = String(i);
    pin.dataset.cat = p.cat;
    pin.style.left = `${p.x}%`;
    pin.style.top = `${p.y}%`;
    pin.style.setProperty('--c', p.color);
    pin.innerHTML = `<span class="map-pin-halo"></span><span class="map-pin-body">${p.glyph}</span>`;
    pressable(pin, { scale: 0.9, flash: false, onTap: () => pick(i) });
    pinsEl.appendChild(pin);
  });

  function pick(i) {
    active = i;
    const p = PLACES[i];
    root.querySelector('#map-badge').textContent = p.rate;
    root.querySelector('#map-name').textContent = p.name;
    root.querySelector('#map-cat').textContent = p.cat;
    root.querySelector('#map-dist').textContent = p.dist;
    root.querySelector('.map-pin.on')?.classList.remove('on');
    pinsEl.querySelector(`[data-i="${i}"]`)?.classList.add('on');
    sheet.classList.add('show');
    navigator.vibrate?.(6);
  }

  function zoom(d) {
    scale = Math.min(2, Math.max(0.8, scale + d));
    world.style.transform = `scale(${scale})`;
  }
  pressable(root.querySelector('#map-in'), { scale: 0.9, flash: false, onTap: () => zoom(0.2) });
  pressable(root.querySelector('#map-out'), { scale: 0.9, flash: false, onTap: () => zoom(-0.2) });
  pressable(root.querySelector('#map-me'), { scale: 0.9, flash: false, onTap: () => toast('已定位到「上海市 · 静安」') });
  pressable(root.querySelector('#map-go'), { scale: 0.94, onTap: () => toast(`已规划路线 · ${PLACES[active].dist}`) });
  pressable(root.querySelector('#map-fav'), { scale: 0.94, flash: false, onTap: () => {
    root.querySelector('#map-fav').classList.toggle('on');
    toast('已加入收藏');
  } });
  root.querySelectorAll('.map-chip').forEach((c) => {
    pressable(c, { scale: 0.94, flash: false, onTap: () => {
      root.querySelectorAll('.map-chip').forEach((x) => x.classList.toggle('on', x === c));
      const cat = c.dataset.cat;
      pinsEl.querySelectorAll('.map-pin').forEach((p) => {
        const on = cat === '全部' || p.dataset.cat.includes(cat);
        p.classList.toggle('dim', !on);
      });
    } });
  });
  const input = root.querySelector('#map-input');
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    if (!q) return;
    const found = PLACES.find((p) => p.name.includes(q) || p.cat.includes(q));
    if (found) pick(PLACES.indexOf(found));
    else toast(`没有找到「${q}」`);
  });
}

/* ============================= 日历 ============================= */

function calendarApp(el) {
  const root = shell(el, 'app cal-app');
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const events = {};
  const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const addEvt = (offset, time, title, color) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    (events[key(d)] ||= []).push({ time, title, color });
  };
  addEvt(0, '10:30', '流体参数评审', '#7c5cff');
  addEvt(0, '15:00', '动效走查 · 会议室 3F', '#2fd0ff');
  addEvt(2, '14:00', '与林浩对翻页手感', '#ff5f8f');
  addEvt(5, '09:30', '发布 Liquid Pad 1.0', '#5cffb2');
  addEvt(8, '19:00', '夜间摄影 · 玻璃反光', '#ff9f0a');
  addEvt(-3, '11:00', '整理折射参数表', '#7c5cff');

  root.innerHTML = `
    <div class="cal-card glass">
      <header class="cal-head">
        <button class="cal-nav" id="cal-prev">${svg('<path d="M15 18l-6-6 6-6"/>')}</button>
        <div class="cal-month" id="cal-month"></div>
        <button class="cal-nav" id="cal-next">${svg('<path d="M9 6l6 6-6 6"/>')}</button>
        <button class="cal-today" id="cal-today">今天</button>
      </header>
      <div class="cal-week">${['日', '一', '二', '三', '四', '五', '六'].map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>
    <div class="cal-side glass">
      <div class="cal-side-h">
        <div><div class="cal-sel-date" id="cal-sel-date">今天</div><div class="cal-sel-sub" id="cal-sel-sub"></div></div>
        <button class="cal-add" id="cal-add">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
      </div>
      <div class="cal-events" id="cal-events"></div>
    </div>`;

  const grid = root.querySelector('#cal-grid');
  const monthEl = root.querySelector('#cal-month');
  const eventsEl = root.querySelector('#cal-events');

  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function render() {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    monthEl.textContent = `${y} 年 ${m + 1} 月`;
    const first = new Date(y, m, 1);
    const lead = first.getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    grid.innerHTML = '';
    for (let i = 0; i < lead; i++) {
      const d = make('button', 'cal-cell out', String(prevDays - lead + i + 1));
      grid.appendChild(d);
    }
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const cell = make('button', `cal-cell${sameDay(date, today) ? ' today' : ''}${sameDay(date, selected) ? ' on' : ''}`);
      const ev = events[key(date)] || [];
      cell.innerHTML = `<span>${d}</span>${ev.length ? `<i class="cal-dots">${ev.slice(0, 3).map((e) => `<b style="--c:${e.color}"></b>`).join('')}</i>` : ''}`;
      pressable(cell, { scale: 0.9, flash: false, onTap: () => { selected = date; render(); } });
      grid.appendChild(cell);
    }
    const tail = (7 - ((lead + days) % 7)) % 7;
    for (let i = 0; i < tail; i++) grid.appendChild(make('button', 'cal-cell out', String(i + 1)));
    renderSide();
  }

  function renderSide() {
    const ev = events[key(selected)] || [];
    const isToday = sameDay(selected, today);
    root.querySelector('#cal-sel-date').textContent = `${selected.getMonth() + 1} 月 ${selected.getDate()} 日`;
    const week = '星期日,星期一,星期二,星期三,星期四,星期五,星期六'.split(',')[selected.getDay()];
    root.querySelector('#cal-sel-sub').textContent = `${isToday ? '今天 · ' : ''}${week}`;
    eventsEl.innerHTML = ev.length
      ? ev.map((e) => `<div class="cal-ev"><span class="cal-ev-bar" style="background:${e.color}"></span><div><b>${e.title}</b><i>${e.time}</i></div></div>`).join('')
      : `<div class="cal-empty">这一天还没有安排<br><span>点右上角 + 添加日程</span></div>`;
  }

  pressable(root.querySelector('#cal-prev'), { scale: 0.9, flash: false, onTap: () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1); render(); } });
  pressable(root.querySelector('#cal-next'), { scale: 0.9, flash: false, onTap: () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); render(); } });
  pressable(root.querySelector('#cal-today'), { scale: 0.92, flash: false, onTap: () => {
    cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    render();
  } });
  pressable(root.querySelector('#cal-add'), { scale: 0.88, onTap: () => {
    (events[key(selected)] ||= []).push({ time: '09:00', title: '新日程', color: '#7c5cff' });
    renderSide();
    render();
    toast('已添加日程');
  } });
  render();
}

/* ============================= 健康 ============================= */

function healthApp(el) {
  const root = shell(el, 'app health-app');
  root.innerHTML = `
    <div class="hl-hero glass">
      <div class="hl-ring-wrap">
        <svg viewBox="0 0 200 200" class="hl-rings">
          <circle class="hl-track" cx="100" cy="100" r="78"></circle>
          <circle class="hl-track" cx="100" cy="100" r="62"></circle>
          <circle class="hl-track" cx="100" cy="100" r="46"></circle>
          <circle class="hl-ring r1" cx="100" cy="100" r="78"></circle>
          <circle class="hl-ring r2" cx="100" cy="100" r="62"></circle>
          <circle class="hl-ring r3" cx="100" cy="100" r="46"></circle>
        </svg>
        <div class="hl-ring-core"><b>78</b><span>活动</span></div>
      </div>
      <div class="hl-hero-meta">
        <div class="hl-kicker">今日活动</div>
        <div class="hl-hero-title">三个圆环都<br>在向前转。</div>
        <div class="hl-legend">
          <span><i style="--c:#ff2d78"></i>活动 620/800 千卡</span>
          <span><i style="--c:#a6ff3f"></i>锻炼 42/60 分钟</span>
          <span><i style="--c:#2fd0ff"></i>站立 9/12 小时</span>
        </div>
      </div>
    </div>
    <div class="hl-cards">
      <div class="hl-stat glass"><span class="hl-ic" style="--c:#ff9f0a">${glyphs.health}</span><b>7,842</b><i>今日步数</i><s>目标 10,000</s></div>
      <div class="hl-stat glass"><span class="hl-ic" style="--c:#ff2d78">${svg('<path d="M3 12h4l2-6 4 12 2-6h6"/>')}</span><b id="hl-bpm">72</b><i>实时心率</i><s>静息 58 bpm</s></div>
      <div class="hl-stat glass"><span class="hl-ic" style="--c:#7c5cff">${glyphs.moon}</span><b>7h 24m</b><i>昨夜睡眠</i><s>深睡 2h 06m</s></div>
    </div>
    <div class="hl-chart glass">
      <div class="hl-chart-h"><b>本周活动</b><span>分钟</span></div>
      <div class="hl-bars" id="hl-bars"></div>
    </div>`;

  const bars = [42, 68, 35, 88, 56, 74, 60];
  const week = ['一', '二', '三', '四', '五', '六', '日'];
  root.querySelector('#hl-bars').innerHTML = bars.map((v, i) =>
    `<div class="hl-bar"><i style="--h:${v}%;--c:${i === 3 ? '#a6ff3f' : '#2fd0ff'}"></i><span>${week[i]}</span></div>`).join('');

  const rings = [
    ['.hl-ring.r1', 0.78, '#ff2d78'],
    ['.hl-ring.r2', 0.62, '#a6ff3f'],
    ['.hl-ring.r3', 0.82, '#2fd0ff'],
  ];
  requestAnimationFrame(() => {
    rings.forEach(([sel, frac, color], i) => {
      const c = root.querySelector(sel);
      const r = Number(c.getAttribute('r'));
      const circ = 2 * Math.PI * r;
      c.style.stroke = color;
      c.style.strokeDasharray = String(circ);
      c.style.strokeDashoffset = String(circ);
      tween({
        from: circ, to: circ * (1 - frac), duration: 1.1, delay: i * 0.08,
        ease: (t) => 1 - Math.pow(1 - t, 3),
        onUpdate: (v) => { c.style.strokeDashoffset = v.toFixed(1); },
      });
    });
  });

  every(1800, () => {
    const b = root.querySelector('#hl-bpm');
    if (!b) return;
    const v = 66 + Math.round(Math.random() * 10);
    b.textContent = String(v);
    b.animate([{ transform: 'scale(1.12)', color: '#ff2d78' }, { transform: 'scale(1)', color: '' }],
      { duration: 420, easing: 'cubic-bezier(.2,1.3,.4,1)' });
  });
}

/* ============================= 钱包 ============================= */

const CARDS = [
  { name: '曜石黑', brand: 'LIQUID', num: '•••• 8842', grad: 'linear-gradient(135deg,#3a3f4c 0%,#15171d 55%,#0a0b10 100%)', ink: '#ffffff', chip: true },
  { name: '紫晶', brand: 'AURORA', num: '•••• 1026', grad: 'linear-gradient(135deg,#6a3cff 0%,#2fd0ff 100%)', ink: '#ffffff', chip: true },
  { name: '晨曦', brand: 'GLASS', num: '•••• 3371', grad: 'linear-gradient(135deg,#ff5f8f 0%,#ffb36b 100%)', ink: '#2a0d18', chip: true },
];
const TX = [
  ['液态咖啡馆', '咖啡', '今天 10:24', '− 32.00', '#ff9f0a'],
  ['玻璃美术馆', '门票', '昨天 16:10', '− 88.00', '#7c5cff'],
  ['订阅 · Liquid Pro', '服务', '11月3日', '− 25.00', '#2fd0ff'],
  ['设计稿酬', '收入', '11月1日', '+ 1,200.00', '#5cffb2'],
];

function walletApp(el) {
  const root = shell(el, 'app wallet-app');
  let front = 0;

  root.innerHTML = `
    <div class="wallet-stage">
      <div class="wallet-stack" id="wallet-stack"></div>
      <div class="wallet-name" id="wallet-name">曜石黑</div>
      <div class="wallet-dots" id="wallet-dots"></div>
    </div>
    <div class="wallet-side">
      <div class="wallet-actions">
        <button class="wallet-act glass" id="wallet-pay">${svg('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M15 15h3"/>', 'stroke-width="1.7"')}<span>付款</span></button>
        <button class="wallet-act glass" id="wallet-add">${svg('<path d="M12 5v14M5 12h14"/>')}<span>添加卡</span></button>
      </div>
      <div class="wallet-tx glass">
        <div class="wallet-tx-h"><b>最近交易</b><span>全部</span></div>
        <div id="wallet-rows"></div>
      </div>
    </div>`;

  const stack = root.querySelector('#wallet-stack');
  const dots = root.querySelector('#wallet-dots');

  CARDS.forEach((c, i) => {
    const card = make('button', 'wal-card');
    card.style.background = c.grad;
    card.style.color = c.ink;
    card.innerHTML = `
      <div class="wal-top"><span class="wal-brand">${c.brand}</span><span class="wal-wave">${svg('<path d="M5 9a8 8 0 0 1 0 6M9 7a14 14 0 0 1 0 10M13 5a20 20 0 0 1 0 14"/>', 'stroke-width="1.5"')}</span></div>
      <div class="wal-chip"></div>
      <div class="wal-num">${c.num}</div>
      <div class="wal-bottom"><span>LIQUID PAD</span><span>09/28</span></div>`;
    stack.appendChild(card);
    const label = make('span', 'wal-dot');
    dots.appendChild(label);
  });

  function paint() {
    [...stack.children].forEach((c, i) => {
      const rel = (i - front + CARDS.length) % CARDS.length;
      c.style.zIndex = String(10 - rel);
      c.style.transform = `translate3d(${rel * 14}px, ${rel * 14}px, 0) rotate(${rel * 3.2}deg) scale(${1 - rel * 0.05})`;
      c.style.filter = rel ? `brightness(${1 - rel * 0.18})` : 'none';
      c.classList.toggle('on', rel === 0);
    });
    root.querySelector('#wallet-name').textContent = CARDS[front].name;
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === front));
  }

  const rows = root.querySelector('#wallet-rows');
  TX.forEach(([name, cat, time, amount, color]) => {
    const r = make('div', 'wal-row');
    r.innerHTML = `<span class="wal-row-ic" style="--c:${color}"></span><div><b>${name}</b><i>${cat} · ${time}</i></div><span class="wal-amt">${amount}</span>`;
    rows.appendChild(r);
  });

  stack.querySelectorAll('.wal-card').forEach((c, i) => {
    c.addEventListener('pointerdown', (e) => e.stopPropagation());
    c.addEventListener('click', () => { front = i; paint(); navigator.vibrate?.(6); });
  });
  pressable(root.querySelector('#wallet-pay'), { scale: 0.94, onTap: () => toast('靠近读卡器即可付款 · 演示') });
  pressable(root.querySelector('#wallet-add'), { scale: 0.94, flash: false, onTap: () => toast('添加银行卡 · 演示') });
  paint();
}

/* ============================= App Store ============================= */

const STORE_APPS = [
  { id: 'flow', name: 'Fluid Studio', sub: '流体排版与动效实验室', ic: glyphs.weather, bg: 'linear-gradient(150deg,#2fd0ff,#0a5ce8)' },
  { id: 'glass', name: 'Glass Kit', sub: '为设计稿生成液态玻璃材质', ic: glyphs.photos, bg: 'linear-gradient(150deg,#7c5cff,#ff5f8f)' },
  { id: 'spring', name: 'Spring Lab', sub: '弹簧曲线可视化调参', ic: glyphs.settings, bg: 'linear-gradient(150deg,#5cffb2,#00a3c4)' },
  { id: 'pad', name: 'Liquid Pad', sub: '你正在使用的这台平板', ic: glyphs.appstore, bg: 'linear-gradient(150deg,#ff9f0a,#ff5f8f)' },
  { id: 'note', name: 'Ink Flow', sub: '会呼吸的手写笔记', ic: glyphs.notes, bg: 'linear-gradient(150deg,#ffe066,#f7c948)' },
  { id: 'map', name: 'Atlas Glass', sub: '透明地图与城市漫步', ic: glyphs.maps, bg: 'linear-gradient(150deg,#63e07a,#31b5ff)' },
];

function appStoreApp(el) {
  const root = shell(el, 'app as-app');
  root.innerHTML = `
    <header class="as-head">
      <div><div class="as-crumb">App Store</div><div class="as-title">今天</div></div>
      <button class="as-ava glass" id="as-ava">L</button>
    </header>
    <div class="as-search glass">
      <span>${svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 'stroke-width="1.7"')}</span>
      <input id="as-input" placeholder="搜索 App、游戏或专题" autocomplete="off" spellcheck="false">
    </div>
    <div class="as-hero" id="as-hero">
      <div class="as-hero-bg"></div>
      <div class="as-hero-body">
        <div class="as-kicker">液态精选</div>
        <div class="as-hero-t">让界面<br>流动起来</div>
        <div class="as-hero-s">一套关于玻璃、光与触感的工具集。</div>
        <button class="as-hero-btn" id="as-hero-btn">查看合集</button>
      </div>
      <div class="as-hero-orb"></div>
    </div>
    <div class="as-section-h"><b>为你推荐</b><span id="as-count">6 个 App</span></div>
    <div class="as-list" id="as-list"></div>`;

  const list = root.querySelector('#as-list');
  const count = root.querySelector('#as-count');
  const input = root.querySelector('#as-input');
  const installed = new Set();

  function render(filter = '') {
    list.innerHTML = '';
    const items = STORE_APPS.filter((a) => !filter || a.name.toLowerCase().includes(filter.toLowerCase()) || a.sub.includes(filter));
    count.textContent = `${items.length} 个 App`;
    items.forEach((a) => {
      const row = make('div', 'as-row');
      const done = installed.has(a.id);
      row.innerHTML = `
        <span class="as-icon" style="background:${a.bg}">${a.ic}</span>
        <span class="as-row-body"><b>${a.name}</b><i>${a.sub}</i><s>4.${(a.name.length % 7) + 2} · 评分</s></span>
        <button class="as-get${done ? ' done' : ''}">${done ? '打开' : '获取'}</button>`;
      const btn = row.querySelector('.as-get');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.classList.contains('loading')) return;
        if (installed.has(a.id)) { toast(`正在打开 ${a.name}`); return; }
        btn.classList.add('loading');
        btn.textContent = '获取中';
        const cancel = tween({
          from: 0, to: 1, duration: 1.4,
          onUpdate: (v) => { btn.style.setProperty('--p', `${(v * 100).toFixed(0)}%`); },
          onComplete: () => {
            installed.add(a.id);
            btn.classList.remove('loading');
            btn.classList.add('done');
            btn.textContent = '打开';
            btn.style.removeProperty('--p');
            toast(`${a.name} 已安装`);
          },
        });
        disposers.push(() => cancel.cancel());
      });
      list.appendChild(row);
    });
    if (!items.length) list.innerHTML = '<div class="as-empty">没有找到相关的 App</div>';
  }

  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('input', () => render(input.value.trim()));
  pressable(root.querySelector('#as-ava'), { scale: 0.9, flash: false, onTap: () => toast('账户 · 演示') });
  pressable(root.querySelector('#as-hero-btn'), { scale: 0.94, onTap: () => {
    input.value = 'Liquid';
    render('Liquid');
    toast('已筛选「Liquid」');
  } });
  render();
}

/* ============================= 提醒事项 ============================= */

function remindersApp(el) {
  const root = shell(el, 'app rmd-app');
  const SEED = [
    { t: '完成液态玻璃应用补全', meta: '今天 14:00 · 产品', done: false, c: '#ff9f0a' },
    { t: '复核手机端触控布局', meta: '今天 16:30 · 设计', done: false, c: '#2fd0ff' },
    { t: '拍一张玻璃反光的照片', meta: '今天 19:00 · 生活', done: false, c: '#ff5f8f' },
    { t: '回复设计小组的邮件', meta: '明天 09:00 · 工作', done: true, c: '#5cffb2' },
  ];
  let items;
  try { items = JSON.parse(localStorage.getItem('lg-rmd-v1')) || SEED; } catch { items = SEED; }
  if (!Array.isArray(items) || !items.length) items = SEED;
  const save = () => { try { localStorage.setItem('lg-rmd-v1', JSON.stringify(items)); } catch (_) {} };

  root.innerHTML = `
    <header class="rmd-head">
      <div>
        <div class="rmd-kicker">提醒事项</div>
        <div class="rmd-title">今天</div>
      </div>
      <div class="rmd-count"><b id="rmd-done">0</b><span>/ ${items.length}</span></div>
    </header>
    <div class="rmd-track"><span id="rmd-fill"></span></div>
    <div class="rmd-list" id="rmd-list"></div>
    <div class="rmd-add">
      <input id="rmd-input" placeholder="添加提醒事项…" autocomplete="off" spellcheck="false">
      <button id="rmd-add" aria-label="添加">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
    </div>`;

  const listEl = root.querySelector('#rmd-list');
  const field = root.querySelector('#rmd-input');

  function render() {
    listEl.innerHTML = '';
    [...items].sort((a, b) => Number(a.done) - Number(b.done)).forEach((it, i) => {
      const row = make('div', `rmd-row${it.done ? ' done' : ''}`);
      row.innerHTML = `
        <button class="rmd-check" aria-label="完成">${it.done ? svg('<path d="m5 12 4.5 4.5L19 7"/>') : '<i style="--c:' + it.c + '"></i>'}</button>
        <div class="rmd-body"><b>${it.t}</b><i>${it.meta}</i></div>
        <span class="rmd-flag" style="--c:${it.c}"></span>`;
      pressable(row.querySelector('.rmd-check'), { scale: 0.82, flash: false, onTap: () => {
        it.done = !it.done;
        save();
        render();
        navigator.vibrate?.(6);
      } });
      listEl.appendChild(row);
    });
    const done = items.filter((i) => i.done).length;
    root.querySelector('#rmd-done').textContent = String(done);
    root.querySelector('#rmd-fill').style.width = `${(done / items.length * 100).toFixed(1)}%`;
  }

  function add() {
    const v = field.value.trim();
    if (!v) return;
    items.unshift({ t: v, meta: '今天 · 新增', done: false, c: '#7c5cff' });
    field.value = '';
    save();
    render();
    toast('已添加提醒');
  }

  pressable(root.querySelector('#rmd-add'), { scale: 0.88, onTap: add });
  field.addEventListener('pointerdown', (e) => e.stopPropagation());
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  field.addEventListener('input', () => {
    if (field.value.trim()) root.querySelector('#rmd-placeholder')?.remove();
  });
  render();
}

/* ============================= 翻译 ============================= */

const PHRASES = [
  { zh: '设计是让复杂看起来简单。', en: 'Design is making the complex look simple.' },
  { zh: '让界面像水一样回应指尖。', en: 'Let the interface answer your fingertips like water.' },
  { zh: '我们做的不是动画，是手感。', en: 'We are not making animation, we are making feel.' },
  { zh: '玻璃之所以动人，是因为光在里面走得很慢。', en: 'Glass moves us because light travels slowly inside it.' },
  { zh: '今天的动效评审改到下午四点。', en: 'Today’s motion review moved to four in the afternoon.' },
];
const LEX = {
  设计: 'design', 界面: 'interface', 玻璃: 'glass', 光: 'light', 流体: 'fluid', 指尖: 'fingertips',
  触摸: 'touch', 让: 'let', 是: 'is', 复杂: 'complex', 看起来: 'look', 简单: 'simple', 我们: 'we',
  做: 'make', 不: 'not', 而是: 'but', 和: 'and', 与: 'and', 在: 'in', 里面: 'inside', 走: 'travel',
  很: 'very', 慢: 'slow', 为什么: 'why', 会: 'will', 流动: 'flow', 这: 'this', 那: 'that',
  一个: 'a', 你: 'you', 我: 'I', 他: 'he', 她: 'she', 喜欢: 'like', 今天: 'today', 明天: 'tomorrow',
  早上: 'morning', 晚上: 'evening', 好: 'good', 一切: 'everything', 都: 'all', 有: 'have', 没有: 'without',
  可以: 'can', 需要: 'need', 时间: 'time', 感觉: 'feeling', 动效: 'motion', 手感: 'feel', 真实: 'real',
  自然: 'natural', 高光: 'highlight', 边缘: 'edge', 圆角: 'radius', 阴影: 'shadow', 深度: 'depth',
  通透: 'transparency', 像: 'like', 水: 'water', 一样: 'same', 回应: 'answer', 动画: 'animation',
  场景: 'scene', 应用: 'app', 屏幕: 'screen', 触摸屏: 'touchscreen', 弹簧: 'spring', 参数: 'parameters',
  评审: 'review', 改到: 'moved to', 下午: 'afternoon', 点: 'o’clock', 照片: 'photo', 邮件: 'email',
};

function translate(text, reverse) {
  const s = text.trim();
  if (!s) return '';
  if (!reverse) {
    const exact = PHRASES.find((p) => p.zh === s);
    if (exact) return exact.en;
    let out = '';
    let i = 0;
    while (i < s.length) {
      let hit = '';
      for (let len = Math.min(4, s.length - i); len > 0; len--) {
        const w = s.slice(i, i + len);
        if (LEX[w]) { hit = w; break; }
      }
      if (hit) { out += ` ${LEX[hit]}`; i += hit.length; }
      else {
        if (/[\u4e00-\u9fa5]/.test(s[i])) out += ' …';
        else if (/[\w']/.test(s[i])) out += s[i];
        else out += ' ';
        i++;
      }
    }
    const cleaned = out.replace(/\s+/g, ' ').trim();
    return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}.` : '…';
  }
  const exact = PHRASES.find((p) => p.en.replace(/’/g, "'") === s);
  if (exact) return exact.zh;
  return '本地词库暂未收录这句，试试常用短语。';
}

function translateApp(el) {
  const root = shell(el, 'app tr-app');
  root.innerHTML = `
    <header class="tr-head">
      <div class="tr-kicker">翻译 · 本地词库</div>
      <div class="tr-title">自然、准确，<br>就像母语。</div>
      <div class="tr-sub">中文 ⇄ English · 离线演示</div>
    </header>
    <div class="tr-card glass">
      <div class="tr-pane">
        <div class="tr-label"><span id="tr-l1">中文</span><button id="tr-clear">清空</button></div>
        <textarea id="tr-in" spellcheck="false" autocomplete="off">${PHRASES[0].zh}</textarea>
      </div>
      <div class="tr-mid"><button class="tr-swap" id="tr-swap">${svg('<path d="M7 4v13M4 14l3 3 3-3M17 20V7M14 10l3-3 3 3"/>')}</button></div>
      <div class="tr-pane out">
        <div class="tr-label"><span id="tr-l2">English</span><button id="tr-copy">拷贝</button></div>
        <div class="tr-out" id="tr-out"></div>
      </div>
    </div>
    <div class="tr-more-h">常用短语</div>
    <div class="tr-chips" id="tr-chips"></div>`;

  const input = root.querySelector('#tr-in');
  const out = root.querySelector('#tr-out');
  const chips = root.querySelector('#tr-chips');
  let reverse = false;

  const paint = () => {
    out.textContent = translate(input.value, reverse);
    out.classList.toggle('empty', !input.value.trim());
  };
  const debounce = () => {
    clearTimeout(paint._t);
    paint._t = setTimeout(paint, 220);
  };

  chips.innerHTML = PHRASES.map((p, i) => `<button class="tr-chip" data-i="${i}">${p.zh}</button>`).join('');
  chips.querySelectorAll('.tr-chip').forEach((c) => {
    pressable(c, { scale: 0.95, flash: false, onTap: () => {
      if (reverse) { input.value = PHRASES[Number(c.dataset.i)].en; reverse = true; }
      else input.value = PHRASES[Number(c.dataset.i)].zh;
      paint();
    } });
  });

  pressable(root.querySelector('#tr-swap'), { scale: 0.88, onTap: () => {
    const t = input.value;
    input.value = out.textContent;
    reverse = !reverse;
    root.querySelector('#tr-l1').textContent = reverse ? 'English' : '中文';
    root.querySelector('#tr-l2').textContent = reverse ? '中文' : 'English';
    if (reverse && !PHRASES.some((p) => p.en.replace(/’/g, "'") === t.trim())) toast('演示词库仅支持常用短语');
    paint();
  } });
  pressable(root.querySelector('#tr-clear'), { scale: 0.94, flash: false, onTap: () => {
    input.value = '';
    paint();
    input.focus();
  } });
  pressable(root.querySelector('#tr-copy'), { scale: 0.94, flash: false, onTap: () => {
    navigator.clipboard?.writeText(out.textContent).catch(() => {});
    toast('译文已拷贝');
  } });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('input', debounce);
  paint();
}

/* ============================= 股票 ============================= */

const STOCKS = [
  { sym: 'AAPL', name: '苹果', base: 226.1, price: 228.42, spark: [220, 222, 221, 224, 225, 223, 226, 227, 225, 228, 229, 227, 228] },
  { sym: 'NVDA', name: '英伟达', base: 138.2, price: 142.86, spark: [134, 136, 135, 138, 137, 139, 140, 138, 141, 142, 140, 143, 142] },
  { sym: 'TSLA', name: '特斯拉', base: 254.8, price: 251.34, spark: [260, 258, 257, 259, 256, 254, 253, 255, 252, 251, 253, 250, 251] },
  { sym: 'MSFT', name: '微软', base: 424.6, price: 428.11, spark: [418, 420, 419, 422, 423, 421, 424, 425, 426, 424, 427, 426, 428] },
  { sym: 'TSM', name: '台积电', base: 196.4, price: 198.65, spark: [192, 194, 193, 195, 196, 194, 197, 196, 198, 197, 199, 198, 199] },
];

function sparkPath(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = max - min || 1;
  return arr.map((v, i) => `${(i / (arr.length - 1) * 100).toFixed(1)},${(96 - (v - min) / span * 88).toFixed(1)}`).join(' ');
}

function stocksApp(el) {
  const root = shell(el, 'app stk-app');
  let active = 0;

  root.innerHTML = `
    <header class="stk-head">
      <div><div class="stk-kicker">股票</div><div class="stk-title">自选</div></div>
      <div class="stk-live"><i></i>模拟行情</div>
    </header>
    <div class="stk-hero glass" id="stk-hero">
      <div class="stk-hero-left">
        <div class="stk-hsym" id="stk-hsym">AAPL</div>
        <div class="stk-hname" id="stk-hname">苹果</div>
        <div class="stk-hprice" id="stk-hprice">$228.42</div>
        <div class="stk-hchg up" id="stk-hchg">+1.24%</div>
      </div>
      <div class="stk-spark big" id="stk-hspark"></div>
    </div>
    <div class="stk-list glass">
      <div class="stk-row-h"><span>名称</span><span>近 30 分钟</span><span>最新价</span></div>
      <div id="stk-rows"></div>
    </div>
    <div class="stk-note">数据为本地模拟，仅用于展示交互。</div>`;

  const rowsEl = root.querySelector('#stk-rows');
  const refs = [];

  STOCKS.forEach((s, i) => {
    const row = make('button', `stk-row${i === 0 ? ' on' : ''}`);
    row.innerHTML = `
      <span class="stk-name"><b>${s.name}</b><i>${s.sym}</i></span>
      <span class="stk-mini"></span>
      <span class="stk-num"><b>$${s.price.toFixed(2)}</b><i></i></span>`;
    pressable(row, { scale: 0.985, flash: false, onTap: () => select(i) });
    row.querySelector('.stk-mini').innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${sparkPath(s.spark)}"/></svg>`;
    rowsEl.appendChild(row);
    refs.push(row);
  });

  function select(i) {
    active = i;
    refs.forEach((r, k) => r.classList.toggle('on', k === i));
    paintHero();
    navigator.vibrate?.(5);
  }

  function paintHero() {
    const s = STOCKS[active];
    const chg = (s.price - s.base) / s.base * 100;
    root.querySelector('#stk-hsym').textContent = s.sym;
    root.querySelector('#stk-hname').textContent = s.name;
    root.querySelector('#stk-hprice').textContent = `$${s.price.toFixed(2)}`;
    const chgEl = root.querySelector('#stk-hchg');
    chgEl.textContent = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
    chgEl.classList.toggle('up', chg >= 0);
    chgEl.classList.toggle('down', chg < 0);
    root.querySelector('#stk-hspark').innerHTML =
      `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${sparkPath(s.spark)}" class="${chg >= 0 ? 'up' : 'down'}"/></svg>`;
  }

  function paintRow(i) {
    const s = STOCKS[i];
    const chg = (s.price - s.base) / s.base * 100;
    refs[i].querySelector('.stk-num b').textContent = `$${s.price.toFixed(2)}`;
    const el = refs[i].querySelector('.stk-num i');
    el.textContent = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
    el.className = chg >= 0 ? 'up' : 'down';
    refs[i].querySelector('polyline').setAttribute('points', sparkPath(s.spark));
    refs[i].querySelector('polyline').setAttribute('class', chg >= 0 ? 'up' : 'down');
  }

  every(3000, () => {
    STOCKS.forEach((s, i) => {
      s.price = Math.max(1, s.price * (1 + (Math.random() - 0.48) * 0.006));
      s.spark.push(s.price);
      if (s.spark.length > 26) s.spark.shift();
      paintRow(i);
    });
    paintHero();
  });
  paintHero();
}

/* ============================= 家庭 ============================= */

function homeApp(el) {
  const root = shell(el, 'app hm-app');
  const ACCESS = [
    { id: 'main', name: '客厅主灯', sub: '亮度 80%', on: true, ic: 'sun', amb: '#ffb55e' },
    { id: 'floor', name: '落地灯', sub: '暖光', on: true, ic: 'sun', amb: '#ffcf8b' },
    { id: 'ac', name: '客厅空调', sub: '26°C · 制冷', on: false, ic: 'weather', amb: '#2fd0ff' },
    { id: 'curtain', name: '卧室窗帘', sub: '已关闭', on: false, ic: 'moon', amb: '#7c5cff' },
  ];
  const SCENES = [
    { id: 'home', name: '回家', on: ['main', 'floor'], amb: '#ffb55e' },
    { id: 'movie', name: '观影', on: ['floor'], amb: '#7c5cff' },
    { id: 'sleep', name: '睡眠', on: [], amb: '#2fd0ff' },
  ];

  root.innerHTML = `
    <header class="hm-head">
      <div><div class="hm-kicker">家庭</div><div class="hm-title">我的家</div></div>
      <div class="hm-status"><i></i><span id="hm-count">2</span> 个配件开启</div>
    </header>
    <div class="hm-hero glass" id="hm-hero" style="--amb:#ffb55e">
      <div class="hm-amb"><span class="hm-amb-orb"></span><span class="hm-amb-ring"></span></div>
      <div class="hm-amb-info">
        <div class="hm-room">客厅</div>
        <div class="hm-temp">22<span>°C</span></div>
        <div class="hm-env">湿度 46% · 空气良好</div>
      </div>
      <div class="hm-scenes" id="hm-scenes">
        ${SCENES.map((s) => `<button class="hm-scene" data-s="${s.id}">${s.name}</button>`).join('')}
      </div>
    </div>
    <div class="hm-grid" id="hm-grid">
      ${ACCESS.map((a) => `
        <button class="hm-tile${a.on ? ' on' : ''}" data-a="${a.id}" style="--c:${a.amb}">
          <span class="hm-tile-ic">${glyphs[a.ic]}</span>
          <span class="hm-tile-body"><b>${a.name}</b><i>${a.sub}</i></span>
          <span class="hm-switch"><i></i></span>
        </button>`).join('')}
    </div>`;

  const grid = root.querySelector('#hm-grid');
  const hero = root.querySelector('#hm-hero');
  const countEl = root.querySelector('#hm-count');

  function paintAmb() {
    const any = ACCESS.find((a) => a.on && a.id === 'main') || ACCESS.find((a) => a.on);
    const c = any ? any.amb : '#2fd0ff';
    hero.style.setProperty('--amb', c);
    countEl.textContent = String(ACCESS.filter((a) => a.on).length);
    ACCESS.forEach((a) => {
      const tile = grid.querySelector(`[data-a="${a.id}"]`);
      tile.classList.toggle('on', a.on);
      const sub = tile.querySelector('.hm-tile-body i');
      if (a.id === 'curtain') sub.textContent = a.on ? '已打开' : '已关闭';
      if (a.id === 'ac') sub.textContent = a.on ? '26°C · 制冷中' : '26°C · 待机';
    });
  }

  grid.querySelectorAll('.hm-tile').forEach((tile) => {
    const item = ACCESS.find((a) => a.id === tile.dataset.a);
    pressable(tile, { scale: 0.97, flash: false, onTap: () => {
      item.on = !item.on;
      paintAmb();
      navigator.vibrate?.(7);
    } });
  });

  root.querySelectorAll('.hm-scene').forEach((b) => {
    pressable(b, { scale: 0.94, flash: false, onTap: () => {
      const sc = SCENES.find((s) => s.id === b.dataset.s);
      ACCESS.forEach((a) => { a.on = sc.on.includes(a.id); });
      root.querySelectorAll('.hm-scene').forEach((x) => x.classList.toggle('on', x === b));
      paintAmb();
      toast(`场景「${sc.name}」已生效`);
    } });
  });

  paintAmb();
}

/* ============================= 导出 ============================= */

export const extraApps = {
  safari: safariApp,
  phone: phoneApp,
  message: messagesApp,
  mail: mailApp,
  maps: mapsApp,
  calendar: calendarApp,
  health: healthApp,
  wallet: walletApp,
  appstore: appStoreApp,
  reminders: remindersApp,
  translate: translateApp,
  stocks: stocksApp,
  home: homeApp,
};
