import { Skeleton } from '@/components/ui/skeleton';

import { DoubleInputLabeledSkeleton } from './double-input-labeled';

export function MainStatSkeleton() {
  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-1">
      <DoubleInputLabeledSkeleton labelLength="w-10" />
      <DoubleInputLabeledSkeleton labelLength="w-24" />
      <Skeleton className="col-span-2 h-0.5 rounded-lg" />
      <DoubleInputLabeledSkeleton labelLength="w-15" />
      <DoubleInputLabeledSkeleton labelLength="w-10" />
      <DoubleInputLabeledSkeleton labelLength="w-12" />
    </div>
  );
}
