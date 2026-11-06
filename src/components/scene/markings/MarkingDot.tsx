import { LINE_Y } from '../../../config/pitchConfig';

interface MarkingDotProps {
    position: [number, number]; // 世界坐标 [x, z]
    radius: number; // 圆点半径
}

/**
 * 球场标线 - 圆点（点球点）
 */
function MarkingDot({ position, radius }: MarkingDotProps) {
    return (
        <mesh position={[position[0], LINE_Y, position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 24]} />
            <meshBasicMaterial color="#ffffff" />
        </mesh>
    );
}

export default MarkingDot;
