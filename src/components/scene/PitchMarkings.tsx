import { PITCH_CONFIG } from '../../config/pitchConfig';
import { useMarkingsStore } from '../../store/markingsStore';
import MarkingLine from './markings/MarkingLine';
import MarkingRing from './markings/MarkingRing';
import MarkingArc from './markings/MarkingArc';
import MarkingDot from './markings/MarkingDot';

/** 矩形边框（4 条线段），供禁区/球门区使用 */
function RectFrame({
    xMin,
    xMax,
    zMin,
    zMax,
    width,
}: {
    xMin: number;
    xMax: number;
    zMin: number;
    zMax: number;
    width: number;
}) {
    return (
        <>
            <MarkingLine start={[xMin, zMin]} end={[xMax, zMin]} width={width} />
            <MarkingLine start={[xMin, zMax]} end={[xMax, zMax]} width={width} />
            <MarkingLine start={[xMin, zMin]} end={[xMin, zMax]} width={width} />
            <MarkingLine start={[xMax, zMin]} end={[xMax, zMax]} width={width} />
        </>
    );
}

/**
 * 球场标线层：按 FIFA 标准比例绘制，每条线独立显隐（markingsStore 驱动）
 */
function PitchMarkings() {
    const masterVisible = useMarkingsStore(s => s.masterVisible);
    const visible = useMarkingsStore(s => s.visible);
    const { length: L, width: W, lineWidth: lw } = PITCH_CONFIG;
    const hL = L / 2;
    const hW = W / 2;

    // 图层总开关（hooks 之后 return）
    if (!masterVisible) return null;

    const penHalfW = PITCH_CONFIG.penaltyAreaWidth / 2;
    const goalHalfW = PITCH_CONFIG.goalAreaWidth / 2;

    // 罚球弧角：圆心（点球点）到禁区线的水平距离 / 半径
    const arcAngle = Math.acos(
        (PITCH_CONFIG.penaltyAreaDepth - PITCH_CONFIG.penaltySpotDistance) /
            PITCH_CONFIG.penaltyArcRadius,
    );

    return (
        <group>
            {/* 底线（左右独立） */}
            {visible.leftGoalLine && (
                <MarkingLine start={[-hL, -hW]} end={[-hL, hW]} width={lw} />
            )}
            {visible.rightGoalLine && (
                <MarkingLine start={[hL, -hW]} end={[hL, hW]} width={lw} />
            )}

            {/* 边线（上下独立） */}
            {visible.topTouchline && (
                <MarkingLine start={[-hL, hW]} end={[hL, hW]} width={lw} />
            )}
            {visible.bottomTouchline && (
                <MarkingLine start={[-hL, -hW]} end={[hL, -hW]} width={lw} />
            )}

            {/* 中线 */}
            {visible.midline && (
                <MarkingLine start={[0, -hW]} end={[0, hW]} width={lw} />
            )}

            {/* 中圈（始终渲染） */}
            <MarkingRing center={[0, 0]} radius={PITCH_CONFIG.centerCircleRadius} width={lw} />

            {/* 大禁区（左右独立） */}
            {visible.leftPenaltyArea && (
                <RectFrame
                    xMin={-hL}
                    xMax={-hL + PITCH_CONFIG.penaltyAreaDepth}
                    zMin={-penHalfW}
                    zMax={penHalfW}
                    width={lw}
                />
            )}
            {visible.rightPenaltyArea && (
                <RectFrame
                    xMin={hL - PITCH_CONFIG.penaltyAreaDepth}
                    xMax={hL}
                    zMin={-penHalfW}
                    zMax={penHalfW}
                    width={lw}
                />
            )}

            {/* 小禁区（左右独立） */}
            {visible.leftGoalArea && (
                <RectFrame
                    xMin={-hL}
                    xMax={-hL + PITCH_CONFIG.goalAreaDepth}
                    zMin={-goalHalfW}
                    zMax={goalHalfW}
                    width={lw}
                />
            )}
            {visible.rightGoalArea && (
                <RectFrame
                    xMin={hL - PITCH_CONFIG.goalAreaDepth}
                    xMax={hL}
                    zMin={-goalHalfW}
                    zMax={goalHalfW}
                    width={lw}
                />
            )}

            {/* 点球点（始终渲染） */}
            <MarkingDot
                position={[-(hL - PITCH_CONFIG.penaltySpotDistance), 0]}
                radius={0.022}
            />
            <MarkingDot
                position={[hL - PITCH_CONFIG.penaltySpotDistance, 0]}
                radius={0.022}
            />

            {/* 弧顶（左右独立） */}
            {visible.leftPenaltyArc && (
                <MarkingArc
                    center={[-(hL - PITCH_CONFIG.penaltySpotDistance), 0]}
                    radius={PITCH_CONFIG.penaltyArcRadius}
                    width={lw}
                    startAngle={-arcAngle}
                    endAngle={arcAngle}
                    clockwise={false}
                />
            )}
            {visible.rightPenaltyArc && (
                <MarkingArc
                    center={[hL - PITCH_CONFIG.penaltySpotDistance, 0]}
                    radius={PITCH_CONFIG.penaltyArcRadius}
                    width={lw}
                    startAngle={Math.PI - arcAngle}
                    endAngle={Math.PI + arcAngle}
                    clockwise={false}
                />
            )}

            {/* 角球弧（四角独立，圆心在角点、弧朝场内） */}
            {visible.topLeftCorner && (
                <MarkingArc
                    center={[-hL, hW]}
                    radius={PITCH_CONFIG.cornerArcRadius}
                    width={lw}
                    startAngle={0}
                    endAngle={-Math.PI / 2}
                    clockwise
                />
            )}
            {visible.bottomLeftCorner && (
                <MarkingArc
                    center={[-hL, -hW]}
                    radius={PITCH_CONFIG.cornerArcRadius}
                    width={lw}
                    startAngle={0}
                    endAngle={Math.PI / 2}
                    clockwise={false}
                />
            )}
            {visible.topRightCorner && (
                <MarkingArc
                    center={[hL, hW]}
                    radius={PITCH_CONFIG.cornerArcRadius}
                    width={lw}
                    startAngle={Math.PI}
                    endAngle={Math.PI * 1.5}
                    clockwise={false}
                />
            )}
            {visible.bottomRightCorner && (
                <MarkingArc
                    center={[hL, -hW]}
                    radius={PITCH_CONFIG.cornerArcRadius}
                    width={lw}
                    startAngle={Math.PI / 2}
                    endAngle={Math.PI}
                    clockwise={false}
                />
            )}
        </group>
    );
}

export default PitchMarkings;
