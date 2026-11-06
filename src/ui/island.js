/** 灵动岛 — 弹簧驱动的液态形变 + 音频频谱呼吸 */
import { Spring } from '../engine/spring.js';
import { glassify } from '../engine/glass.js';
import { gestures } from '../engine/gestures.js';
import { tween } from '../engine/tween.js';
import { ticker } from '../engine/ticker.js';
import { state, on } from './state.js';
import { spectrum, isPlaying } from './audio.js';
import { glyphs } from './icons.js';

let island, mini, bars = [];
let wSpring, hSpring;
let expanded = false;
let barSprings = [];

export function initIsland(openMusic) {
  island = document.getElementById('island');
  mini = document.getElementById('island-mini');
  glassify(island, { blur: 16, light: 0.9 });

  const W = () => document.getElementById('screen').getBoundingClientRect().width;

  wSpring = new Spring(122, { stiffness: 300, damping: 22 });
  hSpring = new Spring(36, { stiffness: 300, damping: 22 });
  const apply = () => {
    island.style.width = `${wSpring.value.toFixed(2)}px`;
    island.style.height = `${hSpring.value.toFixed(2)}px`;
    island.style.borderRadius = `${(hSpring.value / 2).toFixed(2)}px`;
  };
  wSpring.onUpdate = apply;
  hSpring.onUpdate = apply;

  // 频谱条
  for (let i = 0; i < 5; i++) {
    const b = document.createElement('span');
    mini.querySelector('.island-bars').appendChild(b);
    bars.push(b);
    barSprings.push(new Spring(0.2, { stiffness: 260, damping: 16 }));
  }

  ticker.add((dt, t) => {
    const spec = spectrum(5);
    for (let i = 0; i < 5; i++) {
      const target = state.playing
        ? Math.max(0.12, spec[i] * (1 + i * 0.12))
        : 0.14 + Math.sin(t * 2 + i * 1.3) * 0.06;
      barSprings[i].to(target);
      bars[i].style.transform = `scaleY(${barSprings[i].value.toFixed(3)})`;
    }
  });

  gestures(island, {
    onTap: () => {
      if (state.appOpen) return;
      expanded ? collapse() : expand();
    },
    onLongPress: () => {
      island.animate(
        [{ filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }],
        { duration: 400, easing: 'ease-out' }
      );
    },
  });

  function expand() {
    expanded = true;
    state.islandExpanded = true;
    wSpring.to(W() - 28);
    hSpring.to(132);
    island.classList.add('expanded');
    setTimeout(() => mini.classList.add('show'), 90);
  }
  function collapse() {
    expanded = false;
    state.islandExpanded = false;
    wSpring.to(122);
    hSpring.to(36);
    mini.classList.remove('show');
    island.classList.remove('expanded');
  }
  island._collapse = collapse;

  on('app-open', collapse);
  on('app-close', () => {});
}

export function collapseIsland() {
  island?._collapse?.();
}
