import { Skeleton } from '@/components/ui/skeleton';

export default function PlanFiltersSkeleton() {
  return (
    <section
      aria-label="Filters"
      className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
    >
      <FilterHeaderSkeleton />
      <div className="grid gap-2">
        <FilterNameSkeleton />
        <FilterElementsSkeleton />
        <FilterWeaponTypesSkeleton />
      </div>
    </section>
  );
}

function FilterHeaderSkeleton() {
  return (
    <div className="flex justify-between gap-2">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-12 rounded-md" />
        <Skeleton className="mt-0.5 h-5 w-16 rounded-md" />
      </div>
      <div className="w-10 flex justify-center">
        <Skeleton className="size-5 rounded-md" />
      </div>
    </div>
  );
}

function FilterNameSkeleton() {
  return <Skeleton className="h-9 w-full rounded-md" />;
}

function FilterElementsSkeleton() {
  return (
    <div className="flex flex-wrap gap-y-1 gap-x-2">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

function FilterWeaponTypesSkeleton() {
  return (
    <div className="flex flex-wrap gap-y-1 gap-x-2">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}
