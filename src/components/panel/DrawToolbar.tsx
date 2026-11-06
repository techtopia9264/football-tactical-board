import { useEffect, useState } from 'react';
import {
    Button,
    Label,
    Slider,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@yizhiheizi/dud';
import { X, Eraser } from 'lucide-react';
import { DRAW_TOOLS, isDrawTool, useToolStore } from '../../store/toolStore';
import { useDrawingStore } from '../../store/drawingStore';

/** 划线平面高度范围（最低到火柴人脚踝，最高 +5m） */
const PLANE_Y_MIN = 0.03;
const PLANE_Y_MAX = 0.5;

/**
 * 划线模式浮动条（顶部居中）：当前工具名 + 划线平面高度调节 + 清空划线 + 退出。
 * 仅划线工具激活时显示。
 */
function DrawToolbar() {
    const activeTool = useToolStore(s => s.activeTool);
    const setTool = useToolStore(s => s.setTool);
    const planeY = useDrawingStore(s => s.planeY);
    const setPlaneY = useDrawingStore(s => s.setPlaneY);
    const drawingsCount = useDrawingStore(s => s.drawings.length);
    const clearDrawings = useDrawingStore(s => s.clearDrawings);
    const [clearOpen, setClearOpen] = useState(false);

    // Esc 退出划线模式
    useEffect(() => {
        if (!isDrawTool(activeTool)) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setTool('select');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeTool, setTool]);

    if (!isDrawTool(activeTool)) return null;

    const toolLabel = DRAW_TOOLS.find(t => t.id === activeTool)?.label ?? '';

    return (
        <div className="draw-toolbar">
            <div className="draw-toolbar-title">
                <span>
                    {toolLabel}
                    {drawingsCount > 0 && (
                        <span className="draw-toolbar-count">（{drawingsCount}）</span>
                    )}
                </span>
                <div className="draw-toolbar-actions">
                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={drawingsCount === 0}
                        title="清空划线"
                        onClick={() => setClearOpen(true)}
                    >
                        <Eraser className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setTool('select')}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">划线平面高度</Label>
                    <span className="param-value">{planeY.toFixed(2)}</span>
                </div>
                <Slider
                    value={[planeY]}
                    min={PLANE_Y_MIN}
                    max={PLANE_Y_MAX}
                    step={0.01}
                    onValueChange={v => setPlaneY(v[0])}
                />
                <div className="param-slider-labels">
                    <span>脚踝</span>
                    <span>+5m</span>
                </div>
            </div>
            <span className="app-hint">左键拖拽绘制 · Esc 退出</span>

            {/* 清空划线（二次确认） */}
            <Dialog open={clearOpen} onOpenChange={setClearOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>清空划线</DialogTitle>
                        <DialogDescription>
                            确认清空全部 {drawingsCount} 条划线？此操作不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                clearDrawings();
                                setClearOpen(false);
                            }}
                        >
                            清空
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DrawToolbar;
