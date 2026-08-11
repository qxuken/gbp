import { Skeleton } from '@/components/ui/skeleton';

import { DoubleInputLabeledSkeleton } from './double-input-labeled';

export function MainStatSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid gap-y-1.5">
        <CompactTargetSkeleton />
        <CompactTargetSkeleton />
        <CompactTargetSkeleton />
        <CompactTargetSkeleton />
        <CompactTargetSkeleton />
      </div>
    );
  }

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

function CompactTargetSkeleton() {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <Skeleton className="h-3 w-12 rounded-md" />
      <Skeleton className="size-6 rounded-md" />
    </div>
  );
}
