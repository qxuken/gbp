import { Skeleton } from '@/components/ui/skeleton';

import { DoubleInputLabeledSkeleton } from './double-input-labeled';

export function WeaponsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
      <div className="grid gap-2 w-full">
        <WeaponSkeleton />
      </div>
    </div>
  );
}

function WeaponSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="pt-2 ps-0.5">
        <Skeleton className="w-4 h-6" />
      </div>
      <div className="px-0.5 w-12 h-11">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex-1 grid">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-1">
          <DoubleInputLabeledSkeleton labelLength="w-8" />
          <DoubleInputLabeledSkeleton labelLength="w-18" />
        </div>
      </div>
    </div>
  );
}
