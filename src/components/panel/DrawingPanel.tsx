import { Card, Button, Label, Slider } from '@yizhiheizi/dud';
import { X, Trash2 } from 'lucide-react';
import {
    DRAWING_COLORS,
    DRAWING_COLOR_LIST,
    useDrawingStore,
    type Drawing,
} from '../../store/drawingStore';

/** 类型中文名 */
const TYPE_LABELS: Record<Drawing['type'], string> = {
    arrow: '箭头横划线',
    ellipse: '圈',
    rect: '框',
};

/**
 * 选中划线配置面板：颜色（红橙黄绿青蓝紫）/ 线样式（实线/虚线）/
 * 粗细（球场标线宽的 0.5~2 倍）/ 删除
 */
function DrawingPanel() {
    const drawing = useDrawingStore(s =>
        s.drawings.find(d => d.id === s.selectedId),
    );
    const updateDrawing = useDrawingStore(s => s.updateDrawing);
    const removeDrawing = useDrawingStore(s => s.removeDrawing);
    const select = useDrawingStore(s => s.select);

    if (!drawing) return null;

    return (
        <Card className="grass-panel drawing-panel">
            <div className="grass-panel-title">
                <span>划线设置（{TYPE_LABELS[drawing.type]}）</span>
                <Button size="icon" variant="ghost" onClick={() => select(null)}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">颜色</Label>
                </div>
                <div className="draw-color-btns">
                    {DRAWING_COLOR_LIST.map(c => (
                        <button
                            key={c}
                            className={`draw-color-btn${drawing.color === c ? ' active' : ''}`}
                            style={{
                                background: DRAWING_COLORS[c],
                                // 白色色块加浅灰边，避免在面板上不可见
                                ...(c === 'white' ? { borderColor: '#d1d5db' } : {}),
                            }}
                            title={c}
                            onClick={() => updateDrawing(drawing.id, { color: c })}
                        />
                    ))}
                </div>
            </div>

            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">线样式</Label>
                </div>
                <div className="param-btn-group">
                    <Button
                        size="sm"
                        variant={drawing.style === 'solid' ? 'default' : 'outline'}
                        onClick={() => updateDrawing(drawing.id, { style: 'solid' })}
                    >
                        实线
                    </Button>
                    <Button
                        size="sm"
                        variant={drawing.style === 'dashed' ? 'default' : 'outline'}
                        onClick={() => updateDrawing(drawing.id, { style: 'dashed' })}
                    >
                        虚线
                    </Button>
                </div>
            </div>

            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">粗细</Label>
                    <span className="param-value">{drawing.width.toFixed(2)}x</span>
                </div>
                <Slider
                    value={[drawing.width]}
                    min={2}
                    max={5}
                    step={0.1}
                    onValueChange={v => updateDrawing(drawing.id, { width: v[0] })}
                />
                <div className="param-slider-labels">
                    <span>2x</span>
                    <span>5x</span>
                </div>
            </div>

            <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                    removeDrawing(drawing.id);
                    select(null);
                }}
            >
                <Trash2 className="h-3.5 w-3.5" />
                删除划线
            </Button>
        </Card>
    );
}

export default DrawingPanel;
