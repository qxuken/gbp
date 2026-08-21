import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactSetsSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center gap-1.5">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
      <div className="grid w-full gap-0.5">
        <ArtifactSetSkeleton />
        <ArtifactSetSkeleton />
      </div>
    </div>
  );
}

function ArtifactSetSkeleton() {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <Skeleton className="size-4 shrink-0 rounded-sm opacity-50" />
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="grid flex-1 gap-1">
        <Skeleton className="h-4 w-36 rounded-md" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  );
}
