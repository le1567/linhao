/** 系统设置 — 持久化 + 实时应用（流体壁纸 / 折射 / 玻璃模糊 / 亮度） */
import { emit } from './state.js';
import { setGlassBlurScale, setGlassRefract } from '../engine/glass.js';

const KEY = 'lg-settings-v1';
const DEFAULTS = { fluid: true, refract: true, blur: 1, bright: 0.62 };

export const settings = { ...DEFAULTS, ...load() };

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
}

export function setSetting(key, value) {
  settings[key] = value;
  save();
  applySetting(key, value);
  emit('setting-change', { key, value });
}

export function applySetting(key, value) {
  if (key === 'blur') setGlassBlurScale(value);
  if (key === 'refract') setGlassRefract(value);
  if (key === 'bright') applyBrightness(value);
}

/** 亮度统一入口（控制中心 / 设置 共用） */
export function applyBrightness(v) {
  document.getElementById('screen')?.style.setProperty('--bright', (0.35 + v * 0.65).toFixed(3));
}

export function initSettings() {
  setGlassBlurScale(settings.blur);
  setGlassRefract(settings.refract);
  applyBrightness(settings.bright);
  if (!settings.fluid) emit('setting-change', { key: 'fluid', value: false });
}
