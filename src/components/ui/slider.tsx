import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
};

export function Slider({
  value,
  min,
  max,
  step = 0.01,
  onValueChange,
  className,
  ...rest
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-11 w-full touch-none items-center",
        className,
      )}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => onValueChange(next[0] ?? value)}
      {...rest}
    >
      <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-elevated">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-fg" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full bg-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </SliderPrimitive.Root>
  );
}
