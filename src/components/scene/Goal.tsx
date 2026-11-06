import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GOAL_CONFIG, LINE_Y, PITCH_LENGTH } from '../../config/pitchConfig';
import { useGoalStore } from '../../store/goalStore';

const GOAL_COLOR = '#ffffff';

/** 门框材质（白色受光） */
const GOAL_MATERIAL = new THREE.MeshStandardMaterial({
    color: GOAL_COLOR,
    roughness: 0.6,
});

/**
 * 生成球网网格纹理（Canvas 画白色网格线，透明背景）
 */
function createNetTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 5;
    const cell = size / 8;
    for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

/**
 * 四边形网格面（两三角形），UV 按世界坐标×uvScale 映射（网格密度均匀）
 */
function makeQuad(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    d: THREE.Vector3,
    uvScale: number,
): THREE.BufferGeometry {
    const positions = new Float32Array([
        ...a.toArray(),
        ...b.toArray(),
        ...c.toArray(),
        ...a.toArray(),
        ...c.toArray(),
        ...d.toArray(),
    ]);
    const uvs = new Float32Array([
        a.x * uvScale, a.y * uvScale,
        b.x * uvScale, b.y * uvScale,
        c.x * uvScale, c.y * uvScale,
        a.x * uvScale, a.y * uvScale,
        c.x * uvScale, c.y * uvScale,
        d.x * uvScale, d.y * uvScale,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    return geometry;
}

interface GoalProps {
    side: 'left' | 'right';
}

/**
 * 球门：白色粗圆柱立柱 + 横梁 + 固定球网（后网/顶网/两侧网）
 * 门框立在底线上，球网向后（场外方向）延伸成梯形笼
 */
function Goal({ side }: GoalProps) {
    const visible = useGoalStore(s => s.visible);
    const netOpacity = useGoalStore(s => s.netOpacity);
    const dir = side === 'left' ? -1 : 1; // 球门朝向（左门朝 -x，右门朝 +x）
    const hw = GOAL_CONFIG.width / 2;
    const xGoal = dir * (PITCH_LENGTH / 2);
    const xBack = dir * (PITCH_LENGTH / 2 + GOAL_CONFIG.netDepth);

    // 球网材质（网格纹理透明，四个网面共享；透明度由 store 同步）
    const netMaterial = useMemo(() => {
        const texture = createNetTexture();
        return new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.02,
            depthWrite: false,
            opacity: 1,
        });
    }, []);

    // 球网透明度同步
    useEffect(() => {
        netMaterial.opacity = netOpacity;
    }, [netMaterial, netOpacity]);

    // 后网：垂直面
    const backNet = useMemo(
        () =>
            makeQuad(
                new THREE.Vector3(xBack, 0, -hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, -hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, hw),
                new THREE.Vector3(xBack, 0, hw),
                GOAL_CONFIG.netUVScale,
            ),
        [xBack],
    );

    // 顶网：横梁上沿 → 后网顶沿（向后下方倾斜）
    const topNet = useMemo(
        () =>
            makeQuad(
                new THREE.Vector3(xGoal, GOAL_CONFIG.height, -hw),
                new THREE.Vector3(xGoal, GOAL_CONFIG.height, hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, -hw),
                GOAL_CONFIG.netUVScale,
            ),
        [xGoal, xBack],
    );

    // 两侧网：门框侧边 → 后网侧边（梯形）
    const leftNet = useMemo(
        () =>
            makeQuad(
                new THREE.Vector3(xGoal, 0, -hw),
                new THREE.Vector3(xGoal, GOAL_CONFIG.height, -hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, -hw),
                new THREE.Vector3(xBack, 0, -hw),
                GOAL_CONFIG.netUVScale,
            ),
        [xGoal, xBack],
    );
    const rightNet = useMemo(
        () =>
            makeQuad(
                new THREE.Vector3(xGoal, 0, hw),
                new THREE.Vector3(xGoal, GOAL_CONFIG.height, hw),
                new THREE.Vector3(xBack, GOAL_CONFIG.netBackHeight, hw),
                new THREE.Vector3(xBack, 0, hw),
                GOAL_CONFIG.netUVScale,
            ),
        [xGoal, xBack],
    );

    // 显隐控制（放在所有 hooks 之后，避免提前 return 破坏 hooks 顺序）
    if (!visible) return null;

    return (
        <group>
            {/* 立柱（左右） */}
            <mesh
                position={[xGoal, GOAL_CONFIG.height / 2, -hw]}
                material={GOAL_MATERIAL}
            >
                <cylinderGeometry args={[GOAL_CONFIG.postRadius, GOAL_CONFIG.postRadius, GOAL_CONFIG.height, 12]} />
            </mesh>
            <mesh
                position={[xGoal, GOAL_CONFIG.height / 2, hw]}
                material={GOAL_MATERIAL}
            >
                <cylinderGeometry args={[GOAL_CONFIG.postRadius, GOAL_CONFIG.postRadius, GOAL_CONFIG.height, 12]} />
            </mesh>
            {/* 横梁（沿 z 轴与底线平行，两端加长插入立柱，视觉无缝对接） */}
            <mesh
                position={[xGoal, GOAL_CONFIG.height, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                material={GOAL_MATERIAL}
            >
                <cylinderGeometry
                    args={[
                        GOAL_CONFIG.postRadius,
                        GOAL_CONFIG.postRadius,
                        GOAL_CONFIG.width + GOAL_CONFIG.postRadius * 2,
                        12,
                    ]}
                />
            </mesh>

            {/* 球网（后/顶/左/右四个面，略高于地面防 z-fighting） */}
            <mesh geometry={backNet} position={[0, LINE_Y, 0]} material={netMaterial} />
            <mesh geometry={topNet} position={[0, LINE_Y, 0]} material={netMaterial} />
            <mesh geometry={leftNet} position={[0, LINE_Y, 0]} material={netMaterial} />
            <mesh geometry={rightNet} position={[0, LINE_Y, 0]} material={netMaterial} />
        </group>
    );
}

export default Goal;
