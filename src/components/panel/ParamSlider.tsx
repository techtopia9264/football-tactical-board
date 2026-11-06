import { Label, Slider } from '@yizhiheizi/dud';

interface ParamSliderProps {
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    /** 滑块两端方向标签（可选） */
    startLabel?: string;
    endLabel?: string;
}

/** 数值滑杆行：Label + 实时数值 + Slider（面板通用） */
function ParamSlider({
    label,
    min,
    max,
    step,
    value,
    onChange,
    startLabel,
    endLabel,
}: ParamSliderProps) {
    return (
        <div className="param-row">
            <div className="param-header">
                <Label className="param-label">{label}</Label>
                <span className="param-value">{value.toFixed(2)}</span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={v => onChange(v[0])}
            />
            {startLabel && endLabel && (
                <div className="param-slider-labels">
                    <span>{startLabel}</span>
                    <span>{endLabel}</span>
                </div>
            )}
        </div>
    );
}

export default ParamSlider;
