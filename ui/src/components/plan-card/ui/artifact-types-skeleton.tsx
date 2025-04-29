import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactTypesSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-9 rounded-md" />
      <div className="grid gap-2 w-full">
        <ArtifactTypesItemSkeleton />
        <ArtifactTypesItemSkeleton />
        <ArtifactTypesItemSkeleton />
      </div>
    </div>
  );
}

function ArtifactTypesItemSkeleton() {
  return (
    <div className="w-full flex gap-2">
      <div className="px-1.5 w-12 h-9">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="h-6 w-10 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
    </div>
  );
}
