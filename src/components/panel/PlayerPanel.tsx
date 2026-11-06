import { useMemo, useState, type DragEvent } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import {
    Card,
    Label,
    Input,
    Button,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@yizhiheizi/dud';
import { usePlayerStore, type Team } from '../../store/playerStore';
import { useActionStore, type CustomAction } from '../../store/actionStore';
import { TEAM_LABELS } from '../../config/teamConfig';
import {
    PLAYER_POSES,
    poseEqual,
    POSE_GROUPS,
    POSE_CARDS,
    POSE_LABELS,
    POSE_LIMITS,
    DEFAULT_POSE,
    type PlayerPose,
} from '../../config/playerPoses';
import { POSITION_ACTIONS } from '../../config/positionActions';
import ParamSlider from './ParamSlider';

/** 动作下拉选项（通用 + 位置分组） */
interface ActionOption {
    id: string;
    name: string;
    pose: PlayerPose;
}

interface ActionGroup {
    label: string;
    items: ActionOption[];
}

/** 动作分类（保存动作时可选） */
const ACTION_CATEGORIES = ['通用', '门将', '后卫', '中场', '前锋'];

/** 构建动作分组：内置预设 + 用户自定义（按分类归入） */
function buildActionGroups(custom: CustomAction[]): ActionGroup[] {
    const groups: ActionGroup[] = [
        {
            label: '通用',
            items: PLAYER_POSES.map(p => ({ id: p.id, name: p.name, pose: p.pose })),
        },
        ...POSITION_ACTIONS.map(cat => ({
            label: cat.name,
            items: cat.actions.map(a => ({
                id: `pos-${cat.name}-${a.name}`,
                name: a.name,
                pose: a.pose,
            })),
        })),
    ];
    // 自定义动作按分类插入对应分组
    for (const ca of custom) {
        const group = groups.find(g => g.label === ca.category);
        if (group) {
            group.items.push({ id: ca.id, name: ca.name, pose: ca.pose });
        }
    }
    // 过滤空分组
    return groups.filter(g => g.items.length > 0);
}

/** 当前 pose 匹配的动作 id（无匹配回退站姿） */
function matchActionId(pose: PlayerPose | undefined, groups: ActionGroup[]): string {
    for (const group of groups) {
        for (const item of group.items) {
            if (poseEqual(item.pose, pose ?? {})) return item.id;
        }
    }
    return 'stand';
}

const CLAMP_X = 5.25; // 球场 x 边界
const CLAMP_Z = 3.4; // 球场 z 边界

/**
 * 四方向快捷按钮（three 坐标系：绕 Y 旋转 +90° → -z 方向 = 俯视屏幕上方）
 * → 0°（+x 右）、← 180°、↑ 90°（-z 上）、↓ 270°（+z 下）
 */
const DIRS = [
    { label: '→', facing: 0 },
    { label: '←', facing: Math.PI },
    { label: '↑', facing: Math.PI / 2 },
    { label: '↓', facing: -Math.PI / 2 },
];

/** 弧度 → 度（0~360） */
const radToDeg = (r: number) =>
    (((r % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI);
const degToRad = (d: number) => (d / 180) * Math.PI;

/** 朝向配置控件（单选/批量共用） */
function FacingControl({
    facing,
    onChange,
}: {
    facing: number;
    onChange: (facing: number) => void;
}) {
    return (
        <div className="param-row">
            <div className="param-header">
                <Label className="param-label">朝向</Label>
            </div>
            <div className="param-btn-group">
                {DIRS.map(d => (
                    <Button
                        key={d.label}
                        size="sm"
                        variant={
                            Math.abs(radToDeg(facing) - radToDeg(d.facing)) < 1
                                ? 'default'
                                : 'outline'
                        }
                        onClick={() => onChange(d.facing)}
                    >
                        {d.label}
                    </Button>
                ))}
            </div>
            <ParamSlider
                label="角度"
                min={0}
                max={360}
                step={5}
                value={radToDeg(facing)}
                onChange={d => onChange(degToRad(d))}
            />
        </div>
    );
}

/**
 * 球员面板：0 个不显示；1 个显示属性编辑；多个显示批量配置（朝向等）
 */
function PlayerPanel() {
    const selectedIds = usePlayerStore(s => s.selectedIds);

    if (selectedIds.length === 0) return null;
    if (selectedIds.length === 1) return <SinglePlayerPanel id={selectedIds[0]} />;
    return <BatchPlayerPanel ids={selectedIds} />;
}

/** 单个球员属性面板 */
function SinglePlayerPanel({ id }: { id: string }) {
    const player = usePlayerStore(s => s.players.find(p => p.id === id));
    const updatePlayer = usePlayerStore(s => s.updatePlayer);
    const removePlayer = usePlayerStore(s => s.removePlayer);
    const select = usePlayerStore(s => s.select);
    const displayMode = usePlayerStore(s => s.displayMode);
    const customActions = useActionStore(s => s.customActions);
    const removeCustomAction = useActionStore(s => s.removeCustomAction);
    const actionGroups = useMemo(
        () => buildActionGroups(customActions),
        [customActions],
    );
    const [deleteTarget, setDeleteTarget] = useState<ActionOption | null>(null);
    const [managerOpen, setManagerOpen] = useState(false);

    if (!player) return null;

    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

    const setPosition = (axis: 0 | 1, value: number) => {
        const next: [number, number] = [...player.position] as [number, number];
        next[axis] = axis === 0 ? clamp(value, CLAMP_X) : clamp(value, CLAMP_Z);
        updatePlayer(player.id, { position: next });
    };

    const setTeam = (team: Team) => {
        updatePlayer(player.id, { team });
    };

    // 火柴人模式才有姿态编辑器（3 列宽布局）；圆圈模式退回单列窄面板
    const isStickman = displayMode === 'stickman';

    return (
        <Card
            className={`grass-panel player-panel${isStickman ? ' player-panel-wide' : ''}`}
        >
            <div className="grass-panel-title">
                <span>
                    球员 #{player.number}
                    {player.role === 'gk' ? '（门将）' : ''}
                </span>
            </div>

            <div className={isStickman ? 'player-panel-grid' : 'player-panel-col'}>
                {/* 左列：基本信息 */}
                <div className="player-panel-col">
                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">号码</Label>
                        </div>
                        <Input
                            type="number"
                            min={1}
                            max={99}
                            value={player.number}
                            onChange={e =>
                                updatePlayer(player.id, {
                                    number: Number(e.target.value) || 1,
                                })
                            }
                        />
                    </div>

                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">队伍</Label>
                        </div>
                        <div className="param-btn-group">
                            {(Object.keys(TEAM_LABELS) as Team[]).map(team => (
                                <Button
                                    key={team}
                                    size="sm"
                                    variant={player.team === team ? 'default' : 'outline'}
                                    onClick={() => setTeam(team)}
                                >
                                    {TEAM_LABELS[team]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">位置</Label>
                        </div>
                        <div className="param-xy">
                            <div>
                                <span className="param-value">X</span>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={Number(player.position[0].toFixed(2))}
                                    onChange={e => setPosition(0, Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <span className="param-value">Z</span>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={Number(player.position[1].toFixed(2))}
                                    onChange={e => setPosition(1, Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 动作预设（通用 + 按位置分组；仅火柴人模式） */}
                    {isStickman && (
                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">动作</Label>
                        </div>
                        <Select
                            value={matchActionId(player.pose, actionGroups)}
                            onValueChange={v => {
                                for (const group of actionGroups) {
                                    const item = group.items.find(i => i.id === v);
                                    if (item) {
                                        updatePlayer(player.id, { pose: item.pose });
                                        return;
                                    }
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {actionGroups.map(group => (
                                    <div key={group.label}>
                                        <SelectItem value={`__${group.label}`} disabled>
                                            {group.label}
                                        </SelectItem>
                                        {group.items.map(item => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                                className="action-item"
                                            >
                                                <span className="action-item-name">
                                                    {item.name}
                                                </span>
                                                {/* 自定义动作可删除（二次确认） */}
                                                {item.id.startsWith('action-') && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="action-item-delete"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setDeleteTarget(item);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    )}

                    {/* 朝向配置 */}
                    <FacingControl
                        facing={player.facing}
                        onChange={facing => updatePlayer(player.id, { facing })}
                    />

                    <div className="param-btn-group">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                removePlayer(player.id);
                                select(null);
                            }}
                        >
                            删除球员
                        </Button>
                        {isStickman && (
                            <Button variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
                                预设动作管理
                            </Button>
                        )}
                    </div>
                </div>

                {/* 姿态微调（仅火柴人模式；横跨后两列，内部再分两列） */}
                {isStickman && (
                    <div className="player-panel-col pose-col">
                        <PoseEditor
                            pose={player.pose ?? {}}
                            onChange={pose => updatePlayer(player.id, { pose })}
                        />
                    </div>
                )}
            </div>

            {/* 删除自定义动作（二次确认） */}
            <Dialog
                open={deleteTarget !== null}
                onOpenChange={v => !v && setDeleteTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>删除动作</DialogTitle>
                        <DialogDescription>
                            确认删除动作「{deleteTarget?.name}」？删除后不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTarget) {
                                    removeCustomAction(deleteTarget.id);
                                }
                                setDeleteTarget(null);
                            }}
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 预设动作管理弹窗 */}
            <ActionManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
        </Card>
    );
}

/** 姿态编辑器：按部位分组调节全部关节（角度关节显示角度，长度关节显示原值） */
function PoseEditor({
    pose,
    onChange,
}: {
    pose: PlayerPose;
    onChange: (pose: PlayerPose) => void;
}) {
    const radToDeg = (r: number) => Math.round((r * 180) / Math.PI);
    const degToRad = (d: number) => (d * Math.PI) / 180;

    /** 读取关节当前值（缺省用默认站姿值） */
    const current = (key: keyof PlayerPose): number =>
        pose[key] ?? DEFAULT_POSE[key];

    /** 调节关节（与默认值相同时移除，保持姿态数据干净） */
    const setJoint = (key: keyof PlayerPose, value: number) => {
        const next = { ...pose };
        if (Math.abs(value - DEFAULT_POSE[key]) < 1e-4) {
            delete next[key];
        } else {
            next[key] = value;
        }
        onChange(next);
    };

    const groupBy = (label: string) =>
        POSE_GROUPS.find(g => g.label === label)!;

    /** 渲染一个关节滑杆 */
    const renderJoint = (key: keyof PlayerPose) => {
        const limit = POSE_LIMITS[key];
        // 角度关节显示度数，长度关节（height/脚位置）显示原值
        const isRad = limit.unit === 'rad';
        return (
            <ParamSlider
                key={key}
                label={POSE_LABELS[key]}
                min={isRad ? radToDeg(limit.min) : limit.min}
                max={isRad ? radToDeg(limit.max) : limit.max}
                step={isRad ? 1 : 0.01}
                value={isRad ? radToDeg(current(key)) : current(key)}
                onChange={v => setJoint(key, isRad ? degToRad(v) : v)}
                startLabel={limit.startLabel}
                endLabel={limit.endLabel}
            />
        );
    };

    const addCustomAction = useActionStore(s => s.addCustomAction);
    const [saveOpen, setSaveOpen] = useState(false);
    const [actionName, setActionName] = useState('');
    const [actionCategory, setActionCategory] = useState('通用');

    /** 保存当前姿态为自定义动作 */
    const handleSaveAction = () => {
        addCustomAction(actionName.trim(), actionCategory, pose);
        setActionName('');
        setActionCategory('通用');
        setSaveOpen(false);
    };

    const renderCard = (card: (typeof POSE_CARDS)[number]) => (
        <div key={card.label} className="pose-card">
            <div className="marking-group-label">{card.label}</div>
            {card.groups.flatMap(label => groupBy(label).keys).map(renderJoint)}
        </div>
    );

    return (
        <div className="pose-editor">
            {/* 中间列：重置 + 保存动作 + 整体躯干 + 双臂 */}
            <div className="pose-editor-col">
                <div className="param-btn-group">
                    <Button variant="outline" size="sm" onClick={() => onChange({})}>
                        重置姿态
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
                        保存动作
                    </Button>
                </div>
                {POSE_CARDS.slice(0, 2).map(renderCard)}
            </div>
            {/* 右侧列：左腿 + 右腿 */}
            <div className="pose-editor-col">
                {POSE_CARDS.slice(2).map(renderCard)}
            </div>

            {/* 保存动作弹窗 */}
            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>保存当前姿态为动作</DialogTitle>
                        <DialogDescription>
                            命名并选择分类，保存后将出现在"动作"下拉框对应分类下。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">动作名称</Label>
                        </div>
                        <Input
                            value={actionName}
                            onChange={e => setActionName(e.target.value)}
                            placeholder="如：飞身扑救 / 侧身铲球"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && actionName.trim()) {
                                    handleSaveAction();
                                }
                            }}
                        />
                    </div>
                    <div className="param-row">
                        <div className="param-header">
                            <Label className="param-label">分类</Label>
                        </div>
                        <Select value={actionCategory} onValueChange={setActionCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACTION_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                        </DialogClose>
                        <Button disabled={!actionName.trim()} onClick={handleSaveAction}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** 预设动作管理弹窗：自定义动作的分类与拖拽排序（排序影响下拉显示顺序） */
function ActionManagerDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const customActions = useActionStore(s => s.customActions);
    const updateCustomAction = useActionStore(s => s.updateCustomAction);
    const moveCustomActionTo = useActionStore(s => s.moveCustomActionTo);
    const removeCustomAction = useActionStore(s => s.removeCustomAction);
    const [deleteTarget, setDeleteTarget] = useState<CustomAction | null>(null);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    /** 拖拽悬停：按鼠标在条目内的上/下半区计算插入位置 */
    const handleDragOver = (e: DragEvent, idx: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        setDropIndex(idx + (before ? 0 : 1));
    };

    /** 放置：把拖拽项移动到指示位置 */
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        if (dragId && dropIndex !== null) {
            moveCustomActionTo(dragId, dropIndex);
        }
        setDragId(null);
        setDropIndex(null);
    };

    const endDrag = () => {
        setDragId(null);
        setDropIndex(null);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="action-manager-dialog">
                    <DialogHeader>
                        <DialogTitle>预设动作管理</DialogTitle>
                        <DialogDescription>
                            调整自定义动作的分类与排序，改动会同步到"动作"下拉框。
                        </DialogDescription>
                    </DialogHeader>
                    {customActions.length === 0 ? (
                        <div className="action-manager-empty">
                            暂无自定义动作，先在姿态编辑器里摆好姿势并"保存动作"。
                        </div>
                    ) : (
                        <div
                            className="action-manager-list"
                            onDragOver={e => {
                                // 拖到列表空白处兜底：插入到末尾
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDropIndex(customActions.length);
                            }}
                            onDrop={handleDrop}
                        >
                            {customActions.map((action, idx) => (
                                <div
                                    key={action.id}
                                    className={`action-manager-item${dragId === action.id ? ' dragging' : ''}${dropIndex === idx ? ' drop-before' : ''}${dropIndex === idx + 1 ? ' drop-after' : ''}`}
                                    draggable
                                    onDragStart={e => {
                                        setDragId(action.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={e => handleDragOver(e, idx)}
                                    onDrop={handleDrop}
                                    onDragEnd={endDrag}
                                >
                                    <GripVertical className="action-manager-grip" />
                                    <span className="action-manager-name">{action.name}</span>
                                    <Select
                                        value={action.category}
                                        onValueChange={v =>
                                            updateCustomAction(action.id, { category: v })
                                        }
                                    >
                                        <SelectTrigger className="action-manager-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACTION_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setDeleteTarget(action)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                            {dropIndex === customActions.length && (
                                <div className="action-manager-tail-line" />
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">关闭</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除二次确认 */}
            <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>删除动作</DialogTitle>
                        <DialogDescription>
                            确认删除动作「{deleteTarget?.name}」？此操作不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTarget) removeCustomAction(deleteTarget.id);
                                setDeleteTarget(null);
                            }}
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/** 批量配置面板（朝向为第一个配置项，后续可扩展） */
function BatchPlayerPanel({ ids }: { ids: string[] }) {
    const players = usePlayerStore(s => s.players.filter(p => ids.includes(p.id)));
    const updatePlayers = usePlayerStore(s => s.updatePlayers);

    if (players.length === 0) return null;

    // 显示值取第一个球员的朝向
    const firstFacing = players[0].facing;
    const setFacing = (facing: number) => updatePlayers(ids, { facing });

    return (
        <Card className="grass-panel player-panel">
            <div className="grass-panel-title">
                <span>批量配置（{players.length} 人）</span>
            </div>

            <FacingControl facing={firstFacing} onChange={setFacing} />
        </Card>
    );
}

export default PlayerPanel;
