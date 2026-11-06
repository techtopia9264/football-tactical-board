import { Button, Card } from '@yizhiheizi/dud';
import { X } from 'lucide-react';
import { HIGHLIGHT_ZONES, type ZoneState } from '../../config/highlightZones';
import { useHighlightStore } from '../../store/highlightStore';
import { useHighlightPanelStore } from '../../store/toolStore';

/** 区域状态选项 */
const STATE_OPTIONS: { value: ZoneState; label: string }[] = [
    { value: 'off', label: '关闭' },
    { value: 'solid', label: '高亮' },
    { value: 'flash', label: '闪动' },
];

/**
 * 场地高亮面板（右侧抽屉）：横向 5 条 + 纵向 3 块，每块独立 关闭/高亮/闪动。
 * 打开时取消球员选中，避免与球员面板重叠。
 */
function HighlightPanel() {
    const open = useHighlightPanelStore(s => s.open);
    const setOpen = useHighlightPanelStore(s => s.setOpen);
    const zones = useHighlightStore(s => s.zones);
    const setZoneState = useHighlightStore(s => s.setZoneState);

    if (!open) return null;

    return (
        <Card className="grass-panel highlight-panel">
            <div className="grass-panel-title">
                <span>场地高亮</span>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="app-hint">横向五等分 + 纵向三等分，每块独立设置</div>

            {(['横向', '纵向'] as const).map(group => (
                <div key={group} className="marking-group">
                    <div className="marking-group-label">{group}</div>
                    {HIGHLIGHT_ZONES.filter(z => z.group === group).map(zone => (
                        <div key={zone.id} className="highlight-item">
                            <span className="highlight-name">{zone.name}</span>
                            <div className="zone-state-btns">
                                {STATE_OPTIONS.map(opt => (
                                    <Button
                                        key={opt.value}
                                        size="sm"
                                        variant={
                                            (zones[zone.id] ?? 'off') === opt.value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setZoneState(zone.id, opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <div className="app-hint">闪动 = 闪烁两下后常亮</div>
        </Card>
    );
}

export default HighlightPanel;
