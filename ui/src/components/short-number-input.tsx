import { clamp } from 'motion';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
> & {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};
export function ShortNumberInput({ max = 99, min = 0, ...props }: Props) {
  const [value, setValue] = useState(() => String(props.value));
  useEffect(() => {
    setValue(String(props.value));
  }, [props.value]);
  const isValid = (v: number) => min <= v && v <= max;
  const dec = () => {
    if (!isValid(props.value - 1)) {
      return;
    }
    props.onChange(props.value - 1);
  };
  const inc = () => {
    if (!isValid(props.value + 1)) {
      return;
    }
    props.onChange(props.value + 1);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const evVal = e.target.value;
    const val = Number(evVal);
    if (evVal === '') {
      return setValue(evVal);
    }
    if (isNaN(val) || evVal.length > 2) {
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
      props.onChange(clamp(min, val, max));
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

  return (
    <Input
      className={cn(
        'size-6 text-xs md:text-xs leading-1/1 p-0 font-medium text-center shadow-none border-0 hover:outline',
        {
          'focus-visible:ring-red-600': !isValid(Number(value)),
        },
      )}
      {...props}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}
