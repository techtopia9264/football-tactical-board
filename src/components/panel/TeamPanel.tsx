import {
    Card,
    Label,
    Button,
    Switch,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@yizhiheizi/dud';
import { FORMATIONS } from '../../config/formations';
import { useTeamStore, type TeamSide } from '../../store/teamStore';
import { usePlayerStore, type Team } from '../../store/playerStore';
import { TEAM_LABELS } from '../../config/teamConfig';

/**
 * 球队调参面板：主队/客队 Tab 配置
 * （本方半区/球员颜色/守门员颜色/预设阵容/号码显隐），支持一键添加整队。
 */
function TeamPanel() {
    const showNumbers = usePlayerStore(s => s.showNumbers);
    const setShowNumbers = usePlayerStore(s => s.setShowNumbers);

    return (
        <Card className="grass-panel team-panel">
            <div className="grass-panel-title">
                <span>球队调参</span>
            </div>
            {/* 号码显隐（全局） */}
            <div className="marking-item">
                <Label className="param-label">球员号码</Label>
                <Switch
                    checked={showNumbers}
                    onCheckedChange={setShowNumbers}
                />
            </div>
            <Tabs defaultValue="home">
                <TabsList className="team-tabs">
                    {(Object.keys(TEAM_LABELS) as Team[]).map(team => (
                        <TabsTrigger key={team} value={team}>
                            {TEAM_LABELS[team]}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {(Object.keys(TEAM_LABELS) as Team[]).map(team => (
                    <TabsContent key={team} value={team}>
                        <TeamConfigForm team={team} />
                    </TabsContent>
                ))}
            </Tabs>
        </Card>
    );
}

/** 单队配置表单 */
function TeamConfigForm({ team }: { team: Team }) {
    const config = useTeamStore(s => s[team]);
    const setConfig = useTeamStore(s => s.setConfig);
    const otherConfig = useTeamStore(s => (team === 'home' ? s.away : s.home));
    const addTeam = usePlayerStore(s => s.addTeam);
    const teamCount = usePlayerStore(s =>
        s.players.filter(p => p.team === team).length,
    );

    /** 半区互斥：对方已选则本侧禁用 */
    const sideLocked = (side: TeamSide) => otherConfig.side === side;

    const renderColor = (
        label: string,
        value: string,
        onChange: (v: string) => void,
    ) => (
        <div className="param-row">
            <div className="param-header">
                <Label className="param-label">{label}</Label>
                <span className="param-value">{value}</span>
            </div>
            <input
                className="param-color"
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );

    return (
        <div className="team-form">
            {/* 本方半区 */}
            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">本方半区</Label>
                </div>
                <div className="param-btn-group">
                    {(['left', 'right'] as TeamSide[]).map(side => (
                        <Button
                            key={side}
                            size="sm"
                            variant={config.side === side ? 'default' : 'outline'}
                            disabled={sideLocked(side)}
                            title={
                                sideLocked(side)
                                    ? `对方球队已选择${side === 'left' ? '左' : '右'}半区`
                                    : undefined
                            }
                            onClick={() => setConfig(team, { side })}
                        >
                            {side === 'left' ? '左半区' : '右半区'}
                        </Button>
                    ))}
                </div>
            </div>

            {renderColor(
                '球员颜色',
                config.playerColor,
                v => setConfig(team, { playerColor: v }),
            )}
            {renderColor(
                '守门员颜色',
                config.gkColor,
                v => setConfig(team, { gkColor: v }),
            )}

            {/* 预设阵容 */}
            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">预设阵容</Label>
                </div>
                <Select
                    value={config.formation}
                    onValueChange={v => setConfig(team, { formation: v })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FORMATIONS.map(f => (
                            <SelectItem key={f.id} value={f.id}>
                                {f.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 一键添加（替换本队现有球员） */}
            <div className="param-btn-group">
                <Button size="sm" onClick={() => addTeam(team)}>
                    一键添加（{teamCount}/11）
                </Button>
            </div>
        </div>
    );
}

export default TeamPanel;
