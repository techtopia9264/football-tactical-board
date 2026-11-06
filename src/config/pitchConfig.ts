/** FIFA 标准球场尺寸（105m × 68m 缩放 0.1，单位：场景单位） */
export const PITCH_LENGTH = 10.5;
export const PITCH_WIDTH = 6.8;

/** 草皮外延（边线外的缓冲草地带，真实球场为 1.5m+ 缩放） */
export const PITCH_MARGIN = 0.3;

/** 标线高度（略高于草皮，避免 z-fighting） */
export const LINE_Y = 0.005;

/** 球场标线几何配置（FIFA 标准比例缩放） */
export const PITCH_CONFIG = {
    length: PITCH_LENGTH,
    width: PITCH_WIDTH,
    lineWidth: 0.025, // 标线宽（真实 12cm）
    centerCircleRadius: 0.915, // 中圈半径（9.15m）
    penaltyAreaDepth: 1.65, // 罚球区深度（16.5m）
    penaltyAreaWidth: 4.03, // 罚球区宽度（40.3m）
    goalAreaDepth: 0.55, // 球门区深度（5.5m）
    goalAreaWidth: 1.83, // 球门区宽度（18.3m）
    penaltySpotDistance: 1.1, // 点球点距底线（11m）
    penaltyArcRadius: 0.915, // 罚球弧半径（9.15m）
    cornerArcRadius: 0.15, // 角球弧半径（1.5m）
} as const;

/** 球门配置（FIFA 标准缩放） */
export const GOAL_CONFIG = {
    width: 0.732, // 门宽（7.32m）
    height: 0.244, // 门高（2.44m）
    postRadius: 0.02, // 立柱/横梁半径（视觉加粗，真实 6cm）
    netDepth: 0.2, // 球网向后延伸深度
    netBackHeight: 0.15, // 后网高度（顶网向后下方倾斜）
    netUVScale: 10, // 球网网格密度（每单位 UV）
} as const;
