import { Trigger as SelectTrigger } from '@radix-ui/react-select';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { clamp } from '@/lib/clamp';
import { cn } from '@/lib/utils';

export type ShortNumberInputProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
> & {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /**
   * Renders an auxiliary picker next to the input. Only worth it for short
   * ranges — typing stays the faster path for anything longer.
   */
  options?: number[];
  /** Accessible name for the picker, e.g. "Constellation". */
  optionsLabel?: string;
  /**
   * Snaps a typed value onto the nearest legal one — character levels above 90
   * only exist in steps of five, for instance. Values it doesn't map to
   * themselves are treated as invalid while typing.
   */
  normalize?: (value: number) => number;
};
export function ShortNumberInput({
  max = 99,
  min = 0,
  className,
  options,
  optionsLabel,
  normalize,
  ...props
}: ShortNumberInputProps) {
  const [value, setValue] = useState(() => String(props.value));
  useEffect(() => {
    setValue(String(props.value));
  }, [props.value]);
  const maxLength = String(max).length;
  const isValid = (v: number) =>
    min <= v && v <= max && (!normalize || normalize(v) === v);
  /** Walks to the next legal value, skipping the gaps `normalize` leaves. */
  const step = (direction: 1 | -1) => {
    for (
      let v = props.value + direction;
      min <= v && v <= max;
      v += direction
    ) {
      if (isValid(v)) {
        return props.onChange(v);
      }
    }
  };
  const dec = () => step(-1);
  const inc = () => step(1);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const evVal = e.target.value;
    const val = Number(evVal);
    if (evVal === '') {
      return setValue(evVal);
    }
    if (isNaN(val) || evVal.length > maxLength) {
      return;
    }
    if (val != props.value && isValid(val)) {
      props.onChange(val);
    } else {
      setValue(evVal);
    }
  };
  const onBlur = () => {
    if (value === '') {
      return setValue(String(props.value));
    }
    const val = Number(value);
    if (!isValid(val)) {
      const clamped = clamp(min, val, max);
      props.onChange(normalize ? clamp(min, normalize(clamped), max) : clamped);
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        return inc();
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        return dec();
    }
  };

  const input = (
    <Input
      className={cn(
        'size-6 rounded-sm border-0 bg-transparent p-0 text-center text-xs leading-none font-medium shadow-none md:text-xs',
        {
          'focus-visible:ring-red-600': !isValid(Number(value)),
        },
        className,
      )}
      {...props}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );

  if (!options?.length) {
    return input;
  }

  return (
    <span className="flex items-center">
      {input}
      <Select
        value={String(props.value)}
        onValueChange={(v) => props.onChange(Number(v))}
        disabled={props.disabled}
      >
        <SelectTrigger data-slot="select-trigger" asChild>
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 data-[state=open]:bg-foreground/10"
            disabled={props.disabled}
            aria-label={
              optionsLabel ? `Choose ${optionsLabel}` : 'Choose value'
            }
          >
            <Icons.Caret className="size-3" />
          </button>
        </SelectTrigger>
        <SelectContent className="min-w-14" align="center">
          {options.map((option) => (
            <SelectItem
              key={option}
              value={String(option)}
              className="justify-center tabular-nums"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

/** Inclusive integer range, for `options`. */
export function numberRange(min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
