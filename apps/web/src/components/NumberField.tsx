import { useRef, useState, type KeyboardEvent } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseNumberInput } from '@/lib/number';

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onCommit: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  decimals?: number;
  className?: string;
}

/**
 * A numeric input that commits on Enter or blur (Escape cancels), so typing "1" on the
 * way to "12" doesn't resize the room to 1 m. Accepts "," as the decimal separator.
 */
export function NumberField({
  id,
  label,
  value,
  onCommit,
  unit,
  min,
  max,
  decimals = 2,
  className,
}: NumberFieldProps) {
  // null = not editing: show the current value from the store.
  const [draft, setDraft] = useState<string | null>(null);
  // Set by Escape so the blur that follows discards the draft instead of committing it.
  const cancelled = useRef(false);
  const display = Number(value.toFixed(decimals)).toString();

  // Blur is the single commit point: Enter and Escape both just blur the input.
  function handleBlur() {
    if (draft !== null && !cancelled.current) {
      const parsed = parseNumberInput(draft, { min, max });
      if (parsed !== null && parsed !== value) onCommit(parsed);
    }
    cancelled.current = false;
    setDraft(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') cancelled.current = true;
    if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
  }

  return (
    <Field className={cn('gap-1.5', className)}>
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          value={draft ?? display}
          onFocus={(event) => {
            setDraft(display);
            event.currentTarget.select();
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn('h-8 tabular-nums', unit && 'pr-8')}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </Field>
  );
}
