import { create } from 'zustand';

/** 标线 id（左右/上下独立控制） */
export type MarkingId =
    | 'leftGoalLine' // 左底线
    | 'rightGoalLine' // 右底线
    | 'topTouchline' // 上边线
    | 'bottomTouchline' // 下边线
    | 'midline' // 中线
    | 'leftPenaltyArc' // 左弧顶
    | 'rightPenaltyArc' // 右弧顶
    | 'topLeftCorner' // 左上角球弧
    | 'topRightCorner' // 右上角球弧
    | 'bottomLeftCorner' // 左下角球弧
    | 'bottomRightCorner' // 右下角球弧
    | 'leftPenaltyArea' // 左大禁区
    | 'rightPenaltyArea' // 右大禁区
    | 'leftGoalArea' // 左小禁区
    | 'rightGoalArea'; // 右小禁区

/** 始终渲染、不进调参面板的线（中圈、点球点） */
export type MarkingAlwaysId = 'centerCircle' | 'penaltySpots';

export type AllMarkingId = MarkingId | MarkingAlwaysId;

export interface MarkingItem {
    id: MarkingId;
    label: string;
}

export interface MarkingGroup {
    id: string;
    label: string;
    items: MarkingItem[];
}

/** 标线调参分组（面板按此渲染） */
export const MARKING_GROUPS: MarkingGroup[] = [
    {
        id: 'goalLines',
        label: '底线',
        items: [
            { id: 'leftGoalLine', label: '左侧底线' },
            { id: 'rightGoalLine', label: '右侧底线' },
        ],
    },
    {
        id: 'touchlines',
        label: '边线',
        items: [
            { id: 'topTouchline', label: '上侧边线' },
            { id: 'bottomTouchline', label: '下侧边线' },
        ],
    },
    {
        id: 'midline',
        label: '中线',
        items: [{ id: 'midline', label: '中线' }],
    },
    {
        id: 'penaltyArcs',
        label: '弧顶',
        items: [
            { id: 'leftPenaltyArc', label: '左侧弧顶' },
            { id: 'rightPenaltyArc', label: '右侧弧顶' },
        ],
    },
    {
        id: 'cornerArcs',
        label: '角球线',
        items: [
            { id: 'topLeftCorner', label: '左上角球线' },
            { id: 'topRightCorner', label: '右上角球线' },
            { id: 'bottomLeftCorner', label: '左下角球线' },
            { id: 'bottomRightCorner', label: '右下角球线' },
        ],
    },
    {
        id: 'penaltyAreas',
        label: '大禁区',
        items: [
            { id: 'leftPenaltyArea', label: '左大禁区' },
            { id: 'rightPenaltyArea', label: '右大禁区' },
        ],
    },
    {
        id: 'goalAreas',
        label: '小禁区',
        items: [
            { id: 'leftGoalArea', label: '左小禁区' },
            { id: 'rightGoalArea', label: '右小禁区' },
        ],
    },
];

interface MarkingsState {
    /** 标线图层总开关（图层面板控制） */
    masterVisible: boolean;
    visible: Record<MarkingId, boolean>;
    setMasterVisible: (visible: boolean) => void;
    setVisible: (id: MarkingId, visible: boolean) => void;
}

/** 全部默认可见 */
const ALL_VISIBLE = Object.fromEntries(
    MARKING_GROUPS.flatMap(g => g.items).map(item => [item.id, true]),
) as Record<MarkingId, boolean>;

export const useMarkingsStore = create<MarkingsState>(set => ({
    masterVisible: true,
    visible: ALL_VISIBLE,
    setMasterVisible: masterVisible => set({ masterVisible }),
    setVisible: (id, visible) =>
        set(state => ({ visible: { ...state.visible, [id]: visible } })),
}));
