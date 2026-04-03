import type { ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cx } from "./utils";

type FieldDensity = "default" | "compact";

type FieldLabelProps = {
  children: ReactNode;
};

type FieldStackProps = {
  label: string;
  children: ReactNode;
  className?: string;
  density?: FieldDensity;
};

type SearchFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  icon?: LucideIcon;
  density?: FieldDensity;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  density?: FieldDensity;
};

export function FieldLabel({ children }: FieldLabelProps) {
  return <div className="app-field-label">{children}</div>;
}

export function FieldStack({ label, children, className = "", density = "default" }: FieldStackProps) {
  return (
    <label className={cx("app-field-shell", className)}>
      <div className={cx("app-text-overline", density === "compact" && "text-[0.625rem]")}>{label}</div>
      {children}
    </label>
  );
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  icon: Icon,
  density = "default",
}: SearchFieldProps) {
  return (
    <FieldStack label={label} className={className} density={density}>
      <div className={cx("app-field-control", density === "compact" && "min-h-[2.85rem] gap-2.5 px-3 py-2.5")}>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" /> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="app-text-body min-w-0 flex-1 p-0"
        />
      </div>
    </FieldStack>
  );
}

export function SelectField({ label, value, onChange, children, className = "", density = "default" }: SelectFieldProps) {
  return (
    <FieldStack label={label} className={className} density={density}>
      <div className={cx("app-field-control", density === "compact" && "min-h-[2.85rem] gap-2.5 px-3 py-2.5")}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="app-text-body min-w-0 flex-1 appearance-none pr-7"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
      </div>
    </FieldStack>
  );
}
