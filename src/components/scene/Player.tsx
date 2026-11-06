import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { usePlayerStore, type Player as PlayerData } from '../../store/playerStore';
import { useToolStore } from '../../store/toolStore';
import { cursorManager } from '../../utils/cursorManager';
import StickmanPlayer from './StickmanPlayer';
import PlayerCircle from './PlayerCircle';

/** 地面平面（y=0，用于射线求交） */
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/** 选中三角形（等腰，顶角朝 +x 局部方向 = 球员朝向） */
const SELECT_TRIANGLE = (() => {
    const s = new THREE.Shape();
    s.moveTo(0.32, 0); // 顶角（朝向）
    s.lineTo(-0.2, 0.3); // 左下
    s.lineTo(-0.2, -0.3); // 右下
    s.closePath();
    return s;
})();

/**
 * 球员外壳：位置、朝向（主体跟随）、选中三角形（贴地含朝向指示线）、
 * 交互（选择/多选/拖拽/删除）。拖拽用 window 级监听 + Raycaster 求交，
 * 指针移出球员后依然跟随。
 */
function Player({ player }: { player: PlayerData }) {
    const globalDisplayMode = usePlayerStore(s => s.displayMode);
    // 球员自己的展示方式优先，否则跟随全局
    const displayMode = player.displayMode ?? globalDisplayMode;
    const selected = usePlayerStore(s => s.selectedIds.includes(player.id));
    const select = usePlayerStore(s => s.select);
    const movePlayer = usePlayerStore(s => s.movePlayer);
    const removePlayer = usePlayerStore(s => s.removePlayer);
    const mode = useToolStore(s => s.mode);
    const activeTool = useToolStore(s => s.activeTool);
    const { camera, gl } = useThree();
    const dragging = useRef(false);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const hitVec = useMemo(() => new THREE.Vector3(), []);
    const color = player.color;
    const facing = player.facing;

    /** 屏幕坐标 → NDC */
    const clientToNDC = (clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
        );
    };

    /** 拖拽：window 级指针监听，指针在任意位置都跟随（不依赖命中球员） */
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging.current) return;
            const ndc = clientToNDC(e.clientX, e.clientY);
            raycaster.setFromCamera(ndc, camera);
            if (raycaster.ray.intersectPlane(GROUND_PLANE, hitVec)) {
                movePlayer(player.id, [hitVec.x, hitVec.z]);
            }
        };
        const onPointerUp = () => {
            dragging.current = false;
            // 不恢复视角：选中状态下视角保持锁定，取消选中后由 Scene 恢复
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [camera, gl, hitVec, movePlayer, player.id, raycaster]);

    /** 点击分派：选择工具单选/Ctrl 多选切换，橡皮擦删除 */
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (mode !== 'edit') return;
        if (activeTool === 'select') {
            select(player.id, e.ctrlKey || e.shiftKey || e.metaKey);
        } else if (activeTool === 'eraser') {
            removePlayer(player.id);
        }
    };

    /** 拖拽开始（仅编辑模式 + 选择工具；视角锁定由选中状态统一控制） */
    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (mode !== 'edit' || activeTool !== 'select') return;
        e.stopPropagation();
        select(player.id);
        dragging.current = true;
    };

    /** 悬停：抓取手势（擦除模式保持橡皮擦光标，不覆盖） */
    const handlePointerOver = () => {
        if (mode !== 'edit') return;
        if (activeTool === 'eraser') return;
        cursorManager.set('player', 'grab');
    };
    const handlePointerOut = () => cursorManager.clear('player');

    // 卸载（删除球员/切换模式）时清理光标，避免残留
    useEffect(() => () => cursorManager.clear('player'), []);

    return (
        <group position={[player.position[0], 0, player.position[1]]}>
            {/* 选中三角形（顶角指向朝向，半透明，贴地在圆盘之下）+ 深绿朝向指示线 */}
            {selected && (
                <group position={[0, 0.002, 0]} rotation={[0, facing, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <shapeGeometry args={[SELECT_TRIANGLE]} />
                        <meshBasicMaterial color="#facc15" transparent opacity={0.45} />
                    </mesh>
                    {/* 朝向指示线：球员中心 → 三角形顶角（深绿粗线） */}
                    <mesh position={[0.13, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.26, 0.035]} />
                        <meshBasicMaterial color="#166534" />
                    </mesh>
                </group>
            )}

            {/* 可视主体（朝向跟随，可交互：点击/开始拖拽/hover 抓取） */}
            <group
                rotation={[0, facing, 0]}
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                {displayMode === 'stickman' ? (
                    <StickmanPlayer
                        color={color}
                        number={player.number}
                        pose={player.pose}
                    />
                ) : (
                    <PlayerCircle color={color} number={player.number} />
                )}
            </group>
        </group>
    );
}

export default Player;
