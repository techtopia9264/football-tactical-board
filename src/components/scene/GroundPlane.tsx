import type { ThreeEvent } from '@react-three/fiber';
import { toast } from '@yizhiheizi/dud';
import { PITCH_LENGTH, PITCH_WIDTH, PITCH_MARGIN } from '../../config/pitchConfig';
import { usePlayerStore, MAX_PLAYERS } from '../../store/playerStore';
import { useToolStore } from '../../store/toolStore';

/**
 * 隐形交互地面：接收球场空白处的点击。
 * - 添加球员工具：点击放置新球员
 * - 其他工具：取消选中
 */
function GroundPlane() {
    const addPlayer = usePlayerStore(s => s.addPlayer);
    const select = usePlayerStore(s => s.select);
    const activeTool = useToolStore(s => s.activeTool);
    const mode = useToolStore(s => s.mode);

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (mode !== 'edit') return;
        e.stopPropagation();
        const pos: [number, number] = [e.point.x, e.point.z];
        if (activeTool === 'player') {
            const ok = addPlayer(pos);
            if (!ok) {
                toast(`球队已达 ${MAX_PLAYERS} 人上限，无法继续添加`);
            }
        } else {
            select(null);
        }
    };

    return (
        <mesh
            position={[0, 0.001, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={handleClick}
        >
            <planeGeometry
                args={[PITCH_LENGTH + PITCH_MARGIN * 2, PITCH_WIDTH + PITCH_MARGIN * 2]}
            />
        </mesh>
    );
}

export default GroundPlane;
