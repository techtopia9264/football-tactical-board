import { create } from 'zustand';
import {
    MousePointer2,
    UserPlus,
    PenLine,
    MoveRight,
    Circle,
    Square,
    Eraser,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePlayerStore } from './playerStore';

/** 工具栏工具 id（划线三件套：arrow 箭头横划线 / ellipse 圈 / rect 框） */
export type ToolId =
    | 'select'
    | 'player'
    | 'arrow'
    | 'ellipse'
    | 'rect'
    | 'eraser';

/** 模式：编辑 / 演示 */
export type BoardMode = 'edit' | 'present';

export interface ToolDef {
    id: ToolId;
    label: string;
    icon: LucideIcon;
}

/** 划线工具子项（划线按钮展开的选项） */
export const DRAW_TOOLS: ToolDef[] = [
    { id: 'arrow', label: '箭头横划线', icon: MoveRight },
    { id: 'ellipse', label: '圈', icon: Circle },
    { id: 'rect', label: '框', icon: Square },
];

/** 工具栏定义（左侧竖排渲染） */
export const TOOLS: ToolDef[] = [
    { id: 'select', label: '选择', icon: MousePointer2 },
    { id: 'player', label: '添加球员', icon: UserPlus },
    { id: 'arrow', label: '划线', icon: PenLine },
    { id: 'eraser', label: '橡皮擦', icon: Eraser },
];

/** 判断工具是否属于划线模式 */
export const isDrawTool = (tool: ToolId) =>
    tool === 'arrow' || tool === 'ellipse' || tool === 'rect';

interface ToolState {
    activeTool: ToolId;
    mode: BoardMode;
    setTool: (tool: ToolId) => void;
    setMode: (mode: BoardMode) => void;
}

export const useToolStore = create<ToolState>(set => ({
    activeTool: 'select',
    mode: 'edit',
    setTool: activeTool => set({ activeTool }),
    setMode: mode => set({ mode }),
}));

/** 区域高亮面板开关（Toolbar / 快捷键共用） */
export const useHighlightPanelStore = create<{ open: boolean; setOpen: (open: boolean) => void }>(
    set => ({
        open: false,
        setOpen: open => set({ open }),
    }),
);

/** 打开/关闭区域高亮面板（打开时取消球员选中、退出划线模式） */
export const toggleHighlightPanel = () => {
    const { open, setOpen } = useHighlightPanelStore.getState();
    setOpen(!open);
    if (!open) {
        usePlayerStore.getState().select(null);
        useToolStore.getState().setTool('select');
    }
};
