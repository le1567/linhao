/**
 * LGTicker — 引擎心跳
 * 单一 rAF 循环驱动所有弹簧 / 补间 / 自定义更新，避免多处 rAF 互相抢帧。
 */
export class Ticker {
  constructor() {
    this.subs = new Set();
    this._running = false;
    this._last = 0;
    this._frame = this._frame.bind(this);
  }

  /** 订阅每帧回调 fn(dt, t)，dt 单位秒（已做钳制防卡顿跳变）。返回退订函数。 */
  add(fn) {
    this.subs.add(fn);
    this.start();
    return () => this.remove(fn);
  }

  remove(fn) {
    this.subs.delete(fn);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    requestAnimationFrame(this._frame);
  }

  stop() {
    this._running = false;
  }

  _frame(t) {
    if (!this._running) return;
    const dt = Math.min((t - this._last) / 1000, 1 / 12); // 钳制，避免切后台后弹簧爆炸
    this._last = t;
    for (const fn of [...this.subs]) fn(dt, t / 1000);
    if (this.subs.size) requestAnimationFrame(this._frame);
    else this._running = false;
  }
}

export const ticker = new Ticker();
