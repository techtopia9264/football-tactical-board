import { create } from 'zustand';

interface GoalState {
    visible: boolean; // 球门整体显隐
    netOpacity: number; // 球网透明度 0-1
    setVisible: (visible: boolean) => void;
    setNetOpacity: (opacity: number) => void;
}

export const useGoalStore = create<GoalState>(set => ({
    visible: true,
    netOpacity: 0.9,
    setVisible: visible => set({ visible }),
    setNetOpacity: netOpacity => set({ netOpacity }),
}));
