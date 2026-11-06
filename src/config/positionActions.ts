import type { PlayerPose } from './playerPoses';

export interface PositionAction {
    name: string;
    pose: PlayerPose;
}

export interface PositionCategory {
    name: string; // 门将 / 后卫 / 中场 / 前锋
    actions: PositionAction[];
}

/**
 * 按位置分组的预设动作库（火柴人关键帧姿态）。
 * 坐标约定：火柴人面朝 +x；torsoX>0 右倾(+z)、torsoZ>0 后仰；hipZ>0 腿前摆；armX 侧举、armZ 前后摆。
 * 膝关节原则：只能向后弯（knee 为负值，小腿朝身后折），禁止反关节。
 * 精简版：仅保留验证过的动作（头球攻门/防守站位/短传）。
 */
export const POSITION_ACTIONS: PositionCategory[] = [
    {
        name: '门将',
        actions: [],
    },
    {
        name: '后卫',
        actions: [
            {
                name: '防守站位',
                pose: {
                    torsoZ: -0.12, // 前倾压低
                    leftKnee: -0.3,
                    rightKnee: -0.3,
                    leftArmX: 0.35,
                    rightArmX: -0.35,
                },
            },
        ],
    },
    {
        name: '中场',
        actions: [
            {
                name: '短传',
                pose: {
                    torsoZ: -0.05,
                    rightHipZ: 0.55, // 传球腿
                    rightKnee: -0.25,
                    leftKnee: -0.15,
                    leftArmZ: 0.3,
                    rightArmZ: -0.3, // 摆臂配合
                },
            },
        ],
    },
    {
        name: '前锋',
        actions: [
            {
                name: '头球攻门',
                pose: {
                    height: 0.08, // 腾空
                    torsoZ: -0.15, // 头前倾（躯干前压）
                    leftKnee: -0.45,
                    rightKnee: -0.45, // 起跳收腿
                    leftArmZ: -0.5,
                    rightArmZ: -0.5, // 双臂后摆
                },
            },
        ],
    },
];
