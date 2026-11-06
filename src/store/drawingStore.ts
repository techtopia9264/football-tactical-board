import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 划线类型 */
export type DrawingType = 'arrow' | 'ellipse' | 'rect';

/** 划线颜色（中性色 黑/白/浅灰/深灰 + 彩色 红橙黄绿青蓝紫） */
export type DrawingColorId =
    | 'black'
    | 'white'
    | 'lightgray'
    | 'darkgray'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'cyan'
    | 'blue'
    | 'purple';

export const DRAWING_COLORS: Record<DrawingColorId, string> = {
    black: '#1a1a1a',
    white: '#ffffff',
    lightgray: '#d1d5db',
    darkgray: '#4b5563',
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    cyan: '#06b6d4',
    blue: '#3b82f6',
    purple: '#a855f7',
};

/** 可配置颜色（中性色 4 种 + 彩色 7 种） */
export const DRAWING_COLOR_LIST: DrawingColorId[] = [
    'black',
    'white',
    'lightgray',
    'darkgray',
    'red',
    'orange',
    'yellow',
    'green',
    'cyan',
    'blue',
    'purple',
];

/** 新建划线默认粗细（球场标线宽的倍数；3x 便于看清与选中，可调 2~5） */
export const DEFAULT_DRAW_WIDTH = 3;

export interface Drawing {
    id: string;
    type: DrawingType;
    /** 起点平面坐标 [x, z] */
    start: [number, number];
    /** 终点平面坐标 [x, z] */
    end: [number, number];
    color: DrawingColorId;
    /** 线样式：实线 / 虚线（手动切段渲染，稳定） */
    style: 'solid' | 'dashed';
    /** 粗细倍数（球场标线宽的 0.5~2 倍） */
    width: number;
}

interface DrawingState {
    drawings: Drawing[];
    /** 划线图层显隐（图层面板控制；隐藏时不可见也不可交互） */
    visible: boolean;
    /** 划线平面高度（默认 = 球门高度 0.244，最高 0.5，最低 0.03） */
    planeY: number;
    selectedId: string | null;
    /** 新增划线，返回新 id（供画完自动选中） */
    addDrawing: (d: Omit<Drawing, 'id'>) => string;
    updateDrawing: (id: string, patch: Partial<Drawing>) => void;
    removeDrawing: (id: string) => void;
    /** 清空所有划线（划线不持久化，刷新即清空） */
    clearDrawings: () => void;
    setVisible: (visible: boolean) => void;
    setPlaneY: (y: number) => void;
    select: (id: string | null) => void;
}

/** 战术划线状态（仅平面高度持久化；划线本身刷新即清空） */
export const useDrawingStore = create<DrawingState>()(
    persist(
        set => ({
            drawings: [],
            visible: true,
            planeY: 0.244,
            selectedId: null,
            addDrawing: d => {
                const id = `draw-${Date.now()}`;
                set(state => ({
                    drawings: [...state.drawings, { id, ...d }],
                }));
                return id;
            },
            setVisible: visible => set({ visible }),
            updateDrawing: (id, patch) =>
                set(state => ({
                    drawings: state.drawings.map(d =>
                        d.id === id ? { ...d, ...patch } : d,
                    ),
                })),
            removeDrawing: id =>
                set(state => ({
                    drawings: state.drawings.filter(d => d.id !== id),
                    selectedId: state.selectedId === id ? null : state.selectedId,
                })),
            clearDrawings: () => set({ drawings: [], selectedId: null }),
            setPlaneY: planeY => set({ planeY }),
            select: selectedId => set({ selectedId }),
        }),
        {
            name: 'tactical-drawings',
            partialize: state => ({ planeY: state.planeY }),
            // 只恢复平面高度，忽略旧版本可能残留的划线数据
            merge: (persisted, current) => ({
                ...current,
                planeY:
                    (persisted as { planeY?: number } | undefined)?.planeY ??
                    current.planeY,
            }),
        },
    ),
);
