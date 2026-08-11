import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

import { Skeleton } from '../ui/skeleton';
import { ArtifactSetsSkeleton } from './ui/artifact-sets-skeleton';
import { ArtifactSubstatsSkeleton } from './ui/artifact-substats-skeleton';
import { ArtifactTypesSkeleton } from './ui/artifact-types-skeleton';
import { MainStatSkeleton } from './ui/main-stats-skeleton';
import { NoteSkeleton } from './ui/note-skeleton';
import { TeamsSkeleton } from './ui/teams-skeleton';
import { WeaponsSkeleton } from './ui/weapons-skeleton';

export function PlanInfoSkeleton({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement | null>;
}) {
  const mode = useUiPlansConfigModeValue();

  if (mode == UiPlansMode.V2) {
    return <PlanInfoV2Skeleton ref={ref} />;
  }

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
        <ArtifactTypesSkeleton />
        <ArtifactSubstatsSkeleton />
        <TeamsSkeleton />
        <NoteSkeleton />
      </CardContent>
    </Card>
  );
}

function PlanInfoV2Skeleton({
  ref,
}: {
  ref?: React.Ref<HTMLDivElement | null>;
}) {
  return (
    <Card ref={ref} className="w-full overflow-hidden">
      <CardTitle className="flex items-center gap-2 px-4 py-3">
        <Skeleton className="size-5" />
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="size-7" />
        <Skeleton className="size-7" />
      </CardTitle>
      <CardContent className="p-0">
        <div className="grid border-t lg:grid-cols-[12rem_minmax(14rem,0.85fr)_minmax(18rem,1.2fr)]">
          <section className="p-4 lg:border-r">
            <MainStatSkeleton compact />
          </section>
          <section className="border-t p-4 lg:border-t-0 lg:border-r">
            <WeaponsSkeleton compact />
          </section>
          <section className="border-t p-4 lg:border-t-0">
            <ArtifactSetsSkeleton />
          </section>
        </div>
        <div className="grid border-t xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)]">
          <div className="xl:border-r">
            <section className="p-4">
              <ArtifactTypesSkeleton hideTitle />
            </section>
            <section className="border-t p-4">
              <ArtifactSubstatsSkeleton />
            </section>
          </div>
          <section className="border-t p-4 xl:border-t-0">
            <TeamsSkeleton />
          </section>
        </div>
        <div className="border-t p-4">
          <NoteSkeleton />
        </div>
      </CardContent>
    </Card>
  );
}

export default PlanInfoSkeleton;
