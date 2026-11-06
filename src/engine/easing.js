/** 缓动库 — 自实现 cubic-bezier 求解器（牛顿迭代 + 二分兜底），与 CSS 缓动语义一致。 */

function bezier(mX1, mY1, mX2, mY2) {
  if (mX1 === mY1 && mX2 === mY2) return (t) => t;
  const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
  const B = (a1, a2) => 3 * a2 - 6 * a1;
  const C = (a1) => 3 * a1;
  const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);

  const solveX = (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const s = slope(t, mX1, mX2);
      if (s === 0) break;
      t -= (calc(t, mX1, mX2) - x) / s;
    }
    if (Math.abs(calc(t, mX1, mX2) - x) < 1e-6) return t;
    let lo = 0, hi = 1;
    t = x;
    while (Math.abs(calc(t, mX1, mX2) - x) > 1e-6) {
      if (calc(t, mX1, mX2) > x) hi = t; else lo = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : calc(solveX(x), mY1, mY2));
}

export const easing = {
  linear: (t) => t,
  easeOut: bezier(0, 0, 0.58, 1),
  easeInOut: bezier(0.42, 0, 0.58, 1),
  /** iOS 默认动画曲线 (cubic-bezier(0.25,0.1,0.25,1)) */
  ios: bezier(0.25, 0.1, 0.25, 1),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

export { bezier as cubicBezier };
