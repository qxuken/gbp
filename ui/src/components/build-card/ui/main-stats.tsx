import { CharacterPlans } from '@/api/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { mutateField } from '@/lib/mutate-field';

import {
  DoubleInputLabeled,
  DoubleInputLabeledSkeleton,
} from './double-input-labeled';

type Props = { build?: CharacterPlans; mutate(v: CharacterPlans): void };
export function MainStat({ build, mutate }: Props) {
  if (!build) {
    return <MainStatSkeleton />;
  }
  return <MainStatLoaded build={build} mutate={mutate} />;
}

type PropsLoaded = Required<Props>;
function MainStatLoaded({ build, mutate }: PropsLoaded) {
  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-1">
      <DoubleInputLabeled
        name="Level"
        min={0}
        max={90}
        current={build.levelCurrent}
        target={build.levelTarget}
        onCurrentChange={mutateField(mutate, build, 'levelCurrent')}
        onTargetChange={mutateField(mutate, build, 'levelTarget')}
      />
      <DoubleInputLabeled
        name="Constelation"
        min={0}
        max={6}
        current={build.constellationCurrent}
        target={build.constellationTarget}
        onCurrentChange={mutateField(mutate, build, 'constellationCurrent')}
        onTargetChange={mutateField(mutate, build, 'constellationTarget')}
      />
      <Separator className="col-span-2 bg-muted-foreground rounded-lg opacity-50" />
      <DoubleInputLabeled
        name="Attack"
        min={0}
        max={10}
        current={build.talentAtkCurrent}
        target={build.talentAtkTarget}
        onCurrentChange={mutateField(mutate, build, 'talentAtkCurrent')}
        onTargetChange={mutateField(mutate, build, 'talentAtkTarget')}
      />
      <DoubleInputLabeled
        name="Skill"
        min={0}
        max={13}
        current={build.talentSkillCurrent}
        target={build.talentSkillTarget}
        onCurrentChange={mutateField(mutate, build, 'talentSkillCurrent')}
        onTargetChange={mutateField(mutate, build, 'talentSkillTarget')}
      />
      <DoubleInputLabeled
        name="Burst"
        min={0}
        max={13}
        current={build.talentBurstCurrent}
        target={build.talentBurstTarget}
        onCurrentChange={mutateField(mutate, build, 'talentBurstCurrent')}
        onTargetChange={mutateField(mutate, build, 'talentBurstTarget')}
      />
    </div>
  );
}

export function MainStatSkeleton() {
  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-1">
      <DoubleInputLabeledSkeleton labelLength="w-10" />
      <DoubleInputLabeledSkeleton labelLength="w-24" />
      <Skeleton className="col-span-2 h-0.5 rounded-lg" />
      <DoubleInputLabeledSkeleton labelLength="w-15" />
      <DoubleInputLabeledSkeleton labelLength="w-10" />
      <DoubleInputLabeledSkeleton labelLength="w-12" />
    </div>
  );
}
