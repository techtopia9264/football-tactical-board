/**
 * 火柴人姿态参数（关节角度，弧度）：
 * - torsoX 躯干左右倾（绕 x，>0 右倾 +z，扑救/铲球）
 * - torsoZ 躯干前后倾（绕 z，>0 后仰，<0 前倾）
 * - hipX 左右开合（绕 x，站姿微开）
 * - hipZ 前后摆动（绕 z，奔跑/踢球）
 * - knee 膝关节弯曲（绕 z）
 * - armX 手臂侧举（绕 x，张开/举起）
 * - armZ 手臂前后摆（绕 z，摆臂）
 */
export interface PlayerPose {
    /** 整体腾空高度（起跳/扑救用） */
    height?: number;
    /** 整体侧躺（绕 x，正 = 向 +z 侧躺） */
    bodyX?: number;
    /** 整体躺倒（绕 z，正 = 后倒仰躺，负 = 前倒趴下） */
    bodyZ?: number;
    /** 扭腰（绕 Y，躯干+手臂整体旋转，正 = 向左转，负 = 向右转；±60°） */
    twist?: number;
    torsoX?: number;
    torsoZ?: number;
    leftHipX?: number;
    rightHipX?: number;
    leftHipZ?: number;
    rightHipZ?: number;
    leftKnee?: number;
    rightKnee?: number;
    leftArmX?: number;
    rightArmX?: number;
    leftArmZ?: number;
    rightArmZ?: number;
    /** 脚踝旋转（绕 z，脚尖上下；负值向下压） */
    leftAnkleZ?: number;
    rightAnkleZ?: number;
    /** 脚踝旋转（绕 x，脚尖左右/外八） */
    leftAnkleX?: number;
    rightAnkleX?: number;
    /** 脚与腿连接位置（沿腿方向前后，0=贴腿末端，保持不长在小腿中间） */
    leftFootShift?: number;
    rightFootShift?: number;
}

/** 默认站姿 */
export const DEFAULT_POSE: Required<PlayerPose> = {
    height: 0,
    bodyX: 0,
    bodyZ: 0,
    twist: 0,
    torsoX: 0,
    torsoZ: 0,
    leftHipX: -0.06, // 左腿（+z 侧）向外微张
    rightHipX: 0.06, // 右腿（-z 侧）向外微张
    leftHipZ: 0,
    rightHipZ: 0,
    leftKnee: 0,
    rightKnee: 0,
    leftArmX: 0.08, // 左臂微外张
    rightArmX: -0.08,
    leftArmZ: 0,
    rightArmZ: 0,
    leftAnkleZ: 0,
    rightAnkleZ: 0,
    leftAnkleX: 0,
    rightAnkleX: 0,
    leftFootShift: 0,
    rightFootShift: 0,
};

export interface PlayerPosePreset {
    id: string;
    name: string;
    pose: PlayerPose;
}

/** 预设动作（通用，静态定格；精简版仅保留站姿/奔跑） */
export const PLAYER_POSES: PlayerPosePreset[] = [
    { id: 'stand', name: '站姿', pose: {} },
    {
        id: 'run',
        name: '奔跑',
        pose: {
            torsoZ: -0.25, // 身体前倾
            leftHipZ: 0.85, // 左腿前摆抬高
            leftKnee: -0.55, // 前摆腿屈膝（小腿向后折）
            rightHipZ: -0.65, // 右腿后蹬
            rightKnee: 0, // 后蹬腿伸直
            leftArmZ: 0.85, // 左臂大幅前摆
            rightArmZ: -0.85, // 右臂大幅后摆
        },
    },
];

/** 比较两个姿态是否相同（用于识别当前预设） */
export function poseEqual(a: PlayerPose, b: PlayerPose): boolean {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        if (a[k as keyof PlayerPose] !== b[k as keyof PlayerPose]) {
            return false;
        }
    }
    return true;
}

/** 关节中文名 */
export const POSE_LABELS: Record<keyof PlayerPose, string> = {
    height: '腾空高度',
    bodyX: '整体侧躺',
    bodyZ: '整体躺倒',
    twist: '扭腰',
    torsoX: '左右倾',
    torsoZ: '前后倾',
    leftHipX: '左腿开合',
    rightHipX: '右腿开合',
    leftHipZ: '左腿前后摆',
    rightHipZ: '右腿前后摆',
    leftKnee: '左膝弯',
    rightKnee: '右膝弯',
    leftArmX: '左臂侧举',
    rightArmX: '右臂侧举',
    leftArmZ: '左臂前后摆',
    rightArmZ: '右臂前后摆',
    leftAnkleZ: '脚尖上下',
    rightAnkleZ: '脚尖上下',
    leftAnkleX: '脚尖左右',
    rightAnkleX: '脚尖左右',
    leftFootShift: '脚前后位置',
    rightFootShift: '脚前后位置',
};

/** 关节活动范围；unit: 'rad'=角度 / 'len'=长度 */
export interface PoseLimit {
    min: number;
    max: number;
    unit: 'rad' | 'len';
    /** 滑块两端方向标签（可选，start=左端/负方向，end=右端/正方向） */
    startLabel?: string;
    endLabel?: string;
}

export const POSE_LIMITS: Record<keyof PlayerPose, PoseLimit> = {
    height: { min: -0.1, max: 0.3, unit: 'len' }, // 可下沉（陷地）/腾空
    bodyX: { min: -1.55, max: 1.55, unit: 'rad', startLabel: '左', endLabel: '右' }, // 侧躺贴地（<90° 头不穿地）
    bodyZ: { min: -1.55, max: 1.55, unit: 'rad', startLabel: '趴', endLabel: '躺' }, // 仰躺/趴下
    twist: { min: -Math.PI / 3, max: Math.PI / 3, unit: 'rad', startLabel: '左', endLabel: '右' }, // 扭腰 ±60°（绕髋部 Y 轴，手臂跟随）
    torsoX: { min: -1.35, max: 1.35, unit: 'rad', startLabel: '左', endLabel: '右' }, // <90° 保证头部不穿地
    torsoZ: { min: -1.35, max: 1.35, unit: 'rad', startLabel: '前', endLabel: '后' },
    leftHipX: { min: -0.8, max: 0.8, unit: 'rad', startLabel: '合', endLabel: '开' }, // 渲染时取负（控制器向左=合拢）
    rightHipX: { min: -0.8, max: 0.8, unit: 'rad', startLabel: '合', endLabel: '开' },
    leftHipZ: { min: -1.5, max: 1.5, unit: 'rad', startLabel: '后', endLabel: '前' },
    rightHipZ: { min: -1.5, max: 1.5, unit: 'rad', startLabel: '后', endLabel: '前' },
    leftKnee: { min: -2.478, max: 0, unit: 'rad', startLabel: '弯', endLabel: '直' }, // 膝关节只能向后弯（-142°）
    rightKnee: { min: -2.478, max: 0, unit: 'rad', startLabel: '弯', endLabel: '直' },
    leftArmX: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '向内', endLabel: '向外' },
    rightArmX: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '向内', endLabel: '向外' }, // 渲染时取负（控制器向左=内收）
    leftArmZ: { min: -1.605, max: 3.176, unit: 'rad', startLabel: '后', endLabel: '前' }, // -92°~182°：可举过头顶
    rightArmZ: { min: -1.605, max: 3.176, unit: 'rad', startLabel: '后', endLabel: '前' },
    leftAnkleZ: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '绷直', endLabel: '勾' },
    rightAnkleZ: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '绷直', endLabel: '勾' },
    leftAnkleX: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '内崴', endLabel: '外崴' },
    rightAnkleX: { min: -1.6, max: 1.6, unit: 'rad', startLabel: '内崴', endLabel: '外崴' },
    leftFootShift: { min: -0.03, max: 0.06, unit: 'len', startLabel: '后', endLabel: '前' }, // 脚沿腿方向前后（小幅向后不嵌小腿）
    rightFootShift: { min: -0.03, max: 0.06, unit: 'len', startLabel: '后', endLabel: '前' },
};

/** 姿态编辑器分组（按身体部位） */
export const POSE_GROUPS: { label: string; keys: (keyof PlayerPose)[] }[] = [
    { label: '整体', keys: ['height', 'bodyX', 'bodyZ'] },
    { label: '躯干', keys: ['twist', 'torsoX', 'torsoZ'] },
    {
        label: '左腿',
        keys: ['leftHipX', 'leftHipZ', 'leftKnee', 'leftAnkleZ', 'leftAnkleX', 'leftFootShift'],
    },
    {
        label: '右腿',
        keys: ['rightHipX', 'rightHipZ', 'rightKnee', 'rightAnkleZ', 'rightAnkleX', 'rightFootShift'],
    },
    { label: '左臂', keys: ['leftArmX', 'leftArmZ'] },
    { label: '右臂', keys: ['rightArmX', 'rightArmZ'] },
];

/** 姿态编辑器卡片布局（引用 POSE_GROUPS 的 label；前两张在中间列，后两张在右侧列） */
export const POSE_CARDS: { label: string; groups: string[] }[] = [
    { label: '整体与躯干', groups: ['整体', '躯干'] },
    { label: '双臂', groups: ['左臂', '右臂'] },
    { label: '左腿', groups: ['左腿'] },
    { label: '右腿', groups: ['右腿'] },
];
