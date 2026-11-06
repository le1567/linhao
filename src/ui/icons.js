/** 图标字形（stroke SVG）与应用注册表 */

const S = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

export const glyphs = {
  phone: S('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  message: S('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  music: S('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  camera: S('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  weather: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'),
  clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  settings: S('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  photos: S('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15.5 16 10 5 21"/>'),
  mail: S('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 7L2 7"/>'),
  maps: S('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  notes: S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'),
  calculator: S('<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>'),
  calendar: S('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  health: S('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
  wallet: S('<rect x="2" y="5" width="20" height="15" rx="3"/><path d="M2 10h20M16 15h2"/>'),
  appstore: S('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'),
  safari: S('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  wifi: S('<path d="M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>'),
  bluetooth: S('<path d="m6.5 6.5 11 11L12 23V1l5.5 5.5-11 11"/>'),
  airplane: S('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" fill="currentColor" stroke="none"/>'),
  moon: S('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  flashlight: S('<path d="M6 3h12v3l-3 3v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9L6 6z"/><path d="M6 6h12M10 13h4"/>'),
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4.5" width="4.4" height="15" rx="1.4"/><rect x="14.1" y="4.5" width="4.4" height="15" rx="1.4"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 12l9-6v12z"/><rect x="4.6" y="6" width="1.6" height="12" rx=".8"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12l-9 6V6z"/><rect x="17.8" y="6" width="1.6" height="12" rx=".8"/></svg>',
  chevUp: S('<path d="m6 15 6-6 6 6"/>'),
  x: S('<path d="M18 6 6 18M6 6l12 12"/>'),
  sun: S('<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M2.6 6.5l2.6 1.5M18.8 16l2.6 1.5M2.6 17.5l2.6-1.5M18.8 8l2.6-1.5"/>'),
};

/** 应用注册表：id → 展示配置（打开行为在 apps.js） */
export const apps = {
  phone:      { name: '电话',   bg: 'linear-gradient(160deg,#5ee87a,#22b14f)', open: 'toast' },
  message:    { name: '信息',   bg: 'linear-gradient(160deg,#6ff262,#2fbf3f)', open: 'toast' },
  music:      { name: '音乐',   bg: 'linear-gradient(160deg,#ff5f8f,#f23b62)', open: 'app' },
  camera:     { name: '相机',   bg: 'linear-gradient(160deg,#9aa3b2,#5b6474)', open: 'app' },
  weather:    { name: '天气',   bg: 'linear-gradient(160deg,#42a8ff,#1f6dff)', open: 'app' },
  clock:      { name: '时钟',   bg: 'linear-gradient(160deg,#2c2f3a,#14161d)', open: 'app' },
  calculator: { name: '计算器', bg: 'linear-gradient(160deg,#3a3d46,#1c1e24)', open: 'app' },
  photos:     { name: '照片',   bg: 'conic-gradient(from 200deg,#ff9d5c,#ff5c9d,#8f6bff,#4cc2ff,#5cffb2,#ff9d5c)', open: 'app' },
  mail:       { name: '邮件',   bg: 'linear-gradient(160deg,#3fa9ff,#0a6bff)', open: 'toast' },
  maps:       { name: '地图',   bg: 'linear-gradient(160deg,#63e07a,#31b5ff)', open: 'toast' },
  notes:      { name: '备忘录', bg: 'linear-gradient(160deg,#ffe066,#f7c948)', open: 'app' },
  settings:   { name: '设置',   bg: 'linear-gradient(160deg,#b8c0cc,#7a8494)', open: 'app' },
  calendar:   { name: '日历',   bg: 'linear-gradient(160deg,#ff6b6b,#e0313f)', open: 'toast' },
  health:     { name: '健康',   bg: 'linear-gradient(160deg,#ff7eb3,#ff2d78)', open: 'toast' },
  wallet:     { name: '钱包',   bg: 'linear-gradient(160deg,#2b2f3a,#111318)', open: 'toast' },
  appstore:   { name: 'App Store', bg: 'linear-gradient(160deg,#3fc0ff,#0a6bff)', open: 'toast' },
  safari:     { name: 'Safari', bg: 'linear-gradient(160deg,#4aa8ff,#0a5ce8)', open: 'toast' },
};
