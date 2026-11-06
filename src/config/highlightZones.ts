import { PITCH_LENGTH, PITCH_WIDTH } from './pitchConfig';

/** 区域高亮状态：关闭 / 常亮 / 闪动（闪两下后常亮） */
export type ZoneState = 'off' | 'solid' | 'flash';

export interface HighlightZone {
    id: string;
    name: string;
    group: '横向' | '纵向';
    /** 矩形范围 [x1, z1, x2, z2]（世界坐标） */
    bounds: [number, number, number, number];
}

const L = PITCH_LENGTH / 2; // 5.25 半长
const W = PITCH_WIDTH / 2; // 3.4 半宽
const zStep = PITCH_WIDTH / 5; // 横向五等分
const xStep = PITCH_LENGTH / 3; // 纵向三等分

/**
 * 8 块预置高亮区域：
 * - 横向五等分（沿长边延伸，按 z 分段）：左边路/左翼路/中路/右翼路/右边路（+z 侧为左）
 * - 纵向三等分（沿短边延伸，按 x 分段）：后场/中场/前场（默认进攻方向 +x）
 */
export const HIGHLIGHT_ZONES: HighlightZone[] = [
    // 横向条带
    { id: 'h-lw', name: '左边路', group: '横向', bounds: [-L, W - zStep, L, W] },
    { id: 'h-lc', name: '左翼路', group: '横向', bounds: [-L, W - 2 * zStep, L, W - zStep] },
    { id: 'h-mc', name: '中路', group: '横向', bounds: [-L, -zStep / 2, L, zStep / 2] },
    { id: 'h-rc', name: '右翼路', group: '横向', bounds: [-L, -W + zStep, L, -W + 2 * zStep] },
    { id: 'h-rw', name: '右边路', group: '横向', bounds: [-L, -W, L, -W + zStep] },
    // 纵向块
    { id: 'v-back', name: '后场', group: '纵向', bounds: [-L, -W, -L + xStep, W] },
    { id: 'v-mid', name: '中场', group: '纵向', bounds: [-L + xStep, -W, L - xStep, W] },
    { id: 'v-front', name: '前场', group: '纵向', bounds: [L - xStep, -W, L, W] },
];
