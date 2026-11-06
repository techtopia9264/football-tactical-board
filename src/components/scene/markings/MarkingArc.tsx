import { useMemo } from 'react';
import * as THREE from 'three';
import { LINE_Y } from '../../../config/pitchConfig';

interface MarkingArcProps {
    center: [number, number]; // 圆心世界坐标 [x, z]
    radius: number; // 弧半径（中线）
    width: number; // 线宽
    startAngle: number; // 起始角（世界坐标，弧度，+x 为 0，向 +z 为正）
    endAngle: number; // 结束角
    clockwise: boolean; // 世界坐标下从 startAngle 到 endAngle 是否顺时针
}

/**
 * 球场标线 - 圆弧（罚球弧、角球弧）
 *
 * 说明：Shape 坐标系 Y 轴在 rotation 后映射为世界 -Z，
 * 因此内部统一做镜像转换（角度取反、圆心 z 取反），
 * 调用方只需按世界坐标直观描述。
 */
function MarkingArc({ center, radius, width, startAngle, endAngle, clockwise }: MarkingArcProps) {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const inner = radius - width / 2;
        const outer = radius + width / 2;
        const sx = center[0];
        const sy = -center[1];

        // 镜像后：世界角度取反；世界顺时针 = 镜像逆时针，方向取反
        s.absarc(sx, sy, outer, -startAngle, -endAngle, !clockwise);
        s.absarc(sx, sy, inner, -endAngle, -startAngle, clockwise);
        s.closePath();
        return s;
    }, [center, radius, width, startAngle, endAngle, clockwise]);

    return (
        <mesh position={[0, LINE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <shapeGeometry args={[shape]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
    );
}

export default MarkingArc;
