import { Minus, Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ActionButton } from "../../../components/ui/primitives";

type FractionOption = {
  label: string;
  value: number;
};

type MeasurementValueEditorProps = {
  focusKey: string;
  value: string;
  fraction: number;
  fractions: FractionOption[];
  onChangeValue: (value: string) => void;
  onStepInches: (delta: number) => void;
  onSetFraction: (value: number) => void;
  onClear: () => void;
};

export function MeasurementValueEditor({
  focusKey,
  value,
  fraction,
  fractions,
  onChangeValue,
  onStepInches,
  onSetFraction,
  onClear,
}: MeasurementValueEditorProps) {
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeInputRef.current?.focus();
    activeInputRef.current?.select();
  }, [focusKey]);

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_252px] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_276px]">
        <div className="flex min-w-0">
          <input
            ref={activeInputRef}
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            inputMode="decimal"
            enterKeyHint="done"
            pattern="[0-9]*[.]?[0-9]*"
            placeholder="Enter inches"
            className="app-input min-h-[6.4rem] h-full px-4 text-center text-[4rem] font-semibold leading-none tracking-[-0.08em] tabular-nums placeholder:text-[1rem] placeholder:font-medium placeholder:tracking-normal placeholder:text-[var(--app-text-soft)] lg:min-h-[5.7rem] lg:text-[3.55rem] xl:min-h-[7.1rem] xl:text-[4.85rem]"
          />
        </div>

        <div className="relative">
          <div className="absolute right-0 top-0 z-10">
            <button
              onClick={onClear}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-2 text-xs font-medium text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
          >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
          <div className="grid h-full grid-cols-4 gap-1.5 pt-8">
            {fractions.map((fractionOption) => (
              <button
                key={fractionOption.label}
                onClick={() => onSetFraction(fractionOption.value)}
                className={`flex min-h-[2.95rem] items-center justify-center border px-0 py-1.5 text-[1.85rem] font-semibold leading-none lg:min-h-[2.65rem] lg:text-[1.65rem] ${
                  fraction === fractionOption.value ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                }`}
              >
                {fractionOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ActionButton tone="secondary" className="min-h-[3.2rem] px-0 text-xl font-semibold lg:min-h-[3rem]" onClick={() => onStepInches(-1)}>
          <Minus className="h-5 w-5" />
        </ActionButton>
        <ActionButton tone="secondary" className="min-h-[3.2rem] px-0 text-xl font-semibold lg:min-h-[3rem]" onClick={() => onStepInches(1)}>
          <Plus className="h-5 w-5" />
        </ActionButton>
      </div>
    </div>
  );
}
