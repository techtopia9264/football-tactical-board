import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ZoneState } from '../config/highlightZones';

interface HighlightState {
    /** 区域 id → 状态 */
    zones: Record<string, ZoneState>;
    /** 高亮图层显隐（图层面板控制） */
    visible: boolean;
    setZoneState: (id: string, state: ZoneState) => void;
    setVisible: (visible: boolean) => void;
}

/** 8 块场地高亮区域状态（localStorage 持久化） */
export const useHighlightStore = create<HighlightState>()(
    persist(
        set => ({
            zones: {},
            visible: true,
            setZoneState: (id, state) =>
                set(prev => ({
                    zones: { ...prev.zones, [id]: state },
                })),
            setVisible: visible => set({ visible }),
        }),
        {
            name: 'highlight-zones',
            partialize: state => ({ zones: state.zones }),
        },
    ),
);
