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

type Props = ButtonProps & { character: Characters };
export function CharacterInfo({ character, ...props }: Props) {
  const element = useLiveQuery(
    () => db.elements.get(character?.element ?? ''),
    [character?.element],
  );
  const weaponType = useLiveQuery(
    () => db.weaponTypes.get(character?.weapon_type ?? ''),
    [character?.weapon_type],
  );

  if (!character || !element || !weaponType) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" {...props}>
          <Icons.info />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <div className="grid grid-cols-2 gap-1">
          <span>Rarity</span>
          <Badge
            className={cn({
              'bg-amber-300': character.rarity === 5,
              'bg-indigo-300': character.rarity !== 5,
            })}
          >
            {character.rarity}
          </Badge>
          <span>Element</span>
          <Badge
            className={cn({
              'text-white hover:text-black': element.inverse_text_color,
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
      </PopoverContent>
    </Popover>
  );
}
