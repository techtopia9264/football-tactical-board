import { create } from 'zustand';

export type CameraPresetKey = 'top' | 'coach' | 'side';

export interface CameraPreset {
    label: string;
    position: [number, number, number];
    lookAt: [number, number, number];
}

/** 预设视角定义（球场 10.5 × 6.8，中心在原点） */
export const CAMERA_PRESETS: Record<CameraPresetKey, CameraPreset> = {
    top: { label: '俯视', position: [0, 11, 0.01], lookAt: [0, 0, 0] },
    coach: { label: '教练视角', position: [0, 8.5, 8.5], lookAt: [0, 0, 0] },
    side: { label: '侧视', position: [10.5, 3, 0], lookAt: [0, 0, 0] },
};

interface CameraState {
    preset: CameraPresetKey | null;
    setPreset: (preset: CameraPresetKey | null) => void;
}

export const useCameraStore = create<CameraState>(set => ({
    preset: null,
    setPreset: preset => set({ preset }),
}));
