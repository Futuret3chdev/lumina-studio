import { ACCENT_SWATCHES, BODY_SWATCHES, CATALOG_BY_ID, ENV_PRESETS } from "@/lib/studio/catalog";
import { useStudio } from "@/lib/studio/store";
import { OUTFITS, WORLD_SCENES } from "@/lib/studio/world";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  const wrapPhoto = useStudio((s) => s.wrapPhoto);
  const activePhotoId = useStudio((s) => s.activePhotoId);
  const setWrapPhoto = useStudio((s) => s.setWrapPhoto);
  const mode = useStudio((s) => s.mode);
  const worldScene = useStudio((s) => s.worldScene);
  const setWorldScene = useStudio((s) => s.setWorldScene);
  const selectedPlaceId = useStudio((s) => s.selectedPlaceId);
  const worldPlaces = useStudio((s) => s.worldPlaces);
  const updatePlace = useStudio((s) => s.updatePlace);
  const removePlace = useStudio((s) => s.removePlace);
  const convertToPerson = useStudio((s) => s.convertToPerson);
  const item = CATALOG_BY_ID[kind];
  const hasPhoto = Boolean(activePhotoId);
  const isPhoto = kind === "photo-relief";
  const isAvatar = kind === "avatar";
  const selected = worldPlaces.find((p) => p.id === selectedPlaceId);
  const dress = Math.round(params.dress ?? 0);
  const picture = Boolean(selected?.photoUrl);
  const mannequin = isAvatar && !picture;

  return (
    <aside className="pointer-events-auto flex h-full w-full flex-col bg-surface lg:w-72 lg:rounded-xl lg:shadow-[var(--shadow-border)]">
      <div className="px-4 py-3">
        <p className="font-display text-xl leading-tight">
          {mode === "world"
            ? selected
              ? picture
                ? "This picture"
                : selected.name
              : "MT World"
            : item.name}
        </p>
        <p className="mt-1 text-sm text-muted">
          {mode === "world"
            ? selected
              ? picture
                ? "Edits apply only to this one — not the garden."
                : "Tap the floor to move it."
              : "Tap a person or model to edit just that one."
            : item.blurb}
        </p>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-4">
          {mode === "world" && selected && picture && (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-lg bg-elevated">
                <img
                  src={selected.photoUrl}
                  alt=""
                  className="mx-auto max-h-36 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-sm text-fg">{selected.name}</p>
              <Button
                type="button"
                className="w-full"
                onClick={() => useStudio.getState().setEditingCutout(selected.id)}
              >
                Cut it out myself
              </Button>
              {selected.kind === "photo-relief" && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => convertToPerson(selected.id)}
                >
                  Auto cut-out
                </Button>
              )}
              <Field
                label="Height"
                value={selected.params.height ?? 1}
                min={0.35}
                max={1.6}
                step={0.05}
                onChange={(value) =>
                  updatePlace(selected.id, {
                    params: { ...selected.params, height: value },
                  })
                }
              />
              <Field
                label="Size"
                value={selected.scale}
                min={0.4}
                max={2.2}
                step={0.05}
                onChange={(value) => updatePlace(selected.id, { scale: value })}
              />
              <Field
                label="Turn"
                value={selected.rotY}
                min={-Math.PI}
                max={Math.PI}
                step={0.05}
                onChange={(value) => updatePlace(selected.id, { rotY: value })}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => removePlace(selected.id)}
              >
                Remove this picture
              </Button>
              <Separator />
            </div>
          )}
          {mode === "world" && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
                Where
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {WORLD_SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setWorldScene(scene.id)}
                    className={cn(
                      "h-11 rounded-md px-1 text-xs font-medium transition-colors duration-150",
                      worldScene === scene.id
                        ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
                        : "text-muted hover:bg-elevated hover:text-fg",
                    )}
                  >
                    {scene.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mannequin && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
                Dress
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {OUTFITS.map((outfit) => (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => {
                      const s = useStudio.getState();
                      const photo = s.photos.find((p) => p.id === s.activePhotoId);
                      if (!s.worldPlaces.some((p) => p.kind === "avatar")) {
                        s.placeKind("avatar", photo?.url);
                      }
                      if (s.mode !== "world") s.setMode("world");
                      s.setParam("dress", outfit.dress);
                    }}
                    className={cn(
                      "h-11 rounded-md text-xs font-medium transition-colors duration-150",
                      dress === outfit.dress
                        ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
                        : "text-muted hover:bg-elevated hover:text-fg",
                    )}
                  >
                    {outfit.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mode === "world" && selected && !picture && (
            <div className="flex flex-col gap-3">
              <Field
                label="Turn"
                value={selected.rotY}
                min={-Math.PI}
                max={Math.PI}
                step={0.05}
                onChange={(value) => updatePlace(selected.id, { rotY: value })}
              />
              <Field
                label="Size"
                value={selected.scale}
                min={0.4}
                max={2.2}
                step={0.05}
                onChange={(value) => updatePlace(selected.id, { scale: value })}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => removePlace(selected.id)}
              >
                Remove from world
              </Button>
            </div>
          )}
          {hasPhoto && mode !== "world" && (
            <ToggleRow
              label="Wrap onto model"
              checked={wrapPhoto && !isPhoto}
              onCheckedChange={setWrapPhoto}
            />
          )}
          {mode !== "world" && !isPhoto && (
            <Swatches
              label="Surface"
              value={bodyColor}
              colors={BODY_SWATCHES}
              onChange={setBodyColor}
            />
          )}
          {mode !== "world" && (
            <>
              <Swatches
                label={isPhoto ? "Frame" : "Accent"}
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
                  {item.params
                    .filter((field) => !(isAvatar && field.key === "dress"))
                    .map((field) => (
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
            </>
          )}
          <Separator />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
              {mode === "world" ? "Whole garden" : "Stage"}
            </p>
            <p className="mb-3 text-xs text-muted">
              {mode === "world"
                ? "Lighting for the house and garden. Does not change a picture’s background."
                : "Studio lighting and backdrop."}
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
            {mode !== "world" && (
              <>
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
              </>
            )}
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
