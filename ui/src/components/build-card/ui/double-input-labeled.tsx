import { Icons } from '@/components/icons';
import { ShortNumberInput } from '@/components/short-number-input';
import { Label } from '@/components/ui/label';

type Props = {
  name: string;
  min: number;
  max: number;
  current: number;
  target: number;
  onCurrentChange(v: number): void;
  onTargetChange(v: number): void;
  disabled?: boolean;
};
export function DoubleInputLabeled(props: Props) {
  return (
    <>
      <Label className="justify-self-end text-xs text-muted-foreground">
        {props.name}
      </Label>
      <div className="flex gap-1 items-center">
        <ShortNumberInput
          value={props.current}
          onChange={props.onCurrentChange}
          min={props.min}
          max={props.max}
          disabled={props.disabled}
        />
        <Icons.right className="size-4" />
        <ShortNumberInput
          value={props.target}
          onChange={props.onTargetChange}
          min={props.min}
          max={props.max}
          disabled={props.disabled}
        />
      </div>
    </>
  );
}
