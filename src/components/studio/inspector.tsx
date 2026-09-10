import { ACCENT_SWATCHES, BODY_SWATCHES, CATALOG_BY_ID, ENV_PRESETS } from "@/lib/studio/catalog";
import { useStudio } from "@/lib/studio/store";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

function Swatches({
  label,
  value,
  colors,
  onChange,
}: {
  label: string;
  value: string;
  colors: readonly string[];
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">
          {label}
        </p>
        <label className="size-7 overflow-hidden rounded-md shadow-[var(--shadow-border)]">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="size-10 -translate-x-1.5 -translate-y-1.5 cursor-pointer border-0 bg-transparent p-0"
            aria-label={label}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "size-7 rounded-md transition-transform duration-150",
              value.toLowerCase() === color.toLowerCase()
                ? "ring-2 ring-fg ring-offset-2 ring-offset-surface"
                : "shadow-[var(--shadow-border)] hover:scale-105",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <p className="font-mono text-xs tabular-nums text-subtle">
          {value.toFixed(step < 1 ? 2 : 0)}
        </p>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-3">
      <p className="text-sm text-muted">{label}</p>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

export function Inspector() {
  const kind = useStudio((s) => s.kind);
  const params = useStudio((s) => s.params);
  const bodyColor = useStudio((s) => s.bodyColor);
  const accentColor = useStudio((s) => s.accentColor);
  const metalness = useStudio((s) => s.metalness);
  const roughness = useStudio((s) => s.roughness);
  const scale = useStudio((s) => s.scale);
  const env = useStudio((s) => s.env);
  const envBackground = useStudio((s) => s.envBackground);
  const showGrid = useStudio((s) => s.showGrid);
  const showPlatform = useStudio((s) => s.showPlatform);
  const lightIntensity = useStudio((s) => s.lightIntensity);
  const setParam = useStudio((s) => s.setParam);
  const setBodyColor = useStudio((s) => s.setBodyColor);
  const setAccentColor = useStudio((s) => s.setAccentColor);
  const setMetalness = useStudio((s) => s.setMetalness);
  const setRoughness = useStudio((s) => s.setRoughness);
  const setScale = useStudio((s) => s.setScale);
  const setEnv = useStudio((s) => s.setEnv);
  const setEnvBackground = useStudio((s) => s.setEnvBackground);
  const setShowGrid = useStudio((s) => s.setShowGrid);
  const setShowPlatform = useStudio((s) => s.setShowPlatform);
  const setLightIntensity = useStudio((s) => s.setLightIntensity);
  const item = CATALOG_BY_ID[kind];

  return (
    <aside className="pointer-events-auto flex h-full w-full flex-col bg-surface lg:w-72 lg:rounded-xl lg:shadow-[var(--shadow-border)]">
      <div className="px-4 py-3">
        <p className="font-display text-xl leading-tight">{item.name}</p>
        <p className="mt-1 text-sm text-muted">{item.blurb}</p>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-4">
          <Swatches
            label="Surface"
            value={bodyColor}
            colors={BODY_SWATCHES}
            onChange={setBodyColor}
          />
          <Swatches
            label="Accent"
            value={accentColor}
            colors={ACCENT_SWATCHES}
            onChange={setAccentColor}
          />
          <Field
            label="Metalness"
            value={metalness}
            min={0}
            max={1}
            step={0.05}
            onChange={setMetalness}
          />
          <Field
            label="Roughness"
            value={roughness}
            min={0}
            max={1}
            step={0.05}
            onChange={setRoughness}
          />
          <Field
            label="Scale"
            value={scale}
            min={0.5}
            max={1.8}
            step={0.05}
            onChange={setScale}
          />
          <Separator />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
              Shape
            </p>
            <div className="flex flex-col gap-3">
              {item.params.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={params[field.key] ?? field.min}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(value) => setParam(field.key, value)}
                />
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
              Stage
            </p>
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {ENV_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setEnv(preset.id)}
                  className={cn(
                    "h-11 rounded-md text-sm transition-colors duration-150",
                    env === preset.id
                      ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
                      : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Field
              label="Key light"
              value={lightIntensity}
              min={0.3}
              max={2}
              step={0.05}
              onChange={setLightIntensity}
            />
            <ToggleRow
              label="Environment backdrop"
              checked={envBackground}
              onCheckedChange={setEnvBackground}
            />
            <ToggleRow
              label="Turntable disc"
              checked={showPlatform}
              onCheckedChange={setShowPlatform}
            />
            <ToggleRow
              label="Ground grid"
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
