import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { usePlayerStore } from '../../store/playerStore';

interface PlayerCircleProps {
    color: string;
    number: number;
}

/** 圆盘厚度（象棋式扁圆柱） */
const DISC_HEIGHT = 0.04;

/**
 * 生成号码圆盘纹理：队色圆底 + 白色描边 + 可选白色号码（Canvas 绘制）
 */
function createNumberTexture(
    number: number,
    color: string,
    showNumber: boolean,
): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    // 队色圆底
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // 白色描边
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();
    // 号码（可全局关闭）
    if (showNumber) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(size * 0.55)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(number), size / 2, size / 2 + 2);
    }

    return new THREE.CanvasTexture(canvas);
}

/**
 * 球员圆圈组件：象棋式扁圆柱（顶面 = 号码纹理，侧面 = 队色受光立体感）
 */
function PlayerCircle({ color, number }: PlayerCircleProps) {
    const showNumbers = usePlayerStore(s => s.showNumbers);

    // 号码/颜色/显隐变化时重建材质组
    const materials = useMemo(() => {
        const texture = createNumberTexture(number, color, showNumbers);
        return {
            texture,
            top: new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                roughness: 0.6,
            }),
            side: new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
            bottom: new THREE.MeshStandardMaterial({ color }),
        };
    }, [color, number, showNumbers]);

    useEffect(() => {
        return () => {
            materials.texture.dispose();
            materials.top.dispose();
            materials.side.dispose();
            materials.bottom.dispose();
        };
    }, [materials]);

    return (
        <mesh position={[0, DISC_HEIGHT / 2, 0]}>
            {/* 圆柱 groups：0=侧面 1=顶面 2=底面 */}
            <cylinderGeometry args={[0.16, 0.16, DISC_HEIGHT, 32]} />
            <primitive object={materials.side} attach="material-0" />
            <primitive object={materials.top} attach="material-1" />
            <primitive object={materials.bottom} attach="material-2" />
        </mesh>
    );
}

export default PlayerCircle;
