/**
 * Spring — 阻尼谐振子（iOS 同款手感来源）
 * 半隐式欧拉积分 + 自适应子步长，静止后自动休眠，零 CPU 空转。
 *
 * const s = new Spring(0, { stiffness: 200, damping: 22 });
 * s.onUpdate = v => el.style.transform = `translateX(${v}px)`;
 * s.to(100); // 丝滑跟手
 */
import { ticker } from './ticker.js';

const active = new Set();

function tick(dt) {
  for (const s of [...active]) s.update(dt);
}

function ensureLoop() {
  if (active.size) ticker.add(tick);
}
function maybeSleep() {
  if (!active.size) ticker.remove(tick);
}

export class Spring {
  constructor(value = 0, cfg = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = cfg.stiffness ?? 170; // 刚度
    this.damping = cfg.damping ?? 20;      // 阻尼（< 临界阻尼产生回弹 = “液感”）
    this.mass = cfg.mass ?? 1;
    this.precision = cfg.precision ?? 0.001;
    this.onUpdate = null;
    this.onRest = null;
    this._sleeping = true;
  }

  to(t) {
    if (t === this.target && !this._sleeping) return;
    this.target = t;
    this._wake();
  }

  /** 无动画直达 */
  set(t) {
    this.value = t;
    this.velocity = 0;
    this.target = t;
    this._sleeping = false;
    this._emit();
    this._sleep();
  }

  addVelocity(v) {
    this.velocity += v;
    this._wake();
  }

  get resting() {
    return this._sleeping;
  }

  _wake() {
    const was = this._sleeping;
    this._sleeping = false;
    active.add(this);
    if (was) ensureLoop();
  }

  update(dt) {
    const steps = Math.max(1, Math.ceil(dt / 0.008)); // 8ms 子步长保证高刚度下稳定
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (f / this.mass) * h;
      this.value += this.velocity * h;
    }
    if (
      Math.abs(this.value - this.target) < this.precision &&
      Math.abs(this.velocity) < this.precision
    ) {
      this.value = this.target;
      this.velocity = 0;
      this._emit();
      this._sleep();
      this.onRest && this.onRest(this.value);
      return;
    }
    this._emit();
  }

  _emit() {
    this.onUpdate && this.onUpdate(this.value, this.velocity);
  }

  _sleep() {
    this._sleeping = true;
    active.delete(this);
    maybeSleep();
  }
}

/**
 * 快捷工厂：绑定一个弹簧到回调。
 * const x = bindSpring(0, cfg, v => ...); x.to(100);
 */
export function bindSpring(initial, cfg, onUpdate) {
  const s = new Spring(initial, cfg);
  s.onUpdate = onUpdate;
  if (initial !== undefined) s.set(initial);
  return s;
}
