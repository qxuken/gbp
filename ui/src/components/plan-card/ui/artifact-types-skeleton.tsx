import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactTypesSkeleton({
  hideTitle = false,
}: {
  hideTitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {!hideTitle && <Skeleton className="h-3 w-9 rounded-md" />}
      <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
