import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@yizhiheizi/dud';
import { usePanStore, PAN_F, PAN_B, PAN_L, PAN_R } from '../../store/panStore';

/** 方向按钮：按住期间持续向 CameraRig 发送方向信号 */
function DirButton({
    flag,
    children,
}: {
    flag: number;
    children: ReactNode;
}) {
    const setDir = usePanStore(s => s.setDir);
    return (
        <Button
            size="icon"
            variant="outline"
            className="pan-pad-btn"
            onPointerDown={e => {
                e.preventDefault();
                setDir(flag, true);
            }}
            onPointerUp={() => setDir(flag, false)}
            onPointerLeave={() => setDir(flag, false)}
            onPointerCancel={() => setDir(flag, false)}
        >
            {children}
        </Button>
    );
}

/**
 * 镜头平移控制器：放大到一定程度后出现在左下角，
 * 按住方向键平移镜头（也支持 WASD 快捷键）。
 */
function PanPad() {
    const zoomed = usePanStore(s => s.zoomed);
    if (!zoomed) return null;

    return (
        <div className="pan-pad">
            <div className="pan-pad-row">
                <DirButton flag={PAN_F}>
                    <ArrowUp className="pan-pad-icon" />
                </DirButton>
            </div>
            <div className="pan-pad-row">
                <DirButton flag={PAN_L}>
                    <ArrowLeft className="pan-pad-icon" />
                </DirButton>
                <span className="pan-pad-hint">WASD</span>
                <DirButton flag={PAN_R}>
                    <ArrowRight className="pan-pad-icon" />
                </DirButton>
            </div>
            <div className="pan-pad-row">
                <DirButton flag={PAN_B}>
                    <ArrowDown className="pan-pad-icon" />
                </DirButton>
            </div>
        </div>
    );
}

export default PanPad;
