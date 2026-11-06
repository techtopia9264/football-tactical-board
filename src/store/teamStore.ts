import { create } from 'zustand';
import type { Team } from './playerStore';

export type TeamSide = 'left' | 'right';

export interface TeamConfig {
    side: TeamSide; // 本方半区
    playerColor: string; // 球员颜色
    gkColor: string; // 守门员颜色
    formation: string; // 阵容 id（FORMATIONS）
}

interface TeamState {
    home: TeamConfig;
    away: TeamConfig;
    setConfig: (team: Team, patch: Partial<TeamConfig>) => void;
}

/** 半区互斥：另一队已占则不可选 */
export const useTeamStore = create<TeamState>((set, get) => ({
    home: {
        side: 'left',
        playerColor: '#e11d48',
        gkColor: '#fbbf24',
        formation: 'f4321',
    },
    away: {
        side: 'right',
        playerColor: '#2563eb',
        gkColor: '#10b981',
        formation: 'f433',
    },
    setConfig: (team, patch) => {
        const other = team === 'home' ? get().away : get().home;
        // 半区互斥：对方已选该半区则拒绝
        if (patch.side && patch.side === other.side) return;
        set(state => ({ [team]: { ...state[team], ...patch } }));
    },
}));
