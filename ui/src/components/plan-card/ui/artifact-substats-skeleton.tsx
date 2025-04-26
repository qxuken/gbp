import { Skeleton } from '@/components/ui/skeleton';

export function ArtifactSubstatsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-9 rounded-md" />
      <div className="flex flex-wrap gap-1 items-start">
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
    </div>
  );
}
