/**
 * Fluid — WebGL2 实时流体模拟（stable fluids: 平流/涡度/压力投影）
 * 用作全局动态壁纸：指尖划过即产生彩色流体，玻璃材质实时折射它。
 * 不支持 WebGL2 + float 渲染目标的环境自动降级为 CSS 渐变壁纸。
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 uTexel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vB = vUv - vec2(0.0, uTexel.y);
  vT = vUv + vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = {
  splat: `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uTarget;
uniform float uAspect, uRadius;
uniform vec3 uColor;
uniform vec2 uPoint;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  outColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,

  advection: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uVelocity, uSource;
uniform vec2 uTexel;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * uTexel;
  outColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,

  divergence: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 outColor;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,

  curl: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 outColor;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,

  vorticity: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 outColor;
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  vel = clamp(vel, vec2(-1000.0), vec2(1000.0));
  outColor = vec4(vel, 0.0, 1.0);
}`,

  pressure: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 outColor;
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,

  gradientSubtract: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 outColor;
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  outColor = vec4(velocity, 0.0, 1.0);
}`,

  clear: `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uTexture;
uniform float value;
void main() {
  outColor = texture(uTexture, vUv) * value;
}`,

  display: `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uDye;
uniform float uTime;
void main() {
  // 只输出染料，背景交给 CSS 壁纸（画布以 screen 混合叠在壁纸上）
  vec3 dye = clamp(texture(uDye, vUv).rgb, 0.0, 4.0);
  dye = (1.0 - exp(-dye * 1.55)) * 0.95;
  outColor = vec4(dye, 1.0);
}`,
};

const SIM_RES = 128;
const DYE_RES = 512;
const PRESSURE_ITER = 20;
const CFG = {
  densityDissipation: 2.6,
  velocityDissipation: 0.25,
  pressure: 0.8,
  curl: 26,
  splatRadius: 0.0009,
  splatForce: 2200,
};

export class Fluid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;
    const gl = canvas.getContext('webgl2', {
      alpha: true, depth: false, stencil: false, antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    const extColor = gl.getExtension('EXT_color_buffer_float') ||
      gl.getExtension('EXT_color_buffer_half_float');
    gl.getExtension('OES_texture_float_linear');
    if (!extColor) return;

    this.gl = gl;
    this.halfFloat = gl.HALF_FLOAT;
    this.quad = this._createQuad();
    this.progs = {};
    for (const [name, src] of Object.entries(FRAG)) this.progs[name] = this._program(src);

    this.ok = true;
    this.time = 0;
    this._hue = Math.random();
    this.resize();
  }

  _createQuad() {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    return buf;
  }

  _compile(type, src) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('fluid shader:', gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  _program(fragSrc) {
    const gl = this.gl;
    const p = gl.createProgram();
    gl.attachShader(p, this._compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, this._compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('fluid link:', gl.getProgramInfoLog(p));
    }
    const uniforms = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { prog: p, uniforms, aPos: gl.getAttribLocation(p, 'aPos') };
  }

  _fbo(w, h, internal, format) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, this.halfFloat, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      tex, fbo, w, h, texel: [1 / w, 1 / h],
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        return id;
      },
    };
  }

  _double(w, h, internal, format) {
    return {
      read: this._fbo(w, h, internal, format),
      write: this._fbo(w, h, internal, format),
      swap() { const t = this.read; this.read = this.write; this.write = t; },
    };
  }

  resize() {
    if (!this.ok) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === w && this.canvas.height === h && this.velocity) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.aspect = w / h;

    const simW = Math.round(SIM_RES * Math.max(1, h / w));
    const simH = Math.round(h > w ? SIM_RES : SIM_RES * (h / w));
    const dyeW = Math.round(DYE_RES * Math.max(1, h / w));
    const dyeH = Math.round(h > w ? DYE_RES : DYE_RES * (h / w));

    gl.disable(gl.BLEND);
    this.velocity = this._double(simW, simH, gl.RG16F, gl.RG);
    this.dye = this._double(dyeW, dyeH, gl.RGBA16F, gl.RGBA);
    this.pressure = this._double(simW, simH, gl.R16F, gl.RED);
    this.divergence = this._fbo(simW, simH, gl.R16F, gl.RED);
    this.curlFbo = this._fbo(simW, simH, gl.R16F, gl.RED);
  }

  _blit(target) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  _use(p) {
    const gl = this.gl;
    gl.useProgram(p.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(p.aPos);
    gl.vertexAttribPointer(p.aPos, 2, gl.FLOAT, false, 0, 0);
    return p;
  }

  _nextColor() {
    this._hue = (this._hue + 0.17) % 1;
    return hsv(this._hue, 0.92, 1).map((c) => c * 0.34);
  }

  /** 取一支新色（一次手势内共用，避免彩虹噪点） */
  nextColor() {
    // 只在高饱和的紫/青/粉/蓝之间取色，避免黄绿色发脏
    const palette = [0.74, 0.55, 0.92, 0.48, 0.62];
    this._pi = ((this._pi ?? -1) + 1) % palette.length;
    return hsv(palette[this._pi], 0.9, 1).map((c) => c * 0.34);
  }

  /** x,y ∈ [0,1]（左上原点），dx,dy 为位移强度 */
  splat(x, y, dx, dy, color) {
    if (!this.ok) return;
    const gl = this.gl;
    x = clamp(x, 0.001, 0.999);
    y = clamp(1 - y, 0.001, 0.999);

    const p = this._use(this.progs.splat);
    gl.uniform1i(p.uniforms.uTarget, this.velocity.read.attach(0));
    gl.uniform1f(p.uniforms.uAspect, this.aspect);
    gl.uniform2f(p.uniforms.uPoint, x, y);
    gl.uniform3f(p.uniforms.uColor, dx, dy, 0);
    gl.uniform1f(p.uniforms.uRadius, correctRadius(CFG.splatRadius, this.aspect));
    this._blit(this.velocity.write);
    this.velocity.swap();

    if (!color) color = this._nextColor();
    gl.uniform1i(p.uniforms.uTarget, this.dye.read.attach(0));
    gl.uniform3f(p.uniforms.uColor, color[0], color[1], color[2]);
    this._blit(this.dye.write);
    this.dye.swap();
  }

  step(dt) {
    if (!this.ok) return;
    const gl = this.gl;
    dt = Math.min(dt, 0.033);
    this.time += dt;

    gl.disable(gl.BLEND);

    // 涡度增强
    let p = this._use(this.progs.curl);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
    this._blit(this.curlFbo);

    p = this._use(this.progs.vorticity);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.uniforms.uCurl, this.curlFbo.attach(1));
    gl.uniform1f(p.uniforms.curl, CFG.curl);
    gl.uniform1f(p.uniforms.dt, dt);
    this._blit(this.velocity.write);
    this.velocity.swap();

    // 压力投影
    p = this._use(this.progs.divergence);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
    this._blit(this.divergence);

    p = this._use(this.progs.clear);
    gl.uniform2f(p.uniforms.uTexel, ...this.pressure.read.texel);
    gl.uniform1i(p.uniforms.uTexture, this.pressure.read.attach(0));
    gl.uniform1f(p.uniforms.value, CFG.pressure);
    this._blit(this.pressure.write);
    this.pressure.swap();

    p = this._use(this.progs.pressure);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1i(p.uniforms.uDivergence, this.divergence.attach(0));
    for (let i = 0; i < PRESSURE_ITER; i++) {
      gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(1));
      this._blit(this.pressure.write);
      this.pressure.swap();
    }

    p = this._use(this.progs.gradientSubtract);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(1));
    this._blit(this.velocity.write);
    this.velocity.swap();

    // 平流
    p = this._use(this.progs.advection);
    gl.uniform2f(p.uniforms.uTexel, ...this.velocity.read.texel);
    gl.uniform1f(p.uniforms.dt, dt);
    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.uniforms.uSource, this.velocity.read.attach(0));
    gl.uniform1f(p.uniforms.dissipation, CFG.velocityDissipation);
    this._blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(p.uniforms.uSource, this.dye.read.attach(1));
    gl.uniform1f(p.uniforms.dissipation, CFG.densityDissipation);
    this._blit(this.dye.write);
    this.dye.swap();

    // 上屏（画布透明，染料以 screen 模式叠在 CSS 壁纸上）
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    p = this._use(this.progs.display);
    gl.uniform2f(p.uniforms.uTexel, ...this.dye.read.texel);
    gl.uniform1i(p.uniforms.uDye, this.dye.read.attach(0));
    gl.uniform1f(p.uniforms.uTime, this.time);
    this._blit(null);
  }
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function correctRadius(r, aspect) {
  return aspect > 1 ? r * aspect : r;
}
function hsv(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}
