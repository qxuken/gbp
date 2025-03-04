import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

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

  const setNewValue = (v: number) => {
    if (v < min || v > max) {
      return;
    }
    props.onChange(v);
    if (v === props.value) {
      setValue(String(v));
    }
  };
  const dec = () => {
    setNewValue(props.value - 1);
  };
  const inc = () => {
    setNewValue(props.value + 1);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const eventValue = e.target.value;
    if (eventValue === '') {
      setValue('');
      return;
    }
    const val = Number(eventValue);
    if (isNaN(val)) {
      return;
    }
    setNewValue(val);
  };
  const onBlur = () => {
    if (value === '') {
      return setValue(String(props.value));
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'k':
        return inc();
      case 'ArrowDown':
      case 'j':
        return dec();
    }
  };

  return (
    <Input
      className="size-6 text-xs md:text-xs leading-1/1 p-0 font-medium text-center shadow-none border-0 hover:outline"
      {...props}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}
