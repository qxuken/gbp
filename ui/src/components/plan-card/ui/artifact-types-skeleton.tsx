import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactTypesSkeleton({
  hideTitle = false,
}: {
  hideTitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!hideTitle && (
        <div className="flex min-h-6 items-center gap-1.5">
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="size-4 rounded-md" />
        </div>
      )}
      <div className="grid w-full gap-2 @[26rem]/plan:grid-cols-3">
        <ArtifactTypesItemSkeleton />
        <ArtifactTypesItemSkeleton />
        <ArtifactTypesItemSkeleton />
      </div>
    </div>
  );
}

function ArtifactTypesItemSkeleton() {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-border/70 px-2 py-1.5 @[26rem]/plan:h-full @[26rem]/plan:flex-col @[26rem]/plan:gap-1.5">
      <div className="flex shrink-0 items-center gap-1.5">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-2.5 w-12 rounded" />
      </div>
      <Skeleton className="h-6 w-20 rounded-md" />
    </div>
  );
}
