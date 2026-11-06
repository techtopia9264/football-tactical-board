import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerPose } from '../config/playerPoses';

export interface CustomAction {
    id: string;
    name: string;
    category: string; // 通用 / 门将 / 后卫 / 中场 / 前锋
    pose: PlayerPose;
}

interface ActionState {
    customActions: CustomAction[];
    addCustomAction: (name: string, category: string, pose: PlayerPose) => void;
    updateCustomAction: (id: string, patch: Partial<CustomAction>) => void;
    /** 拖拽排序：把 id 项移动到 toIndex 位置 */
    moveCustomActionTo: (id: string, toIndex: number) => void;
    removeCustomAction: (id: string) => void;
}

/** 用户通过姿态编辑器保存的自定义动作（localStorage 持久化） */
export const useActionStore = create<ActionState>()(
    persist(
        set => ({
            customActions: [],
            addCustomAction: (name, category, pose) =>
                set(state => ({
                    customActions: [
                        ...state.customActions,
                        {
                            id: `action-${Date.now()}`,
                            name,
                            category,
                            pose: { ...pose },
                        },
                    ],
                })),
            updateCustomAction: (id, patch) =>
                set(state => ({
                    customActions: state.customActions.map(a =>
                        a.id === id ? { ...a, ...patch } : a,
                    ),
                })),
            moveCustomActionTo: (id, toIndex) =>
                set(state => {
                    const from = state.customActions.findIndex(a => a.id === id);
                    if (from < 0 || toIndex < 0 || toIndex > state.customActions.length) {
                        return state;
                    }
                    const list = [...state.customActions];
                    const [item] = list.splice(from, 1);
                    // 从前方移除后索引回退：from < toIndex 时目标位前移一位
                    const insertAt = from < toIndex ? toIndex - 1 : toIndex;
                    list.splice(insertAt, 0, item);
                    return { customActions: list };
                }),
            removeCustomAction: id =>
                set(state => ({
                    customActions: state.customActions.filter(a => a.id !== id),
                })),
        }),
        {
            name: 'custom-actions',
            partialize: state => ({ customActions: state.customActions }),
        },
    ),
);
