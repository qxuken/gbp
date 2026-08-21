import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactSubstatsSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center gap-1.5">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
    </div>
  );
}
