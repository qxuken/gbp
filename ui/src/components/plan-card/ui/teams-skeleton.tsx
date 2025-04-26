import { Skeleton } from '@/components/ui/skeleton';

export function TeamsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-12 rounded-md" />
        <Skeleton className="size-5 rounded-md" />
      </div>
      <div className="grid gap-2 grid-cols-4">
        <TeamSkeleton />
        <TeamSkeleton />
        <TeamSkeleton />
        <TeamSkeleton />
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="grid justify-items-center relative">
      <div className="size-10 my-1">
        <Skeleton className="size-full rounded-4xl" />
      </div>
      <Skeleton className="h-4 w-14 rounded-md" />
    </div>
  );
}
