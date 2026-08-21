import { Skeleton } from '@/components/ui/skeleton';

export function TeamsSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-6 items-center gap-1.5">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="size-4 rounded-md" />
      </div>
      <div className="grid w-full gap-2 @[38rem]/plan:grid-cols-2">
        <TeamSkeleton />
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-lg border border-border/60 bg-muted/25 p-1.5">
      <MemberSkeleton />
      <MemberSkeleton />
      <MemberSkeleton />
      <MemberSkeleton />
    </div>
  );
}

function MemberSkeleton() {
  return (
    <div className="grid justify-items-center gap-0.5">
      <Skeleton className="size-10 rounded-lg" />
      <Skeleton className="h-2.5 w-12 rounded" />
    </div>
  );
}
