/** 全局共享状态 + 微型事件总线 */
export const state = {
  unlocked: false,
  jiggle: false,
  appOpen: null, // { id, iconEl }
  playing: false,
  ccOpen: false,
  islandExpanded: false,
};

export const bus = new EventTarget();

export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on(type, fn) {
  bus.addEventListener(type, (e) => fn(e.detail));
}
