/** 渲染路径版本：v1=旧公式（版本1 保存时的效果），v2=增强公式 */
export type GrassEffectStyle = 'v1' | 'v2';

/** 草皮可调参数 */
export interface GrassParams {
    effectStyle: GrassEffectStyle; // 渲染公式版本（v1/v2）
    colorCenter: string; // 球场中间草色（浅）
    colorEdge: string; // 球场边缘草色（深）
    edgeStrength: number; // 边缘渐变强度 0-1
    stripeEnabled: boolean; // 修剪条纹开关
    stripeFreq: number; // 条纹间距（越大越密）
    stripeStrength: number; // 条纹对比度 0-1
    noiseStrength: number; // 多频噪声整体强度
    bladeStrength: number; // 方向性草叶颗粒 0-1
    bumpStrength: number; // 法线扰动强度（0.3-0.5 合适）
    yellowing: number; // 枯黄感 0-1
}

/** 代码默认值（"恢复默认"按钮目标，当前默认 = 版本1 参数） */
export const DEFAULT_GRASS_PARAMS: GrassParams = {
    effectStyle: 'v1',
    colorCenter: '#728d3c',
    colorEdge: '#3c5421',
    edgeStrength: 0.4,
    stripeEnabled: true,
    stripeFreq: 0.6,
    stripeStrength: 0.2,
    noiseStrength: 1.4,
    bladeStrength: 0,
    bumpStrength: 0.4,
    yellowing: 0.1,
};

/** 草皮调参预设版本（后续版本2/3/4 继续追加） */
export interface GrassPreset {
    id: string;
    name: string;
    params: GrassParams;
}

export const GRASS_PRESETS: GrassPreset[] = [
    {
        id: 'v1',
        name: '版本1',
        params: {
            effectStyle: 'v1',
            colorCenter: '#728d3c',
            colorEdge: '#3c5421',
            edgeStrength: 0.4,
            stripeEnabled: true,
            stripeFreq: 0.6,
            stripeStrength: 0.2,
            noiseStrength: 1.4,
            bladeStrength: 0,
            bumpStrength: 0.4,
            yellowing: 0.1,
        },
    },
    {
        id: 'v2',
        name: '版本2',
        params: {
            effectStyle: 'v2',
            colorCenter: '#728d3c',
            colorEdge: '#3c5421',
            edgeStrength: 0.25,
            stripeEnabled: true,
            stripeFreq: 0.6,
            stripeStrength: 0.1,
            noiseStrength: 0.7,
            bladeStrength: 0.1,
            bumpStrength: 0.3,
            yellowing: 0.05,
        },
    },
];
