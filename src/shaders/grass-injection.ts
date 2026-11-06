/**
 * 草皮 GLSL 注入片段 —— 通过 MeshStandardMaterial.onBeforeCompile 注入，
 * 保留 PBR 光照的同时叠加程序化草皮纹理。
 */

/** 噪声函数族：hash → 值噪声 → fbm（多倍频叠加） */
export const NOISE_GLSL = `
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}
`;

/** 球场半长（与 Scene.tsx 的 PITCH_LENGTH 同步） */
const PITCH_HALF_LENGTH = 5.25;

/** fragment 公共区注入：uniforms + 噪声函数 */
export const FRAG_COMMON_INJECT = `
uniform float uStripeEnabled;
uniform float uStripeFreq;
uniform float uStripeStrength;
uniform float uNoiseStrength;
uniform float uBumpStrength;
uniform float uYellowing;
uniform float uEdgeStrength;
uniform float uBladeStrength;
uniform vec3 uColorCenter;
uniform vec3 uColorEdge;
varying vec3 vWorldPos;

${NOISE_GLSL}
`;

/** 顶点着色器注入：声明世界坐标 varying */
export const VERT_COMMON_INJECT = `
varying vec3 vWorldPos;
`;

/** 侧面（土壤剖面）fragment 公共区注入 */
export const SOIL_COMMON_INJECT = `
uniform vec3 uSoilColor;
uniform vec3 uRootColor;
varying vec3 vWorldPos;

${NOISE_GLSL}
`;

/** 侧面 color_fragment 注入：顶部草根绿渐变 + 双层土壤噪点 */
export const SOIL_COLOR_INJECT = `
#include <color_fragment>

vec2 wp = vWorldPos.xz;

// 顶部草根绿 → 底部土色渐变（世界 y，顶面 y=0）
float rootMix = smoothstep(-0.06, 0.0, vWorldPos.y);
vec3 soilColor = mix(uSoilColor, uRootColor, rootMix);

// 土壤颗粒噪点（双层高频 fbm）
float g1 = fbm(wp * 40.0);
float g2 = fbm(wp * 140.0 + 7.3);
soilColor *= 0.92 + g1 * 0.15;
soilColor *= 0.96 + g2 * 0.08;

diffuseColor.rgb = soilColor;
`;

/** 侧面 normal_fragment_maps 注入：土壤颗粒法线扰动 */
export const SOIL_NORMAL_INJECT = `
#include <normal_fragment_maps>

vec2 e = vec2(0.01, 0.0);
float n_x = fbm(wp * 90.0 + e.xy) - fbm(wp * 90.0 - e.xy);
float n_z = fbm(wp * 90.0 + e.yx) - fbm(wp * 90.0 - e.yx);
vec3 bump = normalize(vec3(-n_x, 1.0, -n_z));
normal = normalize(mix(normal, bump, 0.3));
`;

/** 顶点着色器注入：赋值世界坐标（在 project_vertex 之后，transformed 为最终顶点位置） */
export const VERT_WORLDPOS_INJECT = `
#include <project_vertex>
vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

/** color_fragment 注入：多频率噪声着色（核心），stripeMod 为条纹调制系数（v1=0.5 / v2=1.5） */
export function buildColorInject(stripeMod: number): string {
    return `
#include <color_fragment>

vec2 wp = vWorldPos.xz;

// ===== 中间浅、四周深的径向渐变（参考真实球场观感）=====
float edgeRaw = length(wp) / ${PITCH_HALF_LENGTH};
float edge = smoothstep(0.45, 1.0, edgeRaw) * uEdgeStrength;
vec3 baseColor = mix(uColorCenter, uColorEdge, edge);

// ===== 修剪条纹（硬切 step，沿球场短边方向交替 = 俯视上下向，方便判越位）=====
float stripe = uStripeEnabled > 0.5 ? step(0.5, fract(wp.x * uStripeFreq)) : 0.5;
baseColor *= 1.0 - uStripeStrength * uStripeEnabled * (stripe - 0.5) * ${stripeMod};

// ===== 方向性草叶纹理（各向异性噪声：X 高频=叶缝密集，Y 低频=叶片成排）=====
vec2 bladeUV = vec2(wp.x * 180.0, wp.y * 25.0);
float blade = step(0.45, fbm(bladeUV));
baseColor *= 1.0 - uBladeStrength * 0.5 + uBladeStrength * blade;

// ===== 多频率噪声：低频斑驳 + 中频细节 + 高频草叶 + 微观颗粒 =====
float n_low = fbm(wp * 0.8);
float n_mid = fbm(wp * 6.0);
float n_high = fbm(wp * 30.0);
float n_micro = fbm(wp * 120.0);

baseColor *= 1.0 + (n_low - 0.5) * 0.3 * uNoiseStrength;
baseColor *= 1.0 + (n_mid - 0.5) * 0.2 * uNoiseStrength;
baseColor += (n_high - 0.5) * 0.08 * uNoiseStrength;
baseColor += (n_micro - 0.5) * 0.04 * uNoiseStrength;

// 淡淡的枯黄/枯萎色相变化
baseColor = mix(baseColor, vec3(0.5, 0.45, 0.15), smoothstep(0.55, 0.8, n_mid) * uYellowing);

diffuseColor.rgb = baseColor;
`;
}

/** normal_fragment_maps 注入：v1 各向同性法线扰动（版本1 保存时的效果） */
export const FRAG_NORMAL_INJECT_V1 = `
#include <normal_fragment_maps>

vec2 e = vec2(0.01, 0.0);
float n_x = fbm(wp * 60.0 + e.xy) - fbm(wp * 60.0 - e.xy);
float n_z = fbm(wp * 60.0 + e.yx) - fbm(wp * 60.0 - e.yx);
vec3 bump = normalize(vec3(-n_x, 1.0, -n_z));
normal = normalize(mix(normal, bump, 0.4 * uBumpStrength));
`;

/** normal_fragment_maps 注入：v2 方向性法线扰动（草叶竖立感：叶长方向梯度大） */
export const FRAG_NORMAL_INJECT_V2 = `
#include <normal_fragment_maps>

vec2 e = vec2(0.003, 0.0);
float h0 = fbm(vec2(wp.x * 120.0, wp.y * 20.0));
float h1 = fbm(vec2((wp.x + e.x) * 120.0, wp.y * 20.0));
float h2 = fbm(vec2(wp.x * 120.0, (wp.y + e.y) * 20.0));
vec3 bump = normalize(vec3((h0 - h1) * 8.0, 1.0, (h0 - h2) * 1.5));
normal = normalize(mix(normal, bump, 0.6 * uBumpStrength));
`;
