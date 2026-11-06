/** 补间 — 时长驱动动画（与弹簧互补：颜色/透明度/进度等非物理量）。 */
import { ticker } from './ticker.js';
import { easing } from './easing.js';

export function tween({
  from = 0,
  to = 1,
  duration = 0.3,
  ease = easing.ios,
  delay = 0,
  onUpdate,
  onComplete,
}) {
  let elapsed = -delay;
  let alive = true;
  const step = (dt) => {
    if (!alive) return;
    elapsed += dt;
    if (elapsed < 0) return;
    const p = Math.min(elapsed / duration, 1);
    onUpdate && onUpdate(from + (to - from) * ease(p), p);
    if (p >= 1) {
      alive = false;
      ticker.remove(step);
      onComplete && onComplete();
    }
  };
  ticker.add(step);
  return {
    cancel() {
      if (!alive) return;
      alive = false;
      ticker.remove(step);
    },
    get alive() {
      return alive;
    },
  };
}

/** 依次触发（图标弹入等 stagger 场景） */
export function stagger(count, interval, fn) {
  for (let i = 0; i < count; i++) {
    tween({
      from: 0,
      to: 1,
      duration: 0.001,
      delay: i * interval,
      onUpdate: () => {},
      onComplete: () => fn(i),
    });
  }
}
