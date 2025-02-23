import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import type { CharacterPlans } from '@/api/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

import { CollectionAvatar } from '../collection-avatar';
import { Icons } from '../icons';
import { ShortNumberInput } from '../short-number-input';
import { ArtifactSets } from './ui/artifact-sets';
import { ArtifactTypes } from './ui/artifact-types';
import { CharacterInfo } from './ui/character-info';
import { TalentsInfo } from './ui/talents-info';
import { Teams } from './ui/teams';
import { Weapons } from './ui/weapons';

type Props = { build: CharacterPlans };
export function BuildInfo({ build }: Props) {
  const character = useLiveQuery(
    () => db.characters.get(build.character),
    [build.character],
  );
  if (!character) {
    return null;
  }
  return (
    <Card className="w-fit min-w-md">
      <CardTitle className="p-4 flex gap-16">
        <div className="w-full flex items-start gap-3">
          <CollectionAvatar
            collectionName="characters"
            recordId={build.character}
            fileName={character.icon}
            name={character.name}
            size={64}
            className="size-16"
          />
          <span className="truncate font-semibold text-4xl">
            {character.name}
          </span>
          <div className="flex flex-1 justify-between px-2">
            <div className="flex flex-col gap-1 items-center">
              <span className="text-lg font-medium">Level</span>
              <div className="flex gap-1 items-center">
                <ShortNumberInput
                  value={build.level_current}
                  min={0}
                  max={90}
                />
                <Icons.right className="size-4" />
                <ShortNumberInput value={build.level_target} min={0} max={90} />
              </div>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span className="text-lg font-medium">Contelation</span>
              <div className="flex gap-1 items-center">
                <ShortNumberInput
                  value={build.constellation_current}
                  min={0}
                  max={5}
                />
                <Icons.right className="size-4" />
                <ShortNumberInput
                  value={build.constellation_current}
                  min={0}
                  max={5}
                />
              </div>
            </div>
          </div>
          <CharacterInfo character={character} />
        </div>
      </CardTitle>
      <CardContent className="flex flex-col gap-4">
        <TalentsInfo build={build} />
        <Weapons build={build} />
        <ArtifactSets build={build} />
        <ArtifactTypes build={build} />
        <Teams build={build} />
      </CardContent>
    </Card>
  );
}
