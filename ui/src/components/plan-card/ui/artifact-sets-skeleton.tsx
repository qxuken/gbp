import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactSetsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-15 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
      <div className="grid gap-1 w-full">
        <ArtifactSetSkeleton />
      </div>
    </div>
  );
}

function ArtifactSetSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="px-1.5 w-12 h-9">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex-1 grid">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
        <div className="flex items-center justify-between gap-1">
          <Skeleton className="h-4 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
