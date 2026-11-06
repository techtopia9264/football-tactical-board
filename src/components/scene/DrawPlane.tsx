import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { PITCH_LENGTH, PITCH_WIDTH } from '../../config/pitchConfig';
import {
    DEFAULT_DRAW_WIDTH,
    useDrawingStore,
    type DrawingType,
} from '../../store/drawingStore';
import { useToolStore, isDrawTool } from '../../store/toolStore';
import { usePlayerStore } from '../../store/playerStore';
import { findNearestDrawing } from '../../utils/drawingGeometry';
import DrawingLine from './DrawingLine';

/**
 * 划线平面：划线模式下显示在球场上方的浅黄色半透明平面，
 * 左键拖拽绘制划线（箭头/圈/框），带实时预览，松手提交。
 */
function DrawPlane() {
    const planeY = useDrawingStore(s => s.planeY);
    const addDrawing = useDrawingStore(s => s.addDrawing);
    const drawings = useDrawingStore(s => s.drawings);
    const select = useDrawingStore(s => s.select);
    const activeTool = useToolStore(s => s.activeTool);
    const camera = useThree(s => s.camera);
    const gl = useThree(s => s.gl);

    const [preview, setPreview] = useState<{
        type: DrawingType;
        start: [number, number];
        end: [number, number];
    } | null>(null);
    const startRef = useRef<[number, number] | null>(null);

    // 射线与划线平面求交的临时对象（预分配）
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const hitPlane = useMemo(() => new THREE.Plane(), []);
    const hitPoint = useMemo(() => new THREE.Vector3(), []);

    /** 屏幕坐标 → 划线平面坐标 [x, z]（按画布实际区域换算，避免顶栏偏移） */
    const screenToPlane = (clientX: number, clientY: number): [number, number] | null => {
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        hitPlane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, planeY, 0),
        );
        if (raycaster.ray.intersectPlane(hitPlane, hitPoint)) {
            return [hitPoint.x, hitPoint.z];
        }
        return null;
    };

    // 拖拽监听（window 级，与球员拖拽同模式，防止丢失事件）
    const moveRef = useRef<(e: PointerEvent) => void>(() => {});
    const upRef = useRef<(e: PointerEvent) => void>(() => {});
    moveRef.current = (e: PointerEvent) => {
        if (!startRef.current) return;
        const p = screenToPlane(e.clientX, e.clientY);
        if (p) {
            setPreview({
                type: useToolStore.getState().activeTool as DrawingType,
                start: startRef.current,
                end: p,
            });
        }
    };
    upRef.current = (e: PointerEvent) => {
        if (!startRef.current) return;
        const p = screenToPlane(e.clientX, e.clientY);
        const a = startRef.current;
        startRef.current = null;
        setPreview(null);
        if (p && Math.hypot(p[0] - a[0], p[1] - a[1]) > 0.05) {
            // 默认白色实线；画完自动选中（便于直接编辑属性）
            const id = addDrawing({
                type: useToolStore.getState().activeTool as DrawingType,
                start: a,
                end: p,
                color: 'white',
                style: 'solid',
                width: DEFAULT_DRAW_WIDTH,
            });
            select(id);
            usePlayerStore.getState().select(null);
        }
    };
    useEffect(() => {
        const m = (e: PointerEvent) => moveRef.current(e);
        const u = (e: PointerEvent) => upRef.current(e);
        window.addEventListener('pointermove', m);
        window.addEventListener('pointerup', u);
        return () => {
            window.removeEventListener('pointermove', m);
            window.removeEventListener('pointerup', u);
        };
    }, []);

    if (!isDrawTool(activeTool)) return null;

    const onDown = (e: ThreeEvent<PointerEvent>) => {
        if (!isDrawTool(activeTool)) return;
        e.stopPropagation();
        // 点中已有划线 → 直接选中（打开编辑面板），不开始画新线
        const hit = findNearestDrawing(drawings, e.point.x, e.point.z);
        if (hit) {
            select(hit.id);
            usePlayerStore.getState().select(null);
            return;
        }
        startRef.current = [e.point.x, e.point.z];
        setPreview({
            type: activeTool as DrawingType,
            start: startRef.current,
            end: startRef.current,
        });
    };

    return (
        <group>
            {/* 划线平面（浅黄色半透明，调试用；不参与其他交互） */}
            <mesh
                position={[0, planeY, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerDown={onDown}
            >
                <planeGeometry args={[PITCH_LENGTH + 0.3, PITCH_WIDTH + 0.3]} />
                <meshBasicMaterial
                    color="#f5e6a8"
                    transparent
                    opacity={0.15}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* 拖拽预览（黑色，跟随鼠标） */}
            {preview && (
                <group position={[0, planeY, 0]}>
                    <DrawingLine
                        type={preview.type}
                        start={preview.start}
                        end={preview.end}
                        color="#1a1a1a"
                        width={0.025}
                        dashed={false}
                    />
                </group>
            )}
        </group>
    );
}

export default DrawPlane;
