import { ChangeEvent, KeyboardEvent } from 'react';

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
  const setNewValue = (v: number) => {
    if (v < min || v > max) {
      return;
    }
    props.onChange(v);
  };
  const dec = () => {
    setNewValue(props.value - 1);
  };
  const inc = () => {
    setNewValue(props.value + 1);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (isNaN(val)) {
      return;
    }
    setNewValue(val);
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
      className="size-6 text-xs md:text-xs leading-1/1 p-0 font-medium text-center border-0 hover:outline hover:outline-amber-100"
      {...props}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}
