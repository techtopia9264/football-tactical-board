import { useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { DrawingType } from '../../store/drawingStore';
import { buildDrawingPoints } from '../../utils/drawingGeometry';

interface DrawingLineProps {
    type: DrawingType;
    start: [number, number];
    end: [number, number];
    color: string;
    /** 世界单位线宽 */
    width: number;
    dashed: boolean;
    onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * 战术划线折线渲染（Line2：世界单位线宽、虚线支持）。
 * 三种图形（箭头/圈/框）统一走 buildDrawingPoints 点集。
 */
function DrawingLine({
    type,
    start,
    end,
    color,
    width,
    dashed,
    onPointerDown,
}: DrawingLineProps) {
    // 空点集（如椭圆半径过小）直接跳过渲染，避免 LineGeometry 空数组崩溃
    const pts = useMemo(() => buildDrawingPoints({ type, start, end }), [type, start, end]);

    const geometry = useMemo(() => {
        if (pts.length < 2) return null;
        const g = new LineGeometry();
        g.setPositions(pts.flatMap(p => [p.x, p.y, p.z]));
        return g;
    }, [pts]);

    const material = useMemo(
        () =>
            new LineMaterial({
                color,
                linewidth: width,
                worldUnits: true,
                dashed,
                dashSize: 0.08,
                gapSize: 0.06,
            }),
        [color, width, dashed],
    );

    // Line2 实例（geometry/material 变化时重建；primitive 传递）
    const obj = useMemo(
        () => (geometry ? new Line2(geometry, material) : null),
        [geometry, material],
    );

    // 卸载时释放 GPU 资源
    useEffect(
        () => () => {
            geometry?.dispose();
            material.dispose();
        },
        [geometry, material],
    );

    if (!obj) return null;
    return <primitive object={obj} onPointerDown={onPointerDown} />;
}

export default DrawingLine;
