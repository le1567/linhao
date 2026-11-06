/** 状态栏 + 锁屏时间 */
import { on } from './state.js';

function fmt(d) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function initClock() {
  const sb = document.getElementById('sb-time');
  const sbDate = document.getElementById('sb-date');
  const lock = document.getElementById('lock-clock');
  const date = document.getElementById('lock-date');
  const week = '星期日,星期一,星期二,星期三,星期四,星期五,星期六'.split(',');
  const tickClock = () => {
    const d = new Date();
    const t = fmt(d);
    if (sb) sb.textContent = t;
    if (sbDate) sbDate.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
    if (lock) lock.textContent = t;
    if (date) date.textContent = `${d.getMonth() + 1}月${d.getDate()}日 ${week[d.getDay()]}`;
  };
  tickClock();
  setInterval(tickClock, 5000);

  on('play-change', () => {});
}
