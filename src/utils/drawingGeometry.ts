import * as THREE from 'three';
import type { Drawing } from '../store/drawingStore';

/** 箭头翅膀长度 */
const ARROW_WING_LEN = 0.28;
/** 箭头翅膀张角（弧度，±20°） */
const ARROW_WING_ANGLE = 0.35;
/** 圆角矩形圆角半径（相对短边比例） */
const RECT_CORNER_RATIO = 0.25;
const RECT_CORNER_MAX = 0.12;

/**
 * 根据划线生成平面折线点集（y=0，由外层 group 抬到划线平面高度）。
 * 三种图形统一输出单条连续折线（Line2 可渲染，箭头用折返路径表示翅膀）。
 */
export function buildDrawingPoints(
    d: Pick<Drawing, 'type' | 'start' | 'end'>,
): THREE.Vector3[] {
    const [ax, az] = d.start;
    const [bx, bz] = d.end;
    const v = (x: number, z: number) => new THREE.Vector3(x, 0, z);
    const Y_AXIS = new THREE.Vector3(0, 1, 0);

    if (d.type === 'arrow') {
        // 箭头横划线：A→B 主线，B 端箭头开口朝 A、尖部朝延长方向
        const dir = new THREE.Vector3(bx - ax, 0, bz - az);
        if (dir.lengthSq() < 1e-6) return [v(ax, az), v(bx, bz)];
        dir.normalize();
        const wingA = v(bx, bz).addScaledVector(
            dir.clone().applyAxisAngle(Y_AXIS, -ARROW_WING_ANGLE),
            -ARROW_WING_LEN,
        );
        const wingB = v(bx, bz).addScaledVector(
            dir.clone().applyAxisAngle(Y_AXIS, ARROW_WING_ANGLE),
            -ARROW_WING_LEN,
        );
        return [v(ax, az), v(bx, bz), wingA, v(bx, bz), wingB];
    }

    if (d.type === 'ellipse') {
        // 圈：以 A、B 为对角线的椭圆
        const cx = (ax + bx) / 2;
        const cz = (az + bz) / 2;
        const rx = Math.abs(bx - ax) / 2;
        const rz = Math.abs(bz - az) / 2;
        if (rx < 0.01 || rz < 0.01) return [];
        const curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
        const pts = curve.getPoints(64).map(p => v(p.x + cx, p.y + cz));
        pts.push(pts[0]); // 闭合
        return pts;
    }

    // 框：以 A、B 为对角线的圆角矩形（Shape 路径，x→x、y→z）
    const w = Math.abs(bx - ax);
    const h = Math.abs(bz - az);
    if (w < 0.02 || h < 0.02) return [];
    const x0 = Math.min(ax, bx);
    const x1 = Math.max(ax, bx);
    const z0 = Math.min(az, bz);
    const z1 = Math.max(az, bz);
    const r = Math.min(RECT_CORNER_MAX, w * RECT_CORNER_RATIO, h * RECT_CORNER_RATIO);
    const shape = new THREE.Shape();
    shape.moveTo(x0 + r, z0);
    shape.lineTo(x1 - r, z0);
    shape.absarc(x1 - r, z0 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(x1, z1 - r);
    shape.absarc(x1 - r, z1 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(x0 + r, z1);
    shape.absarc(x0 + r, z1 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(x0, z0 + r);
    shape.absarc(x0 + r, z0 + r, r, Math.PI, (Math.PI * 3) / 2, false);
    const pts = shape.getPoints(80).map(p => v(p.x, p.y));
    pts.push(pts[0]); // 闭合
    return pts;
}

/** 点到线段距离（2D） */
function pointToSegmentDist(
    px: number,
    pz: number,
    ax: number,
    az: number,
    bx: number,
    bz: number,
): number {
    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1e-9) return Math.hypot(px - ax, pz - az);
    let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** 点到折线的最短距离（2D；点数不足返回 Infinity） */
export function pointToPolylineDist(
    x: number,
    z: number,
    pts: THREE.Vector3[],
): number {
    if (pts.length < 2) return Infinity;
    let min = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
        const d = pointToSegmentDist(
            x,
            z,
            pts[i].x,
            pts[i].z,
            pts[i + 1].x,
            pts[i + 1].z,
        );
        if (d < min) min = d;
    }
    return min;
}

/** 划线命中检测所需的最小字段 */
export interface DrawingHitTarget {
    id: string;
    type: Drawing['type'];
    start: [number, number];
    end: [number, number];
}

/** 虚线参数（世界单位） */
export const DASH_LEN = 0.25;
export const DASH_GAP = 0.15;

/**
 * 沿折线按「段长-间隔」切分为多段折线（手动虚线，渲染稳定）。
 * - 曲线段内按 0.06 间隔采样插值，弧线平滑
 * - 闭合图形（椭圆/矩形）起始相位偏移，使接缝处落在间隔中点，视觉无缝
 */
export function buildDashSegments(
    pts: THREE.Vector3[],
    dashLen = DASH_LEN,
    gapLen = DASH_GAP,
): THREE.Vector3[][] {
    if (pts.length < 2) return [];
    // 闭合检测（首尾点重合，去掉重复尾点后按环切分）
    const closed = pts[0].distanceTo(pts[pts.length - 1]) < 1e-6;
    const path = closed ? pts.slice(0, -1) : pts;
    if (path.length < 2) return [];

    // 路径参数化：累计长度数组
    const cum: number[] = [0];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
        total += path[i - 1].distanceTo(path[i]);
        cum.push(total);
    }
    if (total < 1e-6) return [];

    /** 路径坐标插值：s ∈ [0, total] → 点 */
    const pointAt = (s: number): THREE.Vector3 => {
        if (s <= 0) return path[0].clone();
        if (s >= total) return path[path.length - 1].clone();
        for (let i = 0; i < cum.length - 1; i++) {
            if (s <= cum[i + 1]) {
                const segLen = cum[i + 1] - cum[i];
                const t = segLen > 1e-9 ? (s - cum[i]) / segLen : 0;
                return path[i].clone().lerp(path[i + 1], Math.max(0, Math.min(1, t)));
            }
        }
        return path[path.length - 1].clone();
    };

    const P = dashLen + gapLen;
    // 闭合时起始相位偏移：让接缝（起点=终点）落在间隙中点，视觉无缝
    let s = closed ? (((total - P / 2) % P) + P) % P : 0;
    let isDash = closed ? s <= dashLen : true;

    const segments: THREE.Vector3[][] = [];
    while (s < total) {
        if (isDash) {
            const end = Math.min(s + dashLen, total);
            if (end - s > 1e-6) {
                // 段内按密度采样，保证弧线平滑
                const n = Math.max(2, Math.ceil((end - s) / 0.06));
                const seg: THREE.Vector3[] = [];
                for (let i = 0; i <= n; i++) {
                    seg.push(pointAt(s + ((end - s) * i) / n));
                }
                segments.push(seg);
            }
            s = end;
        } else {
            s = Math.min(s + gapLen, total);
        }
        isDash = !isDash;
    }
    return segments;
}

/** 找到点击位置最近的划线（阈值内未命中返回 null） */
export function findNearestDrawing<T extends DrawingHitTarget>(
    drawings: T[],
    x: number,
    z: number,
    threshold = 0.25,
): T | null {
    let best: T | null = null;
    let bestDist = threshold;
    for (const d of drawings) {
        const dist = pointToPolylineDist(x, z, buildDrawingPoints(d));
        if (dist < bestDist) {
            bestDist = dist;
            best = d;
        }
    }
    return best;
}
