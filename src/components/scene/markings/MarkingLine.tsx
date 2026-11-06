import { LINE_Y } from '../../../config/pitchConfig';

interface MarkingLineProps {
    start: [number, number]; // 起点世界坐标 [x, z]
    end: [number, number]; // 终点世界坐标 [x, z]
    width: number; // 线宽
}

/**
 * 球场标线 - 直线段（细长平面条，略高于草皮避免 z-fighting）
 */
function MarkingLine({ start, end, width }: MarkingLineProps) {
    const [x1, z1] = start;
    const [x2, z2] = end;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const angle = Math.atan2(z2 - z1, x2 - x1);

    return (
        <group position={[midX, LINE_Y, midZ]} rotation={[0, -angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[length, width]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

export default MarkingLine;
