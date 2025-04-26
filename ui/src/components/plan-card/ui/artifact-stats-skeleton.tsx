import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactStatsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-9 rounded-md" />
      <div className="grid gap-2 w-full">
        <ArtifactStatSkeleton />
        <ArtifactStatSkeleton />
        <ArtifactStatSkeleton />
      </div>
    </div>
  );
}

function ArtifactStatSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="px-1.5 w-12 h-9">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex flex-wrap gap-2 items-start">
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
    </div>
  );
}
