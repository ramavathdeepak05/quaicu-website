// Post pipeline: HDR scene (4x MSAA) -> bloom mip chain + anamorphic streak
// -> half-res bokeh depth of field -> ACES tone map, chromatic aberration,
// vignette, film grain. Written as plain shader passes so every frame is
// deterministic and cheap enough for software WebGL.

import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const DOWN13 = /* glsl */ `
vec3 down13(sampler2D t, vec2 uv, vec2 px) {
  vec3 a = texture2D(t, uv + px * vec2(-2.0, -2.0)).rgb;
  vec3 b = texture2D(t, uv + px * vec2( 0.0, -2.0)).rgb;
  vec3 c = texture2D(t, uv + px * vec2( 2.0, -2.0)).rgb;
  vec3 d = texture2D(t, uv + px * vec2(-2.0,  0.0)).rgb;
  vec3 e = texture2D(t, uv).rgb;
  vec3 f = texture2D(t, uv + px * vec2( 2.0,  0.0)).rgb;
  vec3 g = texture2D(t, uv + px * vec2(-2.0,  2.0)).rgb;
  vec3 h = texture2D(t, uv + px * vec2( 0.0,  2.0)).rgb;
  vec3 i = texture2D(t, uv + px * vec2( 2.0,  2.0)).rgb;
  vec3 j = texture2D(t, uv + px * vec2(-1.0, -1.0)).rgb;
  vec3 k = texture2D(t, uv + px * vec2( 1.0, -1.0)).rgb;
  vec3 l = texture2D(t, uv + px * vec2(-1.0,  1.0)).rgb;
  vec3 m = texture2D(t, uv + px * vec2( 1.0,  1.0)).rgb;
  vec3 o = e * 0.125;
  o += (a + c + g + i) * 0.03125;
  o += (b + d + f + h) * 0.0625;
  o += (j + k + l + m) * 0.125;
  return o;
}
`;

function mat(frag, uniforms, extra = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
    ...extra,
  });
}

export class Post {
  constructor(renderer, W, H) {
    this.r = renderer;
    this.W = W;
    this.H = H;
    const hf = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      generateMipmaps: false,
    };
    this.depthTex = new THREE.DepthTexture(W, H, THREE.FloatType);
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, {
      type: THREE.HalfFloatType,
      samples: 4,
      depthBuffer: true,
      depthTexture: this.depthTex,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.mips = [];
    let w = W >> 1,
      h = H >> 1;
    for (let i = 0; i < 7; i++) {
      this.mips.push(new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), hf));
      w >>= 1;
      h >>= 1;
    }
    this.streakA = new THREE.WebGLRenderTarget(W >> 2, H >> 3, hf);
    this.streakB = new THREE.WebGLRenderTarget(W >> 2, H >> 3, hf);
    this.dofRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, hf);
    this.quad = new FullScreenQuad(null);
    this.res = H / 1080; // pixel scale relative to 1080p

    this.mPre = mat(
      /* glsl */ `
      uniform sampler2D tSrc; uniform vec2 px; uniform float threshold; uniform float knee;
      varying vec2 vUv;
      ${DOWN13}
      void main() {
        vec3 c = min(down13(tSrc, vUv, px), vec3(60.0));
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - threshold + knee, 0.0, 2.0 * knee);
        rq = rq * rq / (4.0 * knee + 1e-4);
        float w = max(rq, br - threshold) / max(br, 1e-4);
        gl_FragColor = vec4(c * w, 1.0);
      }`,
      { tSrc: { value: null }, px: { value: new THREE.Vector2() }, threshold: { value: 1.0 }, knee: { value: 0.5 } }
    );
    this.mDown = mat(
      /* glsl */ `
      uniform sampler2D tSrc; uniform vec2 px; varying vec2 vUv;
      ${DOWN13}
      void main() { gl_FragColor = vec4(down13(tSrc, vUv, px), 1.0); }`,
      { tSrc: { value: null }, px: { value: new THREE.Vector2() } }
    );
    this.mUp = mat(
      /* glsl */ `
      uniform sampler2D tSrc; uniform vec2 px; uniform float scatter; varying vec2 vUv;
      void main() {
        vec3 s = texture2D(tSrc, vUv + px * vec2(-1.0, -1.0)).rgb;
        s += texture2D(tSrc, vUv + px * vec2( 0.0, -1.0)).rgb * 2.0;
        s += texture2D(tSrc, vUv + px * vec2( 1.0, -1.0)).rgb;
        s += texture2D(tSrc, vUv + px * vec2(-1.0,  0.0)).rgb * 2.0;
        s += texture2D(tSrc, vUv).rgb * 4.0;
        s += texture2D(tSrc, vUv + px * vec2( 1.0,  0.0)).rgb * 2.0;
        s += texture2D(tSrc, vUv + px * vec2(-1.0,  1.0)).rgb;
        s += texture2D(tSrc, vUv + px * vec2( 0.0,  1.0)).rgb * 2.0;
        s += texture2D(tSrc, vUv + px * vec2( 1.0,  1.0)).rgb;
        gl_FragColor = vec4(s / 16.0 * scatter, 1.0);
      }`,
      { tSrc: { value: null }, px: { value: new THREE.Vector2() }, scatter: { value: 1.0 } },
      { blending: THREE.AdditiveBlending, transparent: true }
    );
    this.mStreakIn = mat(
      /* glsl */ `
      uniform sampler2D tSrc; uniform vec2 px; uniform float threshold; varying vec2 vUv;
      void main() {
        vec3 c = vec3(0.0);
        for (int i = -3; i <= 3; i++) c += texture2D(tSrc, vUv + vec2(0.0, float(i) * px.y)).rgb;
        c /= 7.0;
        float br = max(c.r, max(c.g, c.b));
        c *= smoothstep(threshold, threshold * 2.5, br);
        gl_FragColor = vec4(c, 1.0);
      }`,
      { tSrc: { value: null }, px: { value: new THREE.Vector2() }, threshold: { value: 1.5 } }
    );
    this.mStreak = mat(
      /* glsl */ `
      uniform sampler2D tSrc; uniform vec2 px; uniform float stepPx; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tSrc, vUv).rgb * 0.24;
        float w = 0.24;
        for (int i = 1; i <= 6; i++) {
          float f = float(i);
          float k = exp(-f * f / 14.0);
          c += texture2D(tSrc, vUv + vec2(f * stepPx * px.x, 0.0)).rgb * k;
          c += texture2D(tSrc, vUv - vec2(f * stepPx * px.x, 0.0)).rgb * k;
          w += 2.0 * k;
        }
        gl_FragColor = vec4(c / w, 1.0);
      }`,
      { tSrc: { value: null }, px: { value: new THREE.Vector2() }, stepPx: { value: 1.0 } }
    );

    const DEPTH = /* glsl */ `
      uniform sampler2D tDepth; uniform float cNear; uniform float cFar;
      uniform float focus; uniform float cocScale; uniform float maxCoc;
      float linDepth(vec2 uv) {
        float d = texture2D(tDepth, uv).x;
        float z = d * 2.0 - 1.0;
        return 2.0 * cNear * cFar / (cFar + cNear - z * (cFar - cNear));
      }
      float coc(float z) { return clamp(cocScale * abs(1.0 / focus - 1.0 / z), 0.0, maxCoc); }
    `;
    this.mDof = mat(
      /* glsl */ `
      uniform sampler2D tColor; uniform vec2 px; varying vec2 vUv;
      ${DEPTH}
      const float GA = 2.39996323;
      void main() {
        float cz = linDepth(vUv);
        float cs = coc(cz);
        vec3 col = texture2D(tColor, vUv).rgb;
        float tot = 1.0;
        float radius = 0.9;
        float ang = 0.0;
        for (int i = 0; i < 140; i++) {
          if (radius >= maxCoc) break;
          vec2 uv = vUv + vec2(cos(ang), sin(ang)) * px * radius;
          vec3 sc = min(texture2D(tColor, uv).rgb, vec3(40.0));
          float sz = linDepth(uv);
          float ss = coc(sz);
          if (sz > cz) ss = clamp(ss, 0.0, cs * 2.0);
          float m = smoothstep(radius - 0.5, radius + 0.5, ss);
          col += mix(col / tot, sc, m);
          tot += 1.0;
          ang += GA;
          radius += 1.7 / radius * (maxCoc / 14.0);
        }
        gl_FragColor = vec4(col / tot, cs);
      }`,
      {
        tColor: { value: null },
        tDepth: { value: this.depthTex },
        px: { value: new THREE.Vector2(1 / W, 1 / H) },
        cNear: { value: 0.1 },
        cFar: { value: 100 },
        focus: { value: 5 },
        cocScale: { value: 0 },
        maxCoc: { value: 12 },
      }
    );
    this.mFinal = mat(
      /* glsl */ `
      uniform sampler2D tColor; uniform sampler2D tDof; uniform sampler2D tBloom; uniform sampler2D tStreak;
      uniform vec2 px; uniform float useDof;
      uniform float bloomStrength; uniform float streakStrength; uniform vec3 streakTint;
      uniform float exposure; uniform float ca; uniform float vignette; uniform float grain; uniform float frame;
      uniform float contrast; uniform float saturation; uniform vec3 lift; uniform vec3 fadeColor; uniform float fade;
      varying vec2 vUv;
      ${DEPTH}
      vec3 aces(vec3 x) {
        const mat3 ACESIn = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
        const mat3 ACESOut = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
        x = ACESIn * x;
        vec3 a = x * (x + 0.0245786) - 0.000090537;
        vec3 b = x * (0.983729 * x + 0.4329510) + 0.238081;
        return clamp(ACESOut * (a / b), 0.0, 1.0);
      }
      vec3 toSRGB(vec3 c) {
        return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
      }
      float hash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
      }
      void main() {
        vec2 d = vUv - 0.5;
        vec2 off = d * ca * dot(d, d) * 4.0;
        vec3 sharp;
        sharp.r = texture2D(tColor, vUv - off).r;
        sharp.g = texture2D(tColor, vUv).g;
        sharp.b = texture2D(tColor, vUv + off).b;
        vec3 c = sharp;
        if (useDof > 0.5) {
          vec4 dof = texture2D(tDof, vUv);
          float cs = coc(linDepth(vUv));
          c = mix(sharp, dof.rgb, smoothstep(0.6, 2.2, max(cs, dof.a * 0.85)));
        }
        c += texture2D(tBloom, vUv).rgb * bloomStrength;
        c += texture2D(tStreak, vUv).rgb * streakStrength * streakTint;
        c *= exposure;
        c = aces(c);
        // grade in display-ish space
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, saturation);
        c = clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
        c = c + lift * (1.0 - c);
        float v = smoothstep(0.95, 0.25, length(d * vec2(1.0, 0.82)));
        c *= mix(1.0, v, vignette);
        c = mix(c, fadeColor, fade);
        c = toSRGB(c);
        float n = hash(vec3(gl_FragCoord.xy, frame * 17.0)) + hash(vec3(gl_FragCoord.yx * 1.37, frame * 7.0 + 3.0)) - 1.0;
        float lum = dot(c, vec3(0.333));
        c += n * grain * (0.35 + 0.65 * (1.0 - abs(lum - 0.45) * 1.6));
        gl_FragColor = vec4(c, 1.0);
      }`,
      {
        tColor: { value: null },
        tDof: { value: null },
        tBloom: { value: null },
        tStreak: { value: null },
        tDepth: { value: this.depthTex },
        px: { value: new THREE.Vector2(1 / W, 1 / H) },
        useDof: { value: 0 },
        cNear: { value: 0.1 },
        cFar: { value: 100 },
        focus: { value: 5 },
        cocScale: { value: 0 },
        maxCoc: { value: 12 },
        bloomStrength: { value: 0.35 },
        streakStrength: { value: 0.0 },
        streakTint: { value: new THREE.Color(0.7, 1.0, 0.85) },
        exposure: { value: 1.0 },
        ca: { value: 0.002 },
        vignette: { value: 0.35 },
        grain: { value: 0.022 },
        frame: { value: 0 },
        contrast: { value: 1.04 },
        saturation: { value: 1.0 },
        lift: { value: new THREE.Color(0, 0, 0) },
        fadeColor: { value: new THREE.Color(0, 0, 0) },
        fade: { value: 0 },
      }
    );
  }

  pass(material, target) {
    this.quad.material = material;
    this.r.setRenderTarget(target);
    this.quad.render(this.r);
  }

  // look: { exposure, bloom, bloomThreshold, streak, focus, aperture, maxCoc, ca, vignette, grain, fade, contrast, saturation, lift }
  render(scene, camera, look, frame) {
    const r = this.r;
    const s = this.res;
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);
    const src = this.sceneRT.texture;

    // bloom chain
    const m0 = this.mips[0];
    this.mPre.uniforms.tSrc.value = src;
    this.mPre.uniforms.px.value.set(1 / this.W, 1 / this.H);
    this.mPre.uniforms.threshold.value = look.bloomThreshold ?? 1.0;
    this.mPre.uniforms.knee.value = (look.bloomThreshold ?? 1.0) * 0.6;
    this.pass(this.mPre, m0);
    for (let i = 1; i < this.mips.length; i++) {
      const a = this.mips[i - 1];
      this.mDown.uniforms.tSrc.value = a.texture;
      this.mDown.uniforms.px.value.set(1 / a.width, 1 / a.height);
      this.pass(this.mDown, this.mips[i]);
    }
    r.autoClear = false;
    for (let i = this.mips.length - 1; i > 0; i--) {
      const a = this.mips[i];
      this.mUp.uniforms.tSrc.value = a.texture;
      this.mUp.uniforms.px.value.set(1 / a.width, 1 / a.height);
      this.mUp.uniforms.scatter.value = look.bloomScatter ?? 0.85;
      this.pass(this.mUp, this.mips[i - 1]);
    }
    r.autoClear = true;

    // anamorphic streak
    const streak = look.streak ?? 0;
    if (streak > 0) {
      this.mStreakIn.uniforms.tSrc.value = m0.texture;
      this.mStreakIn.uniforms.px.value.set(1 / m0.width, 1 / m0.height);
      this.mStreakIn.uniforms.threshold.value = look.streakThreshold ?? 1.2;
      this.pass(this.mStreakIn, this.streakA);
      let a = this.streakA,
        b = this.streakB;
      for (const st of [1, 3, 8, 20]) {
        this.mStreak.uniforms.tSrc.value = a.texture;
        this.mStreak.uniforms.px.value.set(1 / a.width, 1 / a.height);
        this.mStreak.uniforms.stepPx.value = st;
        this.pass(this.mStreak, b);
        [a, b] = [b, a];
      }
      this.streakOut = a;
    }

    // depth of field
    const useDof = (look.aperture ?? 0) > 0;
    const setDepth = (u) => {
      u.cNear.value = camera.near;
      u.cFar.value = camera.far;
      u.focus.value = look.focus ?? 5;
      u.cocScale.value = (look.aperture ?? 0) * s;
      u.maxCoc.value = (look.maxCoc ?? 14) * s;
    };
    if (useDof) {
      this.mDof.uniforms.tColor.value = src;
      setDepth(this.mDof.uniforms);
      this.pass(this.mDof, this.dofRT);
    }

    const u = this.mFinal.uniforms;
    setDepth(u);
    u.tColor.value = src;
    u.tDof.value = this.dofRT.texture;
    u.useDof.value = useDof ? 1 : 0;
    u.tBloom.value = m0.texture;
    u.tStreak.value = streak > 0 ? this.streakOut.texture : this.streakA.texture;
    u.bloomStrength.value = look.bloom ?? 0.35;
    u.streakStrength.value = streak;
    u.exposure.value = look.exposure ?? 1;
    u.ca.value = look.ca ?? 0.002;
    u.vignette.value = look.vignette ?? 0.35;
    u.grain.value = look.grain ?? 0.022;
    u.frame.value = frame;
    u.contrast.value = look.contrast ?? 1.04;
    u.saturation.value = look.saturation ?? 1.0;
    u.lift.value.setRGB(...(look.lift || [0, 0, 0]));
    u.fadeColor.value.setRGB(...(look.fadeColor || [0, 0, 0]));
    u.fade.value = look.fade ?? 0;
    this.pass(this.mFinal, null);
  }
}
