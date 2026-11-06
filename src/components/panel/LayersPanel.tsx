import { Button, Card, Switch } from '@yizhiheizi/dud';
import { X } from 'lucide-react';
import { useGrassStore } from '../../store/grassStore';
import { useMarkingsStore } from '../../store/markingsStore';
import { useGoalStore } from '../../store/goalStore';
import { usePlayerStore, type Team } from '../../store/playerStore';
import { useDrawingStore } from '../../store/drawingStore';
import { useHighlightStore } from '../../store/highlightStore';

/** 单行图层：名称 + 显隐开关 */
function LayerRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="marking-item">
            <span className="highlight-name">{label}</span>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

/**
 * 图层面板（右侧抽屉）：各内容层独立显隐。
 * 球员层按 全部/主队/客队 控制。
 */
function LayersPanel({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const grassVisible = useGrassStore(s => s.visible);
    const setGrassVisible = useGrassStore(s => s.setVisible);
    const markingMaster = useMarkingsStore(s => s.masterVisible);
    const setMarkingMaster = useMarkingsStore(s => s.setMasterVisible);
    const goalVisible = useGoalStore(s => s.visible);
    const setGoalVisible = useGoalStore(s => s.setVisible);
    const showHome = usePlayerStore(s => s.showHome);
    const showAway = usePlayerStore(s => s.showAway);
    const setShowTeam = usePlayerStore(s => s.setShowTeam);
    const setShowAll = usePlayerStore(s => s.setShowAll);
    const drawVisible = useDrawingStore(s => s.visible);
    const setDrawVisible = useDrawingStore(s => s.setVisible);
    const hlVisible = useHighlightStore(s => s.visible);
    const setHlVisible = useHighlightStore(s => s.setVisible);

    if (!open) return null;

    const allOn = showHome && showAway;
    const teamBtn = (team: Team, label: string, on: boolean) => (
        <Button
            key={team}
            size="sm"
            variant={on ? 'default' : 'outline'}
            onClick={() => setShowTeam(team, !on)}
        >
            {label}
        </Button>
    );

    return (
        <Card className="grass-panel layers-panel">
            <div className="grass-panel-title">
                <span>图层</span>
                <Button size="icon" variant="ghost" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="marking-group">
                <div className="marking-group-label">场景</div>
                <LayerRow
                    label="草皮"
                    checked={grassVisible}
                    onChange={setGrassVisible}
                />
                <LayerRow
                    label="球场标线"
                    checked={markingMaster}
                    onChange={setMarkingMaster}
                />
                <LayerRow
                    label="球门"
                    checked={goalVisible}
                    onChange={setGoalVisible}
                />
            </div>

            <div className="marking-group">
                <div className="marking-group-label">战术</div>
                <div className="highlight-item">
                    <span className="highlight-name">球员</span>
                    <div className="zone-state-btns">
                        <Button
                            size="sm"
                            variant={allOn ? 'default' : 'outline'}
                            onClick={() => setShowAll(!allOn)}
                        >
                            全部
                        </Button>
                        {teamBtn('home', '主队', showHome)}
                        {teamBtn('away', '客队', showAway)}
                    </div>
                </div>
                <LayerRow
                    label="战术划线"
                    checked={drawVisible}
                    onChange={setDrawVisible}
                />
                <LayerRow
                    label="区域高亮"
                    checked={hlVisible}
                    onChange={setHlVisible}
                />
            </div>
        </Card>
    );
}

export default LayersPanel;
