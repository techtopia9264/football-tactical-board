import { Card, Label, Switch } from '@yizhiheizi/dud';
import { MARKING_GROUPS, useMarkingsStore } from '../../store/markingsStore';
import { useGoalStore } from '../../store/goalStore';
import ParamSlider from './ParamSlider';

/**
 * 球场调参面板：球门（整体显隐/球网透明度）+ 各标线显隐
 */
function MarkingPanel() {
    const visible = useMarkingsStore(s => s.visible);
    const setVisible = useMarkingsStore(s => s.setVisible);
    const goalVisible = useGoalStore(s => s.visible);
    const setGoalVisible = useGoalStore(s => s.setVisible);
    const netOpacity = useGoalStore(s => s.netOpacity);
    const setNetOpacity = useGoalStore(s => s.setNetOpacity);

    return (
        <Card className="grass-panel marking-panel">
            <div className="grass-panel-title">
                <span>球场调参</span>
            </div>

            {/* 球门 */}
            <div className="marking-group">
                <div className="marking-group-label">球门</div>
                <div className="marking-item">
                    <Label className="param-label">球门</Label>
                    <Switch
                        checked={goalVisible}
                        onCheckedChange={setGoalVisible}
                    />
                </div>
                {goalVisible && (
                    <ParamSlider
                        label="球网透明度"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={netOpacity}
                        onChange={setNetOpacity}
                    />
                )}
            </div>

            {/* 标线 */}
            {MARKING_GROUPS.map(group => (
                <div key={group.id} className="marking-group">
                    <div className="marking-group-label">{group.label}</div>
                    {group.items.map(item => (
                        <div key={item.id} className="marking-item">
                            <Label className="param-label">{item.label}</Label>
                            <Switch
                                checked={visible[item.id]}
                                onCheckedChange={v => setVisible(item.id, v)}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </Card>
    );
}

export default MarkingPanel;
