import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { PITCH_LENGTH, PITCH_WIDTH, PITCH_CONFIG } from '../../config/pitchConfig';
import {
    DRAWING_COLORS,
    useDrawingStore,
    type Drawing,
} from '../../store/drawingStore';
import { useToolStore, isDrawTool } from '../../store/toolStore';
import { usePlayerStore } from '../../store/playerStore';
import {
    buildDashSegments,
    buildDrawingPoints,
    findNearestDrawing,
} from '../../utils/drawingGeometry';
import { cursorManager } from '../../utils/cursorManager';

// hover 检测用的预分配对象（避免每帧 GC）
const _ndc = new THREE.Vector2();
const _hit = new THREE.Vector3();
const _plane = new THREE.Plane();
const _raycaster = new THREE.Raycaster();
const _up = new THREE.Vector3(0, 1, 0);

/** 由点集构建 LineGeometry（空点集返回 null） */
function buildGeometry(pts: THREE.Vector3[]): LineGeometry | null {
    if (pts.length < 2) return null;
    const g = new LineGeometry();
    g.setPositions(pts.flatMap(p => [p.x, p.y, p.z]));
    return g;
}

/**
 * 单条划线：实线 = 单个 Line2；虚线 = 手动切段多段 Line2（渲染稳定）。
 * 选中状态线宽加粗 50%（半透明会在折线拐角处叠加变浓，弃用）。
 */
const SELECTED_WIDTH_RATIO = 1.5;

function DrawingItem({
    drawing,
    selected,
}: {
    drawing: Drawing;
    selected: boolean;
}) {
    const planeY = useDrawingStore(s => s.planeY);

    // 空点集（椭圆/矩形半径过小）直接跳过渲染，避免 LineGeometry 空数组崩溃
    const pts = useMemo(() => buildDrawingPoints(drawing), [drawing]);

    // 实线单段 / 虚线多段
    const segs = useMemo(
        () => (drawing.style === 'dashed' ? buildDashSegments(pts) : [pts]),
        [drawing.style, pts],
    );

    // 共享材质（选中 → 加粗）
    const material = useMemo(
        () =>
            new LineMaterial({
                color: DRAWING_COLORS[drawing.color],
                linewidth:
                    PITCH_CONFIG.lineWidth * drawing.width * (selected ? SELECTED_WIDTH_RATIO : 1),
                worldUnits: true,
            }),
        [drawing.color, drawing.width, selected],
    );

    // 各段 Line2 实例
    const objs = useMemo(
        () =>
            segs
                .map(seg => buildGeometry(seg))
                .filter((g): g is LineGeometry => g !== null)
                .map(g => new Line2(g, material)),
        [segs, material],
    );

    // 卸载时释放 GPU 资源
    useEffect(
        () => () => {
            objs.forEach(o => o.geometry.dispose());
            material.dispose();
        },
        [objs, material],
    );

    if (objs.length === 0) return null;
    return (
        <group position={[0, planeY, 0]}>
            {objs.map((obj, i) => (
                <primitive key={i} object={obj} />
            ))}
        </group>
    );
}

/**
 * 划线图层：
 * - 渲染所有战术划线 + 选中白衬线
 * - select/eraser 模式下由透明交互平面做手动命中检测，命中划线后
 *   stopImmediatePropagation 阻止球员/地面事件，保证选中/删除可靠
 * - 鼠标悬停在划线上时显示手指光标（window 级移动监听 + 手动命中）
 */
function DrawLayer() {
    const drawings = useDrawingStore(s => s.drawings);
    const drawingsVisible = useDrawingStore(s => s.visible);
    const selectedId = useDrawingStore(s => s.selectedId);
    const planeY = useDrawingStore(s => s.planeY);
    const select = useDrawingStore(s => s.select);
    const removeDrawing = useDrawingStore(s => s.removeDrawing);
    const activeTool = useToolStore(s => s.activeTool);
    const setTool = useToolStore(s => s.setTool);
    const gl = useThree(s => s.gl);
    const camera = useThree(s => s.camera);

    // 悬停划线 → 手指光标（统一走 cursorManager，与球员抓取手势协调优先级；擦除模式不覆盖擦除光标）
    useEffect(() => {
        if (!drawingsVisible || (activeTool !== 'select' && !isDrawTool(activeTool))) {
            return;
        }
        const canvas = gl.domElement;
        const onMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            _ndc.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1,
            );
            _raycaster.setFromCamera(_ndc, camera);
            _plane.setFromNormalAndCoplanarPoint(_up, new THREE.Vector3(0, planeY, 0));
            if (_raycaster.ray.intersectPlane(_plane, _hit)) {
                const hit = findNearestDrawing(drawings, _hit.x, _hit.z);
                if (hit) {
                    cursorManager.set('drawing', 'pointer');
                } else {
                    cursorManager.clear('drawing');
                }
            }
        };
        window.addEventListener('pointermove', onMove);
        return () => {
            window.removeEventListener('pointermove', onMove);
            cursorManager.clear('drawing');
        };
    }, [activeTool, gl, camera, planeY, drawings, drawingsVisible]);

    // 橡皮擦擦除：按住拖动，经过划线/球员即删除（点击删除由交互平面处理）
    // erasing 状态放 ref：删除后 effect 重建不影响按下的连续性
    const erasingRef = useRef(false);
    useEffect(() => {
        if (!drawingsVisible || activeTool !== 'eraser') {
            erasingRef.current = false;
            return;
        }
        const canvas = gl.domElement;
        const down = () => {
            erasingRef.current = true;
        };
        const up = () => {
            erasingRef.current = false;
        };
        const onMove = (e: PointerEvent) => {
            if (!erasingRef.current) return;
            const rect = canvas.getBoundingClientRect();
            _ndc.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1,
            );
            _raycaster.setFromCamera(_ndc, camera);
            _plane.setFromNormalAndCoplanarPoint(_up, new THREE.Vector3(0, planeY, 0));
            if (!_raycaster.ray.intersectPlane(_plane, _hit)) return;
            // 优先擦划线
            const d = findNearestDrawing(drawings, _hit.x, _hit.z);
            if (d) {
                removeDrawing(d.id);
                return;
            }
            // 再擦球员（地面点距离 0.3 内）
            const players = usePlayerStore.getState().players;
            let bestId: string | null = null;
            let bestDist = 0.3;
            for (const pl of players) {
                const dist = Math.hypot(pl.position[0] - _hit.x, pl.position[1] - _hit.z);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestId = pl.id;
                }
            }
            if (bestId) usePlayerStore.getState().removePlayer(bestId);
        };
        window.addEventListener('pointerdown', down);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointermove', onMove);
        return () => {
            window.removeEventListener('pointerdown', down);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointermove', onMove);
        };
    }, [activeTool, gl, camera, planeY, drawings, drawingsVisible, removeDrawing]);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (activeTool !== 'select' && activeTool !== 'eraser') return;
        const hit = findNearestDrawing(drawings, e.point.x, e.point.z);
        if (!hit) return; // 未命中划线：放行给球员/地面
        e.stopPropagation(); // 阻止命中列表后续对象（球员/地面）的事件
        if (activeTool === 'select') {
            select(hit.id);
            usePlayerStore.getState().select(null);
            // 进入对应类型的划线模式（平面显示、按钮高亮），便于继续编辑/绘制
            setTool(hit.type);
        } else {
            removeDrawing(hit.id);
        }
    };

    // 图层隐藏：划线、选中态、交互全部失效
    if (!drawingsVisible) return null;

    return (
        <group>
            {/* select/eraser 模式的透明命中平面（不参与画线交互） */}
            {(activeTool === 'select' || activeTool === 'eraser') && (
                <mesh
                    position={[0, planeY, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onPointerDown={handlePointerDown}
                >
                    <planeGeometry args={[PITCH_LENGTH + 0.3, PITCH_WIDTH + 0.3]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}

            {drawings.map(d => (
                <DrawingItem key={d.id} drawing={d} selected={d.id === selectedId} />
            ))}
        </group>
    );
}

export default DrawLayer;
