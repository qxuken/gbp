import { Skeleton } from '@/components/ui/skeleton';

export default function PlanFiltersSkeleton() {
  return (
    <section
      aria-label="Filters"
      className="min-w-xs rounded-xl border border-border border-dashed p-4 sm:p-5 grid gap-4"
    >
      <FilterHeaderSkeleton />
      <div className="grid gap-4 pt-1">
        <FilterNameSkeleton />
        <FilterElementsSkeleton />
        <FilterWeaponTypesSkeleton />
      </div>
    </section>
  );
}

function FilterHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
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
    <div className="flex flex-wrap gap-x-2.5 gap-y-2.5">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

function FilterWeaponTypesSkeleton() {
  return (
    <div className="flex flex-wrap gap-x-2.5 gap-y-2.5">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}
