import { useState } from 'react';
import { Copy, Save, Bookmark } from 'lucide-react';
import {
    Card,
    Label,
    Switch,
    Button,
    Input,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@yizhiheizi/dud';
import { GRASS_PRESETS } from '../../config/grassParams';
import { useGrassStore } from '../../store/grassStore';
import ParamSlider from './ParamSlider';

interface ParamColorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

/** 颜色选择行：Label + 原生色板 + 色值 */
function ParamColor({ label, value, onChange }: ParamColorProps) {
    return (
        <div className="param-row">
            <div className="param-header">
                <Label className="param-label">{label}</Label>
                <span className="param-value">{value}</span>
            </div>
            <input
                className="param-color"
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );
}

/**
 * 草皮调参面板：实时调整草皮 Shader 参数（临时调试用，后续并入控制面板）
 */
function GrassPanel() {
    const params = useGrassStore(s => s.params);
    const setParam = useGrassStore(s => s.setParam);
    const resetParams = useGrassStore(s => s.resetParams);
    const applyPreset = useGrassStore(s => s.applyPreset);
    const savePreset = useGrassStore(s => s.savePreset);
    const setAsDefault = useGrassStore(s => s.setAsDefault);
    const customPresets = useGrassStore(s => s.customPresets);
    const [copied, setCopied] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [presetName, setPresetName] = useState('');

    /** 复制当前参数（JSON）到剪贴板 */
    const copyParams = async () => {
        await navigator.clipboard.writeText(JSON.stringify(params, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /** 保存当前参数为新版本 */
    const handleSave = () => {
        savePreset(presetName.trim());
        setPresetName('');
        setSaveOpen(false);
    };

    return (
        <Card className="grass-panel">
            <div className="grass-panel-title">
                <span>草皮调参</span>
                <div className="grass-panel-actions">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={copyParams}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{copied ? '已复制 ✓' : '复制当前'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSaveOpen(true)}
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>保存版本</TooltipContent>
                    </Tooltip>
                    <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>保存当前参数为版本</DialogTitle>
                                <DialogDescription>
                                    为当前草皮参数输入一个版本名称，将出现在版本按钮区域。
                                </DialogDescription>
                            </DialogHeader>
                            <Input
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                                placeholder="如：版本3 / 英超风格"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && presetName.trim()) {
                                        handleSave();
                                    }
                                }}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">取消</Button>
                                </DialogClose>
                                <Button disabled={!presetName.trim()} onClick={handleSave}>
                                    保存
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={setAsDefault}>
                                <Bookmark className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>设为默认</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <ParamColor
                label="中间草色"
                value={params.colorCenter}
                onChange={v => setParam('colorCenter', v)}
            />
            <ParamColor
                label="边缘草色"
                value={params.colorEdge}
                onChange={v => setParam('colorEdge', v)}
            />
            <ParamSlider
                label="边缘渐变强度"
                min={0}
                max={1}
                step={0.05}
                value={params.edgeStrength}
                onChange={v => setParam('edgeStrength', v)}
            />
            <ParamSlider
                label="噪声强度（斑点）"
                min={0}
                max={2}
                step={0.05}
                value={params.noiseStrength}
                onChange={v => setParam('noiseStrength', v)}
            />
            <ParamSlider
                label="草叶颗粒"
                min={0}
                max={1}
                step={0.05}
                value={params.bladeStrength}
                onChange={v => setParam('bladeStrength', v)}
            />
            <ParamSlider
                label="法线扰动"
                min={0}
                max={1}
                step={0.05}
                value={params.bumpStrength}
                onChange={v => setParam('bumpStrength', v)}
            />
            <ParamSlider
                label="枯黄感"
                min={0}
                max={1}
                step={0.05}
                value={params.yellowing}
                onChange={v => setParam('yellowing', v)}
            />

            <div className="param-row">
                <div className="param-header">
                    <Label className="param-label">修剪条纹</Label>
                    <Switch
                        checked={params.stripeEnabled}
                        onCheckedChange={v => setParam('stripeEnabled', v)}
                    />
                </div>
            </div>
            {params.stripeEnabled && (
                <>
                    <ParamSlider
                        label="条纹密度"
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={params.stripeFreq}
                        onChange={v => setParam('stripeFreq', v)}
                    />
                    <ParamSlider
                        label="条纹对比度"
                        min={0}
                        max={1}
                        step={0.05}
                        value={params.stripeStrength}
                        onChange={v => setParam('stripeStrength', v)}
                    />
                </>
            )}

            <Button variant="outline" size="sm" onClick={resetParams}>
                恢复默认
            </Button>
            <div className="grass-presets">
                {[...GRASS_PRESETS, ...customPresets].map(preset => (
                    <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset.id)}
                    >
                        {preset.name}
                    </Button>
                ))}
            </div>
        </Card>
    );
}

export default GrassPanel;
