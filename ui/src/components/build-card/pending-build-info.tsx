import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Card, CardTitle } from '@/components/ui/card';

type Props = { characterId: string };
export function PendingBuildInfo({ characterId }: Props) {
  const character = useLiveQuery(
    () => db.characters.get(characterId ?? ''),
    [characterId],
  );

  if (!character) {
    return null;
  }

  return (
    <Card className="w-2xl opacity-75 animate-pulse">
      <CardTitle className="p-4 flex gap-16">
        <div className="w-full flex items-start gap-3">
          <CollectionAvatar
            collectionName="characters"
            recordId={character.id}
            fileName={character.icon}
            name={character.name}
            size={64}
            className="size-16"
          />
          <span className="truncate font-semibold text-4xl">
            {character.name}
          </span>
        </div>
      </CardTitle>
    </Card>
  );
}
