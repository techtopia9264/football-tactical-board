/**
 * 鼠标光标统一管理：多个来源（球员 hover / 划线 hover）竞争时按优先级取，
 * 避免互相覆盖导致闪烁。
 */
let canvasEl: HTMLCanvasElement | null = null;
const states = new Map<string, string>();

/** 优先级（数字大者优先）：球员抓取 > 划线点击 */
const PRIORITY: Record<string, number> = {
    player: 3,
    drawing: 2,
};

function apply() {
    if (!canvasEl) return;
    let best: { owner: string; cursor: string } | null = null;
    for (const [owner, cursor] of states) {
        if (!best || (PRIORITY[owner] ?? 1) > (PRIORITY[best.owner] ?? 1)) {
            best = { owner, cursor };
        }
    }
    canvasEl.style.cursor = best?.cursor ?? '';
}

export const cursorManager = {
    /** 绑定到 Canvas 元素（应用层调用一次） */
    attach(el: HTMLCanvasElement) {
        canvasEl = el;
    },
    set(owner: string, cursor: string) {
        states.set(owner, cursor);
        apply();
    },
    clear(owner: string) {
        states.delete(owner);
        apply();
    },
};
