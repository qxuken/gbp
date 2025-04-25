import { useEffect } from 'react';

import { useNewCharacterPlanMutation } from '@/api/plans/character-plans';
import { Characters } from '@/api/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PendingPlan } from '@/store/plans/pendingPlans';

import { Button } from '../ui/button';
import { CharacterInfo } from './ui/character-info';
import { MainStatSkeleton } from './ui/main-stats';

type Props = { plan: PendingPlan; character: Characters; visible: boolean };
export function PendingPlanPlaceholder({ plan, character, visible }: Props) {
  const mutation = useNewCharacterPlanMutation(plan);

  useEffect(() => {
    mutation.mutateAsync();
  }, [plan.id]);

  if (!visible) return null;
  return (
    <Card className="w-full overflow-hidden">
      <div className="w-full flex justify-center pt-1">
        <Skeleton className="w-6 h-4" />
      </div>
      <CardTitle className="px-4 w-full flex items-center gap-3">
        <span className="font-semibold text-lg">{character.name}</span>
        <CharacterInfo character={character} />
        <div className="flex-1" />
        <Skeleton className="size-6" />
      </CardTitle>
      <CardContent className="w-full pt-4 flex flex-col gap-3">
        <div className="flex items-start justify-around">
          <MainStatSkeleton />
          <CollectionAvatar
            className="size-35 rounded-2xl ml-6"
            record={character}
            fileName={character.icon}
            name={character.name}
          />
          <div />
        </div>
        {mutation.isError && (
          <Button onClick={() => mutation.mutate()}>Retry</Button>
        )}
      </CardContent>
    </Card>
  );
}
