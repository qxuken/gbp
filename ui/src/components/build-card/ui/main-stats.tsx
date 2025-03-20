import { useEffect } from 'react';

import { CharacterPlans } from '@/api/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { mutateField } from '@/lib/mutate-field';

import {
  DoubleInputLabeled,
  DoubleInputLabeledSkeleton,
} from './double-input-labeled';

type Props = { build?: CharacterPlans; mutate(v: CharacterPlans): void };

const MIN_BOUNDS = { skill: { min: 1, max: 10 }, burst: { min: 1, max: 10 } };
const MED_BOUNDS = { skill: { min: 4, max: 13 }, burst: { min: 1, max: 10 } };
const MAX_BOUNDS = { skill: { min: 4, max: 13 }, burst: { min: 4, max: 13 } };
function getTalentBounds(constellation: number) {
  if (constellation < 3) {
    return MIN_BOUNDS;
  }
  if (constellation < 6) {
    return MED_BOUNDS;
  }
  return MAX_BOUNDS;
}

export function MainStat({ build, mutate }: Props) {
  if (!build) {
    return <MainStatSkeleton />;
  }
  return <MainStatLoaded build={build} mutate={mutate} />;
}

type PropsLoaded = Required<Props>;
function MainStatLoaded({ build, mutate }: PropsLoaded) {
  const currentBounds = getTalentBounds(build.constellationCurrent);
  const targetBounds = getTalentBounds(build.constellationTarget);

  useEffect(() => {
    const buildCopy = { ...build };
    let somethingChanged = false;
    if (build.talentSkillCurrent < currentBounds.skill.min) {
      buildCopy.talentSkillCurrent = currentBounds.skill.min;
      somethingChanged = true;
    } else if (build.talentSkillCurrent > targetBounds.skill.max) {
      buildCopy.talentSkillCurrent = targetBounds.skill.max;
      somethingChanged = true;
    }
    if (
      (MIN_BOUNDS.skill.max !== targetBounds.skill.max &&
        build.talentSkillTarget == MIN_BOUNDS.skill.max) ||
      build.talentSkillTarget > targetBounds.skill.max
    ) {
      buildCopy.talentSkillTarget = targetBounds.skill.max;
      somethingChanged = true;
    }
    if (build.talentBurstCurrent < currentBounds.burst.min) {
      buildCopy.talentBurstCurrent = currentBounds.burst.min;
      somethingChanged = true;
    } else if (build.talentBurstCurrent > targetBounds.burst.max) {
      buildCopy.talentBurstCurrent = currentBounds.burst.max;
      somethingChanged = true;
    }
    if (
      (MIN_BOUNDS.burst.max !== targetBounds.burst.max &&
        build.talentBurstTarget == MIN_BOUNDS.burst.max) ||
      build.talentBurstTarget > targetBounds.burst.max
    ) {
      buildCopy.talentBurstTarget = targetBounds.burst.max;
      somethingChanged = true;
    }
    if (somethingChanged) {
      mutate(buildCopy);
    }
  }, [
    currentBounds.skill.min,
    currentBounds.burst.min,
    targetBounds.skill.max,
    targetBounds.burst.max,
  ]);

  return (
    <div className="grid grid-cols-[auto_min-content] items-center justify-end gap-1">
      <DoubleInputLabeled
        name="Level"
        min={1}
        max={90}
        current={build.levelCurrent}
        target={build.levelTarget}
        onCurrentChange={mutateField(mutate, build, 'levelCurrent')}
        onTargetChange={mutateField(mutate, build, 'levelTarget')}
      />
      <DoubleInputLabeled
        name="Constellation"
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
        min={1}
        max={10}
        current={build.talentAtkCurrent}
        target={build.talentAtkTarget}
        onCurrentChange={mutateField(mutate, build, 'talentAtkCurrent')}
        onTargetChange={mutateField(mutate, build, 'talentAtkTarget')}
      />
      <DoubleInputLabeled
        name="Skill"
        min={currentBounds.skill.min}
        max={targetBounds.skill.max}
        current={build.talentSkillCurrent}
        target={build.talentSkillTarget}
        onCurrentChange={mutateField(mutate, build, 'talentSkillCurrent')}
        onTargetChange={mutateField(mutate, build, 'talentSkillTarget')}
      />
      <DoubleInputLabeled
        name="Burst"
        min={currentBounds.burst.min}
        max={targetBounds.burst.max}
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
