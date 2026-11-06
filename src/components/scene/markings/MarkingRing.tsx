import * as THREE from 'three';
import { LINE_Y } from '../../../config/pitchConfig';

interface MarkingRingProps {
    center: [number, number]; // 圆心世界坐标 [x, z]
    radius: number; // 圆半径（中线）
    width: number; // 线宽
}

/**
 * 球场标线 - 圆环（中圈）
 */
function MarkingRing({ center, radius, width }: MarkingRingProps) {
    return (
        <mesh position={[center[0], LINE_Y, center[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - width / 2, radius + width / 2, 96]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
    );
}

export default MarkingRing;
