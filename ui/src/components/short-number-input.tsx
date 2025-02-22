import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
};
export function ShortNumberInput({
  defaultValue: p_defVal,
  max = 99,
  min = 0,
  onChange: p_onChange,
  value: p_value,
  ...props
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;

  const [_value, _setValue] = useState(() => {
    if (p_value != undefined) {
      return p_value;
    }
    if (p_defVal != undefined) {
      return p_defVal;
    }
    return 0;
  });

  useEffect(() => {
    if (p_value != undefined) {
      _setValue(p_value);
    }
  }, [p_value]);

  const setNewValue = (v: number) => {
    if (v < min || v > max) {
      return;
    }
    if (p_value == undefined) {
      _setValue(v);
    }
    p_onChange?.(v);
  };
  const dec = () => {
    setNewValue(_value - 1);
  };
  const inc = () => {
    setNewValue(_value + 1);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div
      className="flex"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <span />
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={-10}
          className="p-0 bg-transparent text-accent-foreground"
        >
          <Button
            size="icon"
            variant="outline"
            className="size-5 rounded-2xl"
            onClick={dec}
            disabled={_value == min}
          >
            <Icons.minus />
          </Button>
        </TooltipContent>
      </Tooltip>
      <Input
        className="w-12 text-base md:text-base py-0 font-medium text-center"
        {...props}
        onChange={onChange}
        onKeyDown={onKeyDown}
        value={_value}
      />
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <span />
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={-10}
          className="p-0 bg-transparent text-accent-foreground"
        >
          <Button
            size="icon"
            variant="outline"
            className="size-5 rounded-2xl"
            onClick={inc}
            disabled={_value == max}
          >
            <Icons.plus />
          </Button>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
