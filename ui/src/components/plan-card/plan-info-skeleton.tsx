import { Card, CardContent } from '@/components/ui/card';

import { Skeleton } from '../ui/skeleton';
import { ArtifactSetsSkeleton } from './ui/artifact-sets-skeleton';
import { ArtifactSubstatsSkeleton } from './ui/artifact-substats-skeleton';
import { ArtifactTypesSkeleton } from './ui/artifact-types-skeleton';
import { NoteSkeleton } from './ui/note-skeleton';
import { TeamsSkeleton } from './ui/teams-skeleton';
import { WeaponsSkeleton } from './ui/weapons-skeleton';

export function PlanInfoSkeleton({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement | null>;
}) {
  return (
    <Card
      ref={ref}
      className="@container/plan w-full max-w-4xl gap-0 overflow-hidden p-0"
    >
      <div className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3 p-3 pb-2.5">
          <Skeleton className="size-18 shrink-0 rounded-xl @[38rem]/plan:size-20" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-6 w-12 rounded-md" />
              <Skeleton className="h-6 w-10 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <CardContent className="grid grid-cols-1 items-start gap-x-6 gap-y-4 p-4 pt-3.5 @[38rem]/plan:grid-cols-2">
        <WeaponsSkeleton />
        <ArtifactSetsSkeleton />
        <div className="@[38rem]/plan:col-span-2">
          <ArtifactTypesSkeleton />
        </div>
        <div className="@[38rem]/plan:col-span-2">
          <ArtifactSubstatsSkeleton />
        </div>
        <div className="@[38rem]/plan:col-span-2">
          <TeamsSkeleton />
        </div>
        <div className="@[38rem]/plan:col-span-2">
          <NoteSkeleton />
        </div>
      </CardContent>
    </Card>
  );
}

export default PlanInfoSkeleton;
