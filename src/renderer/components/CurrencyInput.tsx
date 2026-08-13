import { useState, type ChangeEvent } from "react";

interface CurrencyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

function formatWithCommas(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-US");
}

/**
 * Money-amount input used everywhere an amount in تومان is entered
 * (sales, accounting, suppliers, installments, calculator, repairs labor
 * fee...). Displays thousand-separator commas while typing — e.g. typing
 * "1500000" shows "1,500,000" — but the value passed to onChange is
 * always a plain number, so nothing downstream needs to know about the
 * formatting.
 */
export function CurrencyInput({ id, value, onChange, placeholder, disabled, required }: CurrencyInputProps): JSX.Element {
  const [focused, setFocused] = useState(false);
  const displayValue = focused && value === 0 ? "" : formatWithCommas(String(value || ""));

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const digitsOnly = event.target.value.replace(/[^\d]/g, "");
    onChange(digitsOnly ? Number(digitsOnly) : 0);
  }

  return (
    <div className="currency-input">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      <span className="currency-input__suffix">تومان</span>
    </div>
  );
}
