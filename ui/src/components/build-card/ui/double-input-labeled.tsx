import { Icons } from '@/components/icons';
import { ShortNumberInput } from '@/components/short-number-input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
        <Icons.Right className="size-4" />
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

type SkeletonProps = { labelLength?: string };
export function DoubleInputLabeledSkeleton({ labelLength }: SkeletonProps) {
  return (
    <>
      <div className="justify-self-end w-full flex justify-end">
        <Skeleton className={cn('h-4 w-10 rounded-md', labelLength)} />
      </div>
      <div className="w-min flex gap-1 items-center">
        <Skeleton className="size-6 rounded-md" />
        <div className="size-4" />
        <Skeleton className="size-6 rounded-md" />
      </div>
    </>
  );
}
