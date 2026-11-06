export interface FormationPlayer {
    x: number; // 相对本方半区的纵向坐标（负 = 靠近本方球门，0 = 中线）
    z: number; // 横向坐标
    role: 'gk' | 'field';
}

export interface Formation {
    id: string;
    name: string; // 阵型名，如 4-3-2-1
    players: FormationPlayer[];
}

/** 本方半区阵型坐标（半区为右侧时 x 取反） */
const formations: Formation[] = [
    {
        id: 'f4321',
        name: '4-3-2-1',
        players: [
            { x: -5.05, z: 0, role: 'gk' },
            { x: -3.9, z: -2.4, role: 'field' },
            { x: -3.9, z: -0.8, role: 'field' },
            { x: -3.9, z: 0.8, role: 'field' },
            { x: -3.9, z: 2.4, role: 'field' },
            { x: -2.3, z: -1.8, role: 'field' },
            { x: -2.3, z: 0, role: 'field' },
            { x: -2.3, z: 1.8, role: 'field' },
            { x: -1.3, z: -0.9, role: 'field' },
            { x: -1.3, z: 0.9, role: 'field' },
            { x: -0.5, z: 0, role: 'field' },
        ],
    },
    {
        id: 'f433',
        name: '4-3-3',
        players: [
            { x: -5.05, z: 0, role: 'gk' },
            { x: -3.9, z: -2.4, role: 'field' },
            { x: -3.9, z: -0.8, role: 'field' },
            { x: -3.9, z: 0.8, role: 'field' },
            { x: -3.9, z: 2.4, role: 'field' },
            { x: -2.3, z: -1.8, role: 'field' },
            { x: -2.3, z: 0, role: 'field' },
            { x: -2.3, z: 1.8, role: 'field' },
            { x: -1.0, z: -2.0, role: 'field' },
            { x: -1.0, z: 0, role: 'field' },
            { x: -1.0, z: 2.0, role: 'field' },
        ],
    },
    {
        id: 'f532',
        name: '5-3-2',
        players: [
            { x: -5.05, z: 0, role: 'gk' },
            { x: -3.9, z: -2.4, role: 'field' },
            { x: -3.9, z: -1.2, role: 'field' },
            { x: -3.9, z: 0, role: 'field' },
            { x: -3.9, z: 1.2, role: 'field' },
            { x: -3.9, z: 2.4, role: 'field' },
            { x: -2.2, z: -1.8, role: 'field' },
            { x: -2.2, z: 0, role: 'field' },
            { x: -2.2, z: 1.8, role: 'field' },
            { x: -0.8, z: -0.8, role: 'field' },
            { x: -0.8, z: 0.8, role: 'field' },
        ],
    },
    {
        id: 'f442',
        name: '4-4-2',
        players: [
            { x: -5.05, z: 0, role: 'gk' },
            { x: -3.9, z: -2.4, role: 'field' },
            { x: -3.9, z: -0.8, role: 'field' },
            { x: -3.9, z: 0.8, role: 'field' },
            { x: -3.9, z: 2.4, role: 'field' },
            { x: -2.3, z: -2.4, role: 'field' },
            { x: -2.3, z: -0.8, role: 'field' },
            { x: -2.3, z: 0.8, role: 'field' },
            { x: -2.3, z: 2.4, role: 'field' },
            { x: -0.8, z: -0.8, role: 'field' },
            { x: -0.8, z: 0.8, role: 'field' },
        ],
    },
    {
        id: 'f4231',
        name: '4-2-3-1',
        players: [
            { x: -5.05, z: 0, role: 'gk' },
            { x: -3.9, z: -2.4, role: 'field' },
            { x: -3.9, z: -0.8, role: 'field' },
            { x: -3.9, z: 0.8, role: 'field' },
            { x: -3.9, z: 2.4, role: 'field' },
            { x: -2.7, z: -0.8, role: 'field' },
            { x: -2.7, z: 0.8, role: 'field' },
            { x: -1.3, z: -1.8, role: 'field' },
            { x: -1.3, z: 0, role: 'field' },
            { x: -1.3, z: 1.8, role: 'field' },
            { x: -0.5, z: 0, role: 'field' },
        ],
    },
];

export const FORMATIONS = formations;
