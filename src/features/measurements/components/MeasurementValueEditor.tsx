import { Keyboard, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionButton } from "../../../components/ui/primitives";
import {
  formatMeasurementDisplayValue,
  formatMeasurementValue,
  parseMeasurementValue,
} from "../service";

type FractionOption = {
  label: string;
  value: number;
};

type MeasurementValueEditorProps = {
  focusKey: string;
  activeField: string;
  value: string;
  lastSavedValue: string | null;
  previousField: string | null;
  nextField: string | null;
  nextIncompleteField: string | null;
  fractions: FractionOption[];
  onSelectField: (field: string) => void;
  onChangeValue: (value: string) => void;
  onStepInches: (delta: number) => void;
  onSetFraction: (value: number) => void;
  onClear: () => void;
};

const digitOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export function MeasurementValueEditor({
  focusKey,
  activeField,
  value,
  lastSavedValue,
  previousField,
  nextField,
  nextIncompleteField,
  fractions,
  onSelectField,
  onChangeValue,
  onStepInches,
  onSetFraction,
  onClear,
}: MeasurementValueEditorProps) {
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const [inputMode, setInputMode] = useState<"pad" | "manual">("pad");
  const parsedValue = useMemo(() => parseMeasurementValue(value), [value]);
  const displayValue = value.trim() ? `${formatMeasurementDisplayValue(value)} in` : "—";
  const lastSavedDisplayValue = lastSavedValue?.trim() ? `${formatMeasurementDisplayValue(lastSavedValue)} in` : null;

  useEffect(() => {
    if (inputMode !== "manual") {
      return;
    }

    activeInputRef.current?.focus();
    activeInputRef.current?.select();
  }, [focusKey, inputMode]);

  const advanceToNextField = () => {
    if (nextIncompleteField && nextIncompleteField !== activeField) {
      onSelectField(nextIncompleteField);
      return;
    }

    if (nextField) {
      onSelectField(nextField);
    }
  };

  const updateInches = (nextInches: number) => {
    if (nextInches <= 0 && parsedValue.fraction === 0) {
      onClear();
      return;
    }

    onChangeValue(formatMeasurementValue(Math.max(0, nextInches), parsedValue.fraction));
  };

  const appendDigit = (digit: string) => {
    const currentDigits = value.trim() ? String(parsedValue.inches) : "";
    const nextDigits = `${currentDigits}${digit}`.replace(/^0+(?=\d)/, "");
    updateInches(Number.parseInt(nextDigits || "0", 10));
  };

  const removeLastDigit = () => {
    const currentDigits = value.trim() ? String(parsedValue.inches) : "";
    const nextDigits = currentDigits.slice(0, -1);

    if (!nextDigits && parsedValue.fraction === 0) {
      onClear();
      return;
    }

    updateInches(Number.parseInt(nextDigits || "0", 10));
  };

  const handleSetFraction = (nextFraction: number) => {
    onSetFraction(nextFraction);
    advanceToNextField();
  };

  return (
    <section className="app-measurements-pad">
      <div className="app-measurements-pad__hero">
        <div className="min-w-0">
          <div className="mt-1 text-[1.3rem] font-semibold tracking-[-0.03em] text-[var(--app-text)] md:text-[1.45rem]">
            {activeField || "Choose a field"}
          </div>
        </div>

        <div className="app-measurements-pad__hero-value">
          <div className="app-measurements-pad__hero-value-number">{displayValue}</div>
          {lastSavedDisplayValue ? (
            <div className="app-text-caption mt-2 app-measurements-pad__hero-caption">
              Last saved {lastSavedDisplayValue}
            </div>
          ) : null}
        </div>

      </div>

      <div className="app-measurements-pad__quick-move">
        <div className="app-text-overline">Quick move</div>
        <div className="app-measurements-console__flow-actions">
          <ActionButton
            tone="secondary"
            className="h-14 flex-col items-start justify-center gap-1 px-3 py-2 text-left"
            onClick={() => previousField && onSelectField(previousField)}
            disabled={!previousField}
          >
            <span className="app-text-overline text-[0.62rem] leading-none">Previous</span>
            <span className="block w-full truncate text-sm leading-tight">
              {previousField ?? "Start of list"}
            </span>
          </ActionButton>
          <ActionButton
            tone="secondary"
            className="h-14 flex-col items-start justify-center gap-1 px-3 py-2 text-left"
            onClick={() => nextField && onSelectField(nextField)}
            disabled={!nextField}
          >
            <span className="app-text-overline text-[0.62rem] leading-none">Next</span>
            <span className="block w-full truncate text-sm leading-tight">
              {nextField ?? "Last field"}
            </span>
          </ActionButton>
          <ActionButton
            tone="primary"
            className="h-14 flex-col items-start justify-center gap-1 px-3 py-2 text-left"
            onClick={() => nextIncompleteField && onSelectField(nextIncompleteField)}
            disabled={!nextIncompleteField}
          >
            <span className="app-text-overline text-[0.62rem] leading-none">Jump to missing</span>
            <span className="block w-full truncate text-sm leading-tight">
              {nextIncompleteField ?? "All entered"}
            </span>
          </ActionButton>
        </div>
      </div>

      <div className="app-measurements-pad__main">
        <div className="app-measurements-pad__entry">
          <div className="app-measurements-pad__input-mode">
            <div className="app-text-overline">Measurement entry</div>
            <div className="app-measurements-pad__mode-actions">
              <button
                type="button"
                className={`app-measurements-pad__mode-button ${inputMode === "pad" ? "app-measurements-pad__mode-button--active" : ""}`}
                onClick={() => setInputMode("pad")}
                aria-pressed={inputMode === "pad"}
              >
                Touch pad
              </button>
              <button
                type="button"
                className={`app-measurements-pad__mode-button ${inputMode === "manual" ? "app-measurements-pad__mode-button--active" : ""}`}
                onClick={() => setInputMode("manual")}
                aria-pressed={inputMode === "manual"}
              >
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                Type
              </button>
              <button
                type="button"
                onClick={onClear}
                className="app-measurements-pad__clear-button"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          {inputMode === "manual" ? (
            <input
              ref={activeInputRef}
              value={value}
              onChange={(event) => onChangeValue(event.target.value)}
              inputMode="decimal"
              enterKeyHint="done"
              pattern="[0-9]*[.]?[0-9]*"
              placeholder="Enter inches"
              className="app-input app-measurements-pad__manual-input"
            />
          ) : (
            <div className="app-measurements-pad__keypad">
              <div className="app-measurements-pad__digits">
                {digitOptions.slice(0, 9).map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    className="app-measurements-pad__digit"
                    onClick={() => appendDigit(digit)}
                  >
                    {digit}
                  </button>
                ))}
                <button type="button" className="app-measurements-pad__digit app-measurements-pad__digit--wide" onClick={() => appendDigit("0")}>
                  0
                </button>
                <button type="button" className="app-measurements-pad__digit" onClick={removeLastDigit}>
                  <X className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="sr-only">Delete last digit</span>
                </button>
              </div>

              <div className="app-measurements-pad__steps">
                <ActionButton tone="secondary" className="min-h-[3.1rem] px-0 text-base font-semibold" onClick={() => onStepInches(1)}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Add one inch</span>
                </ActionButton>
                <ActionButton tone="secondary" className="min-h-[3.1rem] px-0 text-base font-semibold" onClick={() => onStepInches(-1)}>
                  <Minus className="h-5 w-5" />
                  <span className="sr-only">Subtract one inch</span>
                </ActionButton>
              </div>
            </div>
          )}

          <div className="app-measurements-value-editor__fractions">
            {fractions.map((fractionOption) => (
              <button
                key={fractionOption.label}
                type="button"
                onClick={() => handleSetFraction(fractionOption.value)}
                className={`flex min-h-[3rem] items-center justify-center border px-0 py-1.5 text-[1.35rem] font-semibold leading-none ${
                  parsedValue.fraction === fractionOption.value ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                }`}
              >
                {fractionOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
