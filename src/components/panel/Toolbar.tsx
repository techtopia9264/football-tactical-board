import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@yizhiheizi/dud';
import { BoxSelect } from 'lucide-react';
import {
    TOOLS,
    DRAW_TOOLS,
    isDrawTool,
    toggleHighlightPanel,
    useToolStore,
    useHighlightPanelStore,
} from '../../store/toolStore';
import HighlightPanel from './HighlightPanel';

/** 单个工具按钮（图标 + 提示 + 可选快捷键说明） */
function ToolButton({
    label,
    icon: Icon,
    active,
    onClick,
    shortcut,
}: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    onClick: () => void;
    shortcut?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={active ? 'default' : 'ghost'}
                    size="icon"
                    onClick={onClick}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                {label}
                {shortcut && <span className="toolbar-shortcut">{shortcut}</span>}
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * 左侧工具栏：选择 / 添加球员 / 划线（点击展开 箭头线·圈·框）/
 * 区域高亮 / 橡皮擦。快捷键 Cmd/Ctrl+Shift+V/P/L/H/E。
 */
function Toolbar() {
    const activeTool = useToolStore(s => s.activeTool);
    const setTool = useToolStore(s => s.setTool);
    const highlightOpen = useHighlightPanelStore(s => s.open);
    const isDraw = isDrawTool(activeTool);
    const PenIcon = TOOLS[2].icon;

    return (
        <>
            <div className="toolbar">
                <ToolButton
                    label="选择"
                    icon={TOOLS[0].icon}
                    active={activeTool === 'select'}
                    onClick={() => setTool('select')}
                    shortcut="Cmd/Ctrl+Shift+V"
                />
                <ToolButton
                    label="添加球员"
                    icon={TOOLS[1].icon}
                    active={activeTool === 'player'}
                    onClick={() => setTool('player')}
                    shortcut="Cmd/Ctrl+Shift+P"
                />

                {/* 划线：点击进入箭头线模式，展开子选项 */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isDraw ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setTool(isDraw ? 'select' : 'arrow')}
                        >
                            <PenIcon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        划线
                        <span className="toolbar-shortcut">Cmd/Ctrl+Shift+L</span>
                    </TooltipContent>
                </Tooltip>

                {/* 划线子选项（箭头横划线 / 圈 / 框） */}
                {isDraw && (
                    <div className="toolbar-draw-sub">
                        {DRAW_TOOLS.map(t => (
                            <ToolButton
                                key={t.id}
                                label={t.label}
                                icon={t.icon}
                                active={activeTool === t.id}
                                onClick={() => setTool(t.id)}
                            />
                        ))}
                    </div>
                )}

                {/* 区域高亮 */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={highlightOpen ? 'default' : 'ghost'}
                            size="icon"
                            onClick={toggleHighlightPanel}
                        >
                            <BoxSelect className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        区域高亮
                        <span className="toolbar-shortcut">Cmd/Ctrl+Shift+H</span>
                    </TooltipContent>
                </Tooltip>

                <ToolButton
                    label="橡皮擦"
                    icon={TOOLS[3].icon}
                    active={activeTool === 'eraser'}
                    onClick={() => setTool('eraser')}
                    shortcut="Cmd/Ctrl+Shift+E"
                />
            </div>
            <HighlightPanel />
        </>
    );
}

export default Toolbar;
