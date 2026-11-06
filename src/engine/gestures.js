/**
 * 手势识别器 — Pointer Events 统一触控/鼠标
 * tap / press(按压反馈) / long-press / pan(拖拽含速度) ，速度用 100ms 滑窗估计。
 */

export class VelocityTracker {
  constructor() {
    this.samples = [];
  }
  add(x, y, t) {
    this.samples.push({ x, y, t });
    if (this.samples.length > 14) this.samples.shift();
  }
  clear() {
    this.samples.length = 0;
  }
  /** px/s */
  get() {
    const s = this.samples;
    if (s.length < 2) return { x: 0, y: 0 };
    const last = s[s.length - 1];
    const cutoff = last.t - 100;
    let first = s[0];
    for (let i = s.length - 2; i >= 0; i--) {
      if (s[i].t <= cutoff) { first = s[i]; break; }
      first = s[i];
    }
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0) return { x: 0, y: 0 };
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
  }
}

/** iOS 风格橡皮筋：越拉越紧 */
export function rubber(offset, dim, c = 0.55) {
  const sign = Math.sign(offset) || 1;
  const x = Math.abs(offset);
  return (sign * (1 - 1 / ((x * c) / dim + 1))) * dim;
}

/**
 * 绑定手势。
 * capture=false 时不劫持 pointer capture（用于嵌套容器，如主页图标 + 翻页）。
 */
export function gestures(el, cfg = {}) {
  const {
    onTap,
    onPressStart,
    onPressEnd,
    onLongPress,
    longPressDelay = 450,
    onPanStart,
    onPanMove,
    onPanEnd,
    slop = 8,
    capture = true,
  } = cfg;

  let ptr = null;
  let pressTimer = 0;
  const tracker = new VelocityTracker();

  const local = (e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  const ctx = () => {
    const v = tracker.get();
    return {
      ...ptr,
      vx: v.x,
      vy: v.y,
      event: ptr?._lastEvent,
      data: ptr?.data ?? {},
    };
  };

  const clearPressTimer = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = 0; }
  };

  const onDown = (e) => {
    if (ptr) return;
    const p = local(e);
    ptr = {
      id: e.pointerId,
      sx: p.x, sy: p.y,
      x: p.x, y: p.y, w: p.w, h: p.h,
      dx: 0, dy: 0,
      moved: false,
      panning: false,
      longFired: false,
      data: {},
      _lastEvent: e,
    };
    tracker.clear();
    tracker.add(p.x, p.y, e.timeStamp);
    if (capture) {
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    }
    onPressStart && onPressStart(ctx());
    if (onLongPress) {
      pressTimer = setTimeout(() => {
        if (ptr && !ptr.moved && !ptr.panning) {
          ptr.longFired = true;
          onLongPress(ctx());
        }
      }, longPressDelay);
    }
  };

  const onMove = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = local(e);
    tracker.add(p.x, p.y, e.timeStamp);
    const dx = p.x - ptr.sx;
    const dy = p.y - ptr.sy;
    ptr._lastEvent = e;

    if (!ptr.panning && Math.hypot(dx, dy) > slop) {
      ptr.moved = true;
      clearPressTimer();
      if (ptr.longFired) return;
      ptr.panning = true;
      ptr.x = p.x; ptr.y = p.y; ptr.dx = dx; ptr.dy = dy;
      onPanStart && onPanStart(ctx());
      return;
    }
    if (ptr.panning && !ptr.longFired) {
      ptr.x = p.x; ptr.y = p.y; ptr.dx = dx; ptr.dy = dy;
      onPanMove && onPanMove(ctx());
    }
  };

  const onUp = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    clearPressTimer();
    const c = ctx();
    if (ptr.panning) {
      onPanEnd && onPanEnd(c);
    } else if (!ptr.moved && !ptr.longFired) {
      onTap && onTap(c);
    }
    onPressEnd && onPressEnd(c);
    ptr = null;
  };

  el.addEventListener('pointerdown', onDown);
  if (capture) {
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  } else {
    // 嵌套模式：移动/抬起监听挂在 window，避免与父容器手势争抢 capture
    const winMove = (e) => onMove(e);
    const winUp = (e) => onUp(e);
    window.addEventListener('pointermove', winMove, { passive: true });
    window.addEventListener('pointerup', winUp);
    window.addEventListener('pointercancel', winUp);
    return {
      destroy() {
        el.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', winMove);
        window.removeEventListener('pointerup', winUp);
        window.removeEventListener('pointercancel', winUp);
        clearPressTimer();
      },
    };
  }

  return {
    destroy() {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      clearPressTimer();
    },
  };
}
