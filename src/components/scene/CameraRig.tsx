import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraStore, CAMERA_PRESETS } from '../../store/cameraStore';
import { usePanStore, PAN_F, PAN_B, PAN_L, PAN_R } from '../../store/panStore';

const ARRIVE_THRESHOLD = 0.01; // 到达目标判定阈值
const PAN_SPEED = 2.5; // 平移速度（单位/秒）
const PAN_SHOW_DISTANCE = 7; // 相机距离小于该值时显示平移控制器
const PAN_CLAMP_X = 6.5; // 镜头 target 平移边界（球场 10.5 宽 + 余量）
const PAN_CLAMP_Z = 4.5; // 镜头 target 平移边界（球场 6.8 宽 + 余量）

// 平移方向计算用的临时向量（预分配，避免每帧 GC）
const _fwd = new Vector3();
const _right = new Vector3();
const _move = new Vector3();

/**
 * 相机预设视角控制：切换 preset 时平滑过渡到目标位置与朝向，
 * 用户手动拖拽 OrbitControls 时自动打断过渡。
 * 放大到阈值距离以下后，支持 WASD / 十字控制器沿球场平面平移镜头。
 */
function CameraRig() {
    const preset = useCameraStore(s => s.preset);
    const dirs = usePanStore(s => s.dirs);
    const setZoomed = usePanStore(s => s.setZoomed);
    const { camera, controls } = useThree();
    const orbitControls = controls as OrbitControlsImpl | null;
    const goalRef = useRef<{ pos: Vector3; lookAt: Vector3 } | null>(null);
    const zoomedRef = useRef(false);

    // preset 变化时设置过渡目标
    useEffect(() => {
        if (!preset) return;
        const p = CAMERA_PRESETS[preset];
        goalRef.current = {
            pos: new Vector3(...p.position),
            lookAt: new Vector3(...p.lookAt),
        };
    }, [preset]);

    // 用户手动拖拽（start 事件）时打断自动过渡
    useEffect(() => {
        if (!orbitControls) return;
        const stopTransition = () => {
            goalRef.current = null;
        };
        orbitControls.addEventListener('start', stopTransition);
        return () => {
            orbitControls.removeEventListener('start', stopTransition);
        };
    }, [orbitControls]);

    // WASD 键盘平移（输入框聚焦时不触发）
    useEffect(() => {
        const keyMap: Record<string, number> = {
            w: PAN_F,
            s: PAN_B,
            a: PAN_L,
            d: PAN_R,
        };
        const isEditable = (target: EventTarget | null) => {
            const el = target as HTMLElement | null;
            return (
                !!el &&
                (el.tagName === 'INPUT' ||
                    el.tagName === 'TEXTAREA' ||
                    el.tagName === 'SELECT' ||
                    el.isContentEditable)
            );
        };
        const down = (e: KeyboardEvent) => {
            if (isEditable(e.target)) return;
            const flag = keyMap[e.key.toLowerCase()];
            if (flag) usePanStore.getState().setDir(flag, true);
        };
        const up = (e: KeyboardEvent) => {
            const flag = keyMap[e.key.toLowerCase()];
            if (flag) usePanStore.getState().setDir(flag, false);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    useFrame((_, delta) => {
        if (!orbitControls) return;

        // 更新"是否放大到显示控制器"状态（边界翻转时才触发 zustand 更新）
        const dist = camera.position.distanceTo(orbitControls.target);
        const zoomed = dist < PAN_SHOW_DISTANCE;
        if (zoomed !== zoomedRef.current) {
            zoomedRef.current = zoomed;
            setZoomed(zoomed);
        }

        // 按当前方向组合平移镜头（目标 + 相机同步移动，保持俯仰角）
        if (dirs) {
            // 前进方向 = 相机视线在水平面的投影（俯视时视线退化，回退 -z）
            camera.getWorldDirection(_fwd);
            _fwd.y = 0;
            if (_fwd.lengthSq() < 0.01) _fwd.set(0, 0, -1);
            _fwd.normalize();
            _right.set(-_fwd.z, 0, _fwd.x); // 水平右向量（fwd 绕 Y 轴 +90°；D 向屏幕右侧移动）

            _move.set(0, 0, 0);
            if (dirs & PAN_F) _move.add(_fwd);
            if (dirs & PAN_B) _move.sub(_fwd);
            if (dirs & PAN_R) _move.add(_right);
            if (dirs & PAN_L) _move.sub(_right);
            _move.normalize().multiplyScalar(PAN_SPEED * delta);

            // target 与相机同步平移，并限制在球场附近范围
            const t = orbitControls.target;
            t.x = Math.max(-PAN_CLAMP_X, Math.min(PAN_CLAMP_X, t.x + _move.x));
            t.z = Math.max(-PAN_CLAMP_Z, Math.min(PAN_CLAMP_Z, t.z + _move.z));
            camera.position.add(_move);
            orbitControls.update();
            goalRef.current = null; // 手动平移打断相机预设过渡
        }

        // 预设视角过渡
        const goal = goalRef.current;
        if (!goal) return;

        // 帧率无关插值
        const alpha = 1 - Math.pow(0.001, delta);
        camera.position.lerp(goal.pos, alpha);
        orbitControls.target.lerp(goal.lookAt, alpha);
        orbitControls.update();

        // 到达目标后对齐并结束过渡
        if (camera.position.distanceTo(goal.pos) < ARRIVE_THRESHOLD) {
            camera.position.copy(goal.pos);
            orbitControls.target.copy(goal.lookAt);
            orbitControls.update();
            goalRef.current = null;
        }
    });

    return null;
}

export default CameraRig;
