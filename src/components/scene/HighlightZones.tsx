import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { HIGHLIGHT_ZONES } from '../../config/highlightZones';
import { useHighlightStore } from '../../store/highlightStore';

const ZONE_Y = 0.015; // 略高于标线（0.005），低于球员脚
const ZONE_OPACITY = 0.25; // 常亮透明度（浅绿，与草皮自然融合）
const FLASH_DURATION = 1; // 闪动时长（亮-灭-亮-灭，1 秒后常亮）
const FLASH_HZ = 4; // 闪烁频率（每秒亮灭交替次数）

/**
 * 8 块场地高亮区域（半透明平面，贴地）：
 * off 隐藏 / solid 常亮 / flash 闪烁两下后常亮。
 * 闪烁起点用组件内 ref 记录（clock 基准），与渲染时钟同源。
 */
function HighlightZones() {
    const zones = useHighlightStore(s => s.zones);
    const visible = useHighlightStore(s => s.visible);
    // 各区域 flash 动画起点（clock.elapsedTime 基准；HMR 后重新闪，可接受）
    const flashStartsRef = useRef<Record<string, number>>({});

    // 每块独立材质（opacity 动画互不影响）
    const materials = useMemo(
        () =>
            HIGHLIGHT_ZONES.map(
                () =>
                    new THREE.MeshBasicMaterial({
                        color: '#b8d98a',
                        transparent: true,
                        opacity: 0,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                    }),
            ),
        [],
    );

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        HIGHLIGHT_ZONES.forEach((zone, i) => {
            const state = zones[zone.id];
            const m = materials[i];
            if (!state || state === 'off') {
                m.opacity = 0;
                delete flashStartsRef.current[zone.id];
                return;
            }
            if (state === 'solid') {
                m.opacity = ZONE_OPACITY;
                delete flashStartsRef.current[zone.id];
                return;
            }
            // flash：首次进入记录起点，期间高频亮灭交替（亮两次），之后常亮
            if (flashStartsRef.current[zone.id] === undefined) {
                flashStartsRef.current[zone.id] = t;
            }
            const elapsed = t - flashStartsRef.current[zone.id];
            m.opacity =
                elapsed < FLASH_DURATION
                    ? Math.floor(elapsed * FLASH_HZ) % 2 === 0
                        ? ZONE_OPACITY
                        : 0
                    : ZONE_OPACITY;
        });
    });

    // 图层显隐（放在所有 hooks 之后，保持 hooks 顺序）
    if (!visible) return null;

    return (
        <group>
            {HIGHLIGHT_ZONES.map((zone, i) => {
                const [x1, z1, x2, z2] = zone.bounds;
                return (
                    <mesh
                        key={zone.id}
                        position={[(x1 + x2) / 2, ZONE_Y, (z1 + z2) / 2]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        material={materials[i]}
                    >
                        <planeGeometry args={[x2 - x1, z2 - z1]} />
                    </mesh>
                );
            })}
        </group>
    );
}

export default HighlightZones;
