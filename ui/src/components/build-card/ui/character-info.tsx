import { PopoverTrigger } from '@radix-ui/react-popover';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { Characters } from '@/api/types';
import { CollectionAvatar } from '@/components/collection-avatar';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonProps } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type InfoProps = { character: Characters };
function Info({ character }: InfoProps) {
  const element = useLiveQuery(
    () => db.elements.get(character?.element ?? ''),
    [character?.element],
  );
  const weaponType = useLiveQuery(
    () => db.weaponTypes.get(character?.weaponType ?? ''),
    [character?.weaponType],
  );

  if (!character || !element || !weaponType) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-1">
      <span>Rarity</span>
      <Badge
        className={cn({
          'bg-amber-400': character.rarity === 5,
          'bg-indigo-300': character.rarity !== 5,
        })}
      >
        {character.rarity}
      </Badge>
      <span>Element</span>
      <Badge
        className={cn({
          'text-white hover:text-black': element.inverseTextColor,
        })}
        style={{ backgroundColor: element.color }}
      >
        <CollectionAvatar
          collectionName="elements"
          recordId={element.id}
          fileName={element.icon}
          name={element.name}
          size={16}
          className="size-4"
        />
        {element.name}
      </Badge>
      <span>Weapon</span>
      <Badge variant="secondary" className="flex gap-1">
        <CollectionAvatar
          collectionName="weaponTypes"
          recordId={weaponType.id}
          fileName={weaponType.icon}
          name={weaponType.name}
          size={16}
          className="size-4"
        />
        {weaponType.name}
      </Badge>
    </div>
  );
}

type Props = ButtonProps & InfoProps;
export function CharacterInfo({ character, ...props }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-7 hover:text-black', {
            ['hover:bg-amber-400']: character.rarity === 5,
            ['hover:bg-indigo-300']: character.rarity !== 5,
          })}
          {...props}
        >
          <Icons.info />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <Info character={character} />
      </PopoverContent>
    </Popover>
  );
}
