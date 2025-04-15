import { useCharactersItem } from '@/api/dictionaries/atoms';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PendingCharacter,
  useRetryPendingPlan,
} from '@/store/plans/pendingPlans';

import { Button } from '../ui/button';
import { CharacterInfo } from './ui/character-info';
import { MainStatSkeleton } from './ui/main-stats';

type Props = { pending: PendingCharacter };
export function PendingBuildInfo({ pending }: Props) {
  const character = useCharactersItem(pending.characterId);
  const planRetry = useRetryPendingPlan(pending.id);

  if (!character) {
    return null;
  }

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
        {pending.state == 'failed' && (
          <Button onClick={planRetry}>Retry</Button>
        )}
      </CardContent>
    </Card>
  );
}
