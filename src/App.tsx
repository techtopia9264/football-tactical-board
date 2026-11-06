import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Button, TooltipProvider, SonnerToaster } from '@yizhiheizi/dud';
import { Layers } from 'lucide-react';
import Scene from './components/scene/Scene';
import Toolbar from './components/panel/Toolbar';
import GrassPanel from './components/panel/GrassPanel';
import MarkingPanel from './components/panel/MarkingPanel';
import PlayerPanel from './components/panel/PlayerPanel';
import TeamPanel from './components/panel/TeamPanel';
import PanPad from './components/panel/PanPad';
import DrawToolbar from './components/panel/DrawToolbar';
import DrawingPanel from './components/panel/DrawingPanel';
import LayersPanel from './components/panel/LayersPanel';
import { CAMERA_PRESETS, useCameraStore, type CameraPresetKey } from './store/cameraStore';
import {
    isDrawTool,
    toggleHighlightPanel,
    useToolStore,
    type ToolId,
} from './store/toolStore';
import { usePlayerStore } from './store/playerStore';
import { useDrawingStore } from './store/drawingStore';

/** 橡皮擦光标（SVG 白色橡皮擦 + 灰描边，热区在左下角擦除点） */
const ERASER_CURSOR = (() => {
    const svg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
        "<rect x='4' y='7' width='21' height='13' rx='3' transform='rotate(-25 14.5 13.5)' fill='#ffffff' stroke='#9ca3af' stroke-width='1.6'/>" +
        "<rect x='4' y='12' width='21' height='3' transform='rotate(-25 14.5 13.5)' fill='#e5e7eb'/>" +
        '</svg>';
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 6 25, cell`;
})();

/** 工具对应的鼠标光标 */
const TOOL_CURSORS: Record<ToolId, string> = {
    select: 'default',
    player: 'crosshair',
    arrow: 'crosshair',
    ellipse: 'crosshair',
    rect: 'crosshair',
    eraser: ERASER_CURSOR,
};

/** 配置面板类型（互斥：同时只显示一个） */
type ConfigPanel = 'grass' | 'marking' | 'team' | 'layers' | null;

function App() {
    const preset = useCameraStore(s => s.preset);
    const setPreset = useCameraStore(s => s.setPreset);
    const activeTool = useToolStore(s => s.activeTool);
    const displayMode = usePlayerStore(s => s.displayMode);
    const setDisplayMode = usePlayerStore(s => s.setDisplayMode);
    const selectedCount = usePlayerStore(s => s.selectedIds.length);
    const [configPanel, setConfigPanel] = useState<ConfigPanel>(null);

    /** 打开配置面板（互斥切换；打开时取消球员选中、退出划线模式） */
    const openPanel = (panel: Exclude<ConfigPanel, null>) => {
        if (configPanel === panel) {
            setConfigPanel(null);
        } else {
            setConfigPanel(panel);
            usePlayerStore.getState().select(null);
            useToolStore.getState().setTool('select');
        }
    };

    // 选中球员时自动关闭配置面板
    useEffect(() => {
        if (selectedCount > 0) setConfigPanel(null);
    }, [selectedCount]);

    // Backspace / Delete：删除选中的划线或球员（输入框聚焦时不触发）
    useEffect(() => {
        const isEditable = (target: EventTarget | null) => {
            const el = target as HTMLElement | null;
            return (
                !!el &&
                (el.tagName === 'INPUT' ||
                    el.tagName === 'TEXTAREA' ||
                    el.tagName === 'SELECT' ||
                    el.isContentEditable)
            );
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Backspace' && e.key !== 'Delete') return;
            if (isEditable(e.target)) return;
            const drawing = useDrawingStore.getState();
            const player = usePlayerStore.getState();
            if (drawing.selectedId) {
                e.preventDefault();
                drawing.removeDrawing(drawing.selectedId);
                drawing.select(null);
            } else if (player.selectedIds.length > 0) {
                e.preventDefault();
                player.selectedIds.forEach(id => player.removePlayer(id));
                player.select(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Cmd/Ctrl+Shift 工具快捷键（全部避开浏览器常用快捷键）
    // V 选择 / P 添加球员 / L 划线（再次按下退出）/ H 区域高亮 / E 橡皮擦
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod || !e.shiftKey) return;
            const t = useToolStore.getState();
            const key = e.key.toLowerCase();
            let handled = false;
            switch (key) {
                case 'v':
                    t.setTool('select');
                    handled = true;
                    break;
                case 'p':
                    t.setTool('player');
                    handled = true;
                    break;
                case 'l':
                    t.setTool(isDrawTool(t.activeTool) ? 'select' : 'arrow');
                    handled = true;
                    break;
                case 'h':
                    toggleHighlightPanel();
                    handled = true;
                    break;
                case 'e':
                    t.setTool('eraser');
                    handled = true;
                    break;
            }
            if (handled) e.preventDefault();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div className="app-root">
            <TooltipProvider>
            <div className="app-toolbar">
                <div className="app-toolbar-group">
                    <span className="app-toolbar-label">视角</span>
                    {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map(key => (
                        <Button
                            key={key}
                            size="sm"
                            variant={preset === key ? 'default' : 'outline'}
                            onClick={() => setPreset(preset === key ? null : key)}
                        >
                            {CAMERA_PRESETS[key].label}
                        </Button>
                    ))}
                </div>
                <span className="app-hint">左键旋转 · 滚轮缩放 · 右键平移</span>
                <div className="app-toolbar-spacer" />
                <div className="app-toolbar-group">
                    <Button
                        size="sm"
                        variant={displayMode === 'stickman' ? 'default' : 'outline'}
                        onClick={() => {
                            setDisplayMode('stickman');
                            useToolStore.getState().setTool('select');
                        }}
                    >
                        火柴人
                    </Button>
                    <Button
                        size="sm"
                        variant={displayMode === 'circle' ? 'default' : 'outline'}
                        onClick={() => {
                            setDisplayMode('circle');
                            useToolStore.getState().setTool('select');
                        }}
                    >
                        圆圈
                    </Button>
                    <Button
                        size="sm"
                        variant={configPanel === 'team' ? 'default' : 'outline'}
                        onClick={() => openPanel('team')}
                    >
                        球队调参
                    </Button>
                </div>
                <div className="app-toolbar-group">
                    <Button
                        size="sm"
                        variant={configPanel === 'layers' ? 'default' : 'outline'}
                        onClick={() => openPanel('layers')}
                    >
                        <Layers className="h-3.5 w-3.5" />
                        图层
                    </Button>
                    <Button
                        size="sm"
                        variant={configPanel === 'grass' ? 'default' : 'outline'}
                        onClick={() => openPanel('grass')}
                    >
                        草皮调参
                    </Button>
                    <Button
                        size="sm"
                        variant={configPanel === 'marking' ? 'default' : 'outline'}
                        onClick={() => openPanel('marking')}
                    >
                        球场调参
                    </Button>
                </div>
            </div>
            <div className="app-canvas" style={{ cursor: TOOL_CURSORS[activeTool] }}>
                <Toolbar />
                <Canvas camera={{ position: [0, 8.5, 8.5], fov: 50 }}>
                    <Scene />
                </Canvas>
                {configPanel === 'grass' && <GrassPanel />}
                {configPanel === 'marking' && <MarkingPanel />}
                {configPanel === 'team' && <TeamPanel />}
                <LayersPanel
                    open={configPanel === 'layers'}
                    onClose={() => setConfigPanel(null)}
                />
                <PlayerPanel />
                <DrawingPanel />
                <PanPad />
                <DrawToolbar />
            </div>
            <SonnerToaster position="top-center" />
            </TooltipProvider>
        </div>
    );
}

export default App;
