import { create } from 'zustand';
import { useTeamStore } from './teamStore';
import { FORMATIONS } from '../config/formations';
import type { PlayerPose } from '../config/playerPoses';

export type Team = 'home' | 'away';

/** 球员展示方式 */
export type PlayerDisplayMode = 'stickman' | 'circle';

/** 球员角色 */
export type PlayerRole = 'gk' | 'field';

export interface Player {
    id: string;
    team: Team;
    number: number;
    position: [number, number]; // 球场平面坐标 [x, z]
    color: string;
    role: PlayerRole;
    /** 朝向（弧度，0 = +x 方向，顺时针为正） */
    facing: number;
    /** 动作姿态（火柴人关节角度，不设则默认站姿） */
    pose?: PlayerPose;
    /** 展示方式覆盖（不设则跟随全局 displayMode） */
    displayMode?: PlayerDisplayMode;
}

/** 根据位置计算默认朝向：左半场朝 +x 进攻，右半场朝 -x */
export function defaultFacing(position: [number, number]): number {
    return position[0] < 0 ? 0 : Math.PI;
}

/** 每队最多 11 人（足球比赛规则） */
export const MAX_PLAYERS = 11;

let seq = 0;
const genId = () => `p${Date.now()}_${seq++}`;

interface PlayerState {
    players: Player[];
    /** 选中的球员 id 列表（支持多选） */
    selectedIds: string[];
    displayMode: PlayerDisplayMode;
    /** 是否显示球员号码 */
    showNumbers: boolean;
    /** 主队/客队显隐（图层面板控制） */
    showHome: boolean;
    showAway: boolean;
    setShowNumbers: (show: boolean) => void;
    setDisplayMode: (mode: PlayerDisplayMode) => void;
    setShowTeam: (team: Team, show: boolean) => void;
    setShowAll: (show: boolean) => void;
    /** 添加球员；该队已满 11 人时返回 false */
    addPlayer: (
        position: [number, number],
        team?: Team,
        role?: PlayerRole,
    ) => boolean;
    /** 一键添加整队（先清空该队，再按球队配置阵容添加 11 人） */
    addTeam: (team: Team) => void;
    movePlayer: (id: string, position: [number, number]) => void;
    removePlayer: (id: string) => void;
    updatePlayer: (id: string, patch: Partial<Player>) => void;
    /** 批量更新多个球员 */
    updatePlayers: (ids: string[], patch: Partial<Player>) => void;
    /** 选中（additive=true 时切换多选，false 单选，null 清空） */
    select: (id: string | null, additive?: boolean) => void;
    clearPlayers: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    players: [],
    selectedIds: [],
    displayMode: 'circle',
    showNumbers: true,
    showHome: true,
    showAway: true,
    setShowNumbers: showNumbers => set({ showNumbers }),
    setDisplayMode: displayMode => set({ displayMode }),
    setShowTeam: (team, show) =>
        set(team === 'home' ? { showHome: show } : { showAway: show }),
    setShowAll: show => set({ showHome: show, showAway: show }),
    addPlayer: (position, team = 'home', role: PlayerRole = 'field') => {
        const { players } = get();
        if (players.filter(p => p.team === team).length >= MAX_PLAYERS) {
            return false;
        }
        const config = useTeamStore.getState()[team];
        set(state => ({
            players: [
                ...state.players,
                {
                    id: genId(),
                    team,
                    number: state.players.filter(p => p.team === team).length + 1,
                    position,
                    color: role === 'gk' ? config.gkColor : config.playerColor,
                    role,
                    facing: defaultFacing(position),
                },
            ],
        }));
        return true;
    },
    addTeam: team => {
        const config = useTeamStore.getState()[team];
        const formation =
            FORMATIONS.find(f => f.id === config.formation) ?? FORMATIONS[0];
        // 阵容坐标以"本方球门在左"为基准：左半区直接用，右半区镜像（x 取反）
        const dir = config.side === 'left' ? 1 : -1;
        // 朝向：左半区朝 +x（0）攻对方，右半区朝 -x（π）
        const facing = config.side === 'left' ? 0 : Math.PI;
        const players = formation.players.map((fp, i) => ({
            id: genId(),
            team,
            number: i + 1,
            position: [fp.x * dir, fp.z] as [number, number],
            color: fp.role === 'gk' ? config.gkColor : config.playerColor,
            role: fp.role,
            facing,
        }));
        // 替换式：先清空该队已有球员
        set(state => ({
            players: [
                ...state.players.filter(p => p.team !== team),
                ...players,
            ],
            selectedIds: [],
        }));
    },
    movePlayer: (id, position) =>
        set(state => ({
            players: state.players.map(p =>
                p.id === id ? { ...p, position } : p,
            ),
        })),
    removePlayer: id =>
        set(state => ({
            players: state.players.filter(p => p.id !== id),
            selectedIds: state.selectedIds.filter(sid => sid !== id),
        })),
    updatePlayer: (id, patch) =>
        set(state => ({
            players: state.players.map(p =>
                p.id === id ? { ...p, ...patch } : p,
            ),
        })),
    updatePlayers: (ids, patch) =>
        set(state => ({
            players: state.players.map(p =>
                ids.includes(p.id) ? { ...p, ...patch } : p,
            ),
        })),
    select: (id, additive = false) =>
        set(state => {
            if (id === null) return { selectedIds: [] };
            if (additive) {
                // 多选切换
                const has = state.selectedIds.includes(id);
                return {
                    selectedIds: has
                        ? state.selectedIds.filter(sid => sid !== id)
                        : [...state.selectedIds, id],
                };
            }
            return { selectedIds: [id] };
        }),
    clearPlayers: () => set({ players: [], selectedIds: [] }),
}));
