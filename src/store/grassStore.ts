import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    DEFAULT_GRASS_PARAMS,
    GRASS_PRESETS,
    type GrassParams,
    type GrassPreset,
} from '../config/grassParams';

interface GrassState {
    params: GrassParams;
    /** 草皮图层显隐（图层面板控制） */
    visible: boolean;
    /** 用户通过面板保存的版本（localStorage 持久化） */
    customPresets: GrassPreset[];
    /** 默认参数（初始为代码默认值，可被"设为默认"覆盖，持久化） */
    defaultParams: GrassParams;
    setParam: <K extends keyof GrassParams>(key: K, value: GrassParams[K]) => void;
    resetParams: () => void;
    setAsDefault: () => void;
    applyPreset: (presetId: string) => void;
    savePreset: (name: string) => void;
    setVisible: (visible: boolean) => void;
}

export const useGrassStore = create<GrassState>()(
    persist(
        (set, get) => ({
            params: DEFAULT_GRASS_PARAMS,
            visible: true,
            customPresets: [],
            defaultParams: DEFAULT_GRASS_PARAMS,
            setVisible: visible => set({ visible }),
            setParam: (key, value) =>
                set(state => ({ params: { ...state.params, [key]: value } })),
            resetParams: () => set({ params: { ...get().defaultParams } }),
            setAsDefault: () => set({ defaultParams: { ...get().params } }),
            applyPreset: presetId => {
                const preset = [...GRASS_PRESETS, ...get().customPresets].find(
                    p => p.id === presetId,
                );
                if (preset) {
                    set({ params: { ...preset.params } });
                }
            },
            savePreset: name =>
                set(state => ({
                    customPresets: [
                        ...state.customPresets,
                        {
                            id: `custom-${Date.now()}`,
                            name,
                            params: { ...state.params },
                        },
                    ],
                })),
        }),
        {
            name: 'grass-presets',
            partialize: state => ({
                customPresets: state.customPresets,
                defaultParams: state.defaultParams,
            }),
        },
    ),
);
