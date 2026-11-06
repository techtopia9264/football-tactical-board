import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { cursorManager } from '../../utils/cursorManager';
import CameraRig from './CameraRig';
import GrassPlane from './GrassPlane';
import PitchMarkings from './PitchMarkings';
import Goal from './Goal';
import PlayerLayer from './PlayerLayer';
import GroundPlane from './GroundPlane';
import HighlightZones from './HighlightZones';
import DrawPlane from './DrawPlane';
import DrawLayer from './DrawLayer';
import { usePlayerStore } from '../../store/playerStore';
import { useToolStore, isDrawTool } from '../../store/toolStore';

/** 把 Canvas 元素注册到 cursorManager（全局光标统一管理） */
function CursorHost() {
    const gl = useThree(s => s.gl);
    useEffect(() => {
        cursorManager.attach(gl.domElement);
    }, [gl]);
    return null;
}

/**
 * 3D 场景根：灯光、草皮、球场标线、相机控制
 */
function Scene() {
    // 选中球员/划线模式下锁定视角（防止操作时误转视角）
    const hasSelection = usePlayerStore(s => s.selectedIds.length > 0);
    const activeTool = useToolStore(s => s.activeTool);

    return (
        <>
            {/* 灯光 */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[6, 10, 4]} intensity={1.6} />

            {/* 草皮（ShaderMaterial 程序化纹理） */}
            <GrassPlane />

            {/* 球场标线（FIFA 标准比例，组件化独立显隐） */}
            <PitchMarkings />

            {/* 球门（左右各一：白色立柱 + 横梁 + 固定球网） */}
            <Goal side="left" />
            <Goal side="right" />

            {/* 球员层 + 隐形交互地面 */}
            <PlayerLayer />
            <GroundPlane />

            {/* 场地高亮 + 战术划线 */}
            <HighlightZones />
            <DrawPlane />
            <DrawLayer />

            <CursorHost />
            <CameraRig />
            <OrbitControls
                makeDefault
                enabled={!hasSelection && !isDrawTool(activeTool) && activeTool !== 'eraser'}
                target={[0, 0, 0]}
                minDistance={2}
                maxDistance={30}
                maxPolarAngle={Math.PI * 0.49}
            />
        </>
    );
}

export default Scene;
