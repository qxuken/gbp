import { Card, CardContent, CardTitle } from '@/components/ui/card';

import { Skeleton } from '../ui/skeleton';
import { ArtifactSetsSkeleton } from './ui/artifact-sets-skeleton';
import { ArtifactStatsSkeleton } from './ui/artifact-stats-skeleton';
import { ArtifactSubstatsSkeleton } from './ui/artifact-substats-skeleton';
import { MainStatSkeleton } from './ui/main-stats';
import { NoteSkeleton } from './ui/note-skeleton';
import { TeamsSkeleton } from './ui/teams-skeleton';
import { WeaponsSkeleton } from './ui/weapons-skeleton';

export function PlanInfoSkeleton({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement | null>;
}) {
  return (
    <Card ref={ref} className="w-full overflow-hidden">
      <div className="w-full flex justify-center pt-1">
        <Skeleton className="w-6 h-4" />
      </div>
      <CardTitle className="px-4 w-full flex items-center gap-3">
        <Skeleton className="w-25 h-6" />
        <Skeleton className="size-6" />
        <div className="flex-1" />
        <Skeleton className="size-6" />
      </CardTitle>
      <CardContent className="w-full pt-4 flex flex-col gap-3">
        <div className="flex items-start justify-around">
          <MainStatSkeleton />
          <Skeleton className="size-35 rounded-2xl ml-6" />
          <div />
        </div>
        <WeaponsSkeleton />
        <ArtifactSetsSkeleton />
        <ArtifactStatsSkeleton />
        <ArtifactSubstatsSkeleton />
        <TeamsSkeleton />
        <NoteSkeleton />
      </CardContent>
    </Card>
  );
}
