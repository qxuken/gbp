import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the panel in `plan-filters.tsx`, so the layout doesn't jump. */
export default function PlanFiltersSkeleton() {
  return (
    <section
      aria-label="Filters Loading"
      className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
    >
      <FilterHeaderSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] items-start gap-x-6 gap-y-3.5">
        <FilterNameSkeleton />
        <PlanCompletedSkeleton />
        <FilterGroupSkeleton />
        <FilterGroupSkeleton />
        <FilterArtifactSetsSkeleton />
        <FilterArtifactTypesSkeleton />
      </div>
    </section>
  );
}

function FilterHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-5 w-12 rounded-md" />
      <Skeleton className="size-6 rounded-md" />
    </div>
  );
}

function FilterNameSkeleton() {
  return <Skeleton className="h-8 w-full rounded-md" />;
}

function PlanCompletedSkeleton() {
  return (
    <div className="flex w-full items-center gap-3">
      <Skeleton className="h-3 w-16 rounded-sm" />
      <Skeleton className="h-7 flex-1 rounded-md" />
    </div>
  );
}

/** The element and weapon chip rows share this shape. */
function FilterGroupSkeleton() {
  return (
    <div className="grid gap-1.5">
      <Skeleton className="h-3 w-14 rounded-sm" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  );
}

function FilterArtifactSetsSkeleton() {
  return (
    <div className="flex items-center gap-1">
      <Skeleton className="h-3 w-20 rounded-sm" />
      <Skeleton className="size-5 rounded-md" />
    </div>
  );
}

function FilterArtifactTypesSkeleton() {
  return (
    <div className="grid gap-1.5">
      <Skeleton className="h-3 w-16 rounded-sm" />
      <div className="grid w-full gap-1.5">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}
