import { create } from 'zustand';

/** 平移方向位标志（位组合，支持斜向） */
export const PAN_F = 1; // 前（W）
export const PAN_B = 2; // 后（S）
export const PAN_L = 4; // 左（A）
export const PAN_R = 8; // 右（D）

interface PanState {
    /** 当前按住的方向位组合（键盘 + 按钮共享） */
    dirs: number;
    /** 是否已放大到显示平移控制器的程度 */
    zoomed: boolean;
    setDir: (flag: number, active: boolean) => void;
    setZoomed: (zoomed: boolean) => void;
}

/** 镜头平移状态：方向输入（WASD/按钮）与放大程度，供 CameraRig 与 PanPad 共享 */
export const usePanStore = create<PanState>(set => ({
    dirs: 0,
    zoomed: false,
    setDir: (flag, active) =>
        set(state => ({
            dirs: active ? state.dirs | flag : state.dirs & ~flag,
        })),
    setZoomed: zoomed => set({ zoomed }),
}));
