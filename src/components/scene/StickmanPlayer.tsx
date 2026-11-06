import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { DEFAULT_POSE, type PlayerPose } from '../../config/playerPoses';
import { usePlayerStore } from '../../store/playerStore';

/** 髋部基础位置（z 偏移，贴近身体两侧边缘） */
const HIP_Z = 0.04;
/** 肩部基础位置（z 偏移，贴住宽肩） */
const SHOULDER_Z = 0.06;

interface StickmanPlayerProps {
    color: string;
    number: number;
    pose?: PlayerPose;
}

/**
 * 火柴人球员组件：圆头 + 粗壮身体 + 关节化手臂（肩关节：侧举/前后摆）+
 * 带膝关节的两段式腿（大腿/小腿/脚），头顶带球员编号。
 * 所有关节角度由 pose 参数驱动，支持预设动作（奔跑/踢球/庆祝等）。
 */
function StickmanPlayer({ color, number, pose = {} }: StickmanPlayerProps) {
    const showNumbers = usePlayerStore(s => s.showNumbers);
    const p = { ...DEFAULT_POSE, ...pose };
    const bodyMaterial = <meshStandardMaterial color={color} />;

    return (
        <group
            position={[0, p.height, 0]}
            rotation={[p.bodyX, 0, p.bodyZ]}
            scale={0.5}
        >
            {/* 躯干（头/脖子/身体/双臂；扭腰 twist 绕髋部 Y 轴 + torsoX 左右倾 + torsoZ 前后倾，保持腿连接） */}
            <group position={[0, 0.13, 0]} rotation={[0, -p.twist, 0]}>
                <group rotation={[p.torsoX, 0, p.torsoZ]}>
                <group position={[0, -0.13, 0]}>
                {/* 脖子（0.28 ~ 0.30，短） */}
                <mesh position={[0, 0.29, 0]}>
                    <cylinderGeometry args={[0.018, 0.018, 0.02, 10]} />
                    {bodyMaterial}
                </mesh>

                {/* 头（下缘嵌入脖子 0.012，衔接自然） */}
                <mesh position={[0, 0.348, 0]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    {bodyMaterial}
                </mesh>

                {/* 眼睛（两只黑点，竖直椭圆，贴在球面前方 +x，辨识头部朝向；无其他五官） */}
                <mesh position={[0.051, 0.354, 0.024]} scale={[1.1, 1.4, 0.85]}>
                    <sphereGeometry args={[0.0085, 8, 8]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>
                <mesh position={[0.051, 0.354, -0.024]} scale={[1.1, 1.4, 0.85]}>
                    <sphereGeometry args={[0.0085, 8, 8]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* 身体（上宽下窄的轻微锥形，0.13 ~ 0.28） */}
                <mesh position={[0, 0.205, 0]}>
                    <cylinderGeometry args={[0.048, 0.038, 0.15, 12]} />
                    {bodyMaterial}
                </mesh>

                {/* 左臂（肩关节组：侧举 armX + 前后摆 armZ，臂 + 手跟随） */}
                <group position={[0, 0.25, -SHOULDER_Z]} rotation={[p.leftArmX, 0, p.leftArmZ]}>
                    <mesh position={[0, -0.055, 0]}>
                        <cylinderGeometry args={[0.015, 0.015, 0.11, 8]} />
                        {bodyMaterial}
                    </mesh>
                    <mesh position={[0, -0.11, 0]}>
                        <sphereGeometry args={[0.018, 10, 10]} />
                        {bodyMaterial}
                    </mesh>
                </group>
                {/* 右臂（侧举方向与左臂取反：正值=外展，匹配面板"向内/向外"标签） */}
                <group position={[0, 0.25, SHOULDER_Z]} rotation={[-p.rightArmX, 0, p.rightArmZ]}>
                    <mesh position={[0, -0.055, 0]}>
                        <cylinderGeometry args={[0.015, 0.015, 0.11, 8]} />
                        {bodyMaterial}
                    </mesh>
                    <mesh position={[0, -0.11, 0]}>
                        <sphereGeometry args={[0.018, 10, 10]} />
                        {bodyMaterial}
                    </mesh>
                </group>

                    {/* 头顶编号（可全局关闭） */}
                    {showNumbers && (
                        <Html position={[0, 0.46, 0]} center zIndexRange={[10, 0]}>
                            <div className="player-number" style={{ background: color }}>
                                {number}
                            </div>
                        </Html>
                    )}
                </group>
                </group>
            </group>

            {/* 左腿（髋关节 → 大腿 → 膝关节 → 小腿 + 脚；开合方向取负：正值=张开，匹配面板"合/开"标签） */}
            <group position={[0, 0.13, HIP_Z]} rotation={[-p.leftHipX, 0, p.leftHipZ]}>
                <mesh position={[0, -0.03, 0]}>
                    <cylinderGeometry args={[0.02, 0.022, 0.06, 8]} />
                    {bodyMaterial}
                </mesh>
                {/* 膝关节 */}
                <mesh position={[0, -0.06, 0]}>
                    <sphereGeometry args={[0.022, 10, 10]} />
                    {bodyMaterial}
                </mesh>
                <group position={[0, -0.06, 0]} rotation={[0, 0, p.leftKnee]}>
                    <mesh position={[0, -0.035, 0]}>
                        <cylinderGeometry args={[0.018, 0.02, 0.07, 8]} />
                        {bodyMaterial}
                    </mesh>
                    {/* 脚（椭圆上半球 + 平底，固定在小腿末端；踝关节：上下/左右旋转 + 前后位置） */}
                    <mesh
                        position={[0.02 + p.leftFootShift, -0.07, 0]}
                        rotation={[p.leftAnkleX, 0, p.leftAnkleZ]}
                        scale={[1.6, 1, 1]}
                    >
                        <sphereGeometry args={[0.02, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            </group>

            {/* 右腿 */}
            <group position={[0, 0.13, -HIP_Z]} rotation={[p.rightHipX, 0, p.rightHipZ]}>
                <mesh position={[0, -0.03, 0]}>
                    <cylinderGeometry args={[0.02, 0.022, 0.06, 8]} />
                    {bodyMaterial}
                </mesh>
                <mesh position={[0, -0.06, 0]}>
                    <sphereGeometry args={[0.022, 10, 10]} />
                    {bodyMaterial}
                </mesh>
                <group position={[0, -0.06, 0]} rotation={[0, 0, p.rightKnee]}>
                    <mesh position={[0, -0.035, 0]}>
                        <cylinderGeometry args={[0.018, 0.02, 0.07, 8]} />
                        {bodyMaterial}
                    </mesh>
                    <mesh
                        position={[0.02 + p.rightFootShift, -0.07, 0]}
                        rotation={[p.rightAnkleX, 0, p.rightAnkleZ]}
                        scale={[1.6, 1, 1]}
                    >
                        <sphereGeometry args={[0.02, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

export default StickmanPlayer;
