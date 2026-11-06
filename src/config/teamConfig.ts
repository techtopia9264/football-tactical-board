import type { Team } from '../store/playerStore';

/** 球队默认颜色 */
export const TEAM_COLORS: Record<Team, string> = {
    home: '#e11d48', // 主队红
    away: '#2563eb', // 客队蓝
};

export const TEAM_LABELS: Record<Team, string> = {
    home: '主队',
    away: '客队',
};
