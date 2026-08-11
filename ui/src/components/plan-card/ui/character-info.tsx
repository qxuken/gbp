import { PopoverTrigger } from '@radix-ui/react-popover';
import { HTMLAttributes } from 'react';

import { useElementsItem, useWeaponTypesItem } from '@/api/dictionaries/hooks';
import { Characters } from '@/api/types';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonProps } from '@/components/ui/button';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type CharacterInfoContentProps = { character: Characters };
export function CharacterInfoContent({ character }: CharacterInfoContentProps) {
  const element = useElementsItem(character.element ?? '', false);
  const weaponType = useWeaponTypesItem(character.weaponType);

  if (!element || !weaponType) {
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
          record={element}
          fileName={element.icon}
          name={element.name}
          className="size-4"
        />
        {element.name}
      </Badge>
      <span>Weapon</span>
      <Badge variant="secondary" className="flex gap-1">
        <CollectionAvatar
          record={weaponType}
          fileName={weaponType.icon}
          name={weaponType.name}
          className="size-4 not-dark:bg-black"
        />
        {weaponType.name}
      </Badge>
    </div>
  );
}

type CharacterInlineInfoProps = CharacterInfoContentProps &
  HTMLAttributes<HTMLDivElement>;
export function CharacterInlineInfo({
  character,
  className,
  ...props
}: CharacterInlineInfoProps) {
  const element = useElementsItem(character.element ?? '', false);
  const weaponType = useWeaponTypesItem(character.weaponType);

  if (!element || !weaponType) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-1">
        <CollectionAvatar
          record={element}
          fileName={element.icon}
          name={element.name}
          className="size-4"
        />
        {element.name}
      </span>
      <span className="flex items-center gap-1">
        <CollectionAvatar
          record={weaponType}
          fileName={weaponType.icon}
          name={weaponType.name}
          className="size-4 not-dark:bg-black"
        />
        {weaponType.name}
      </span>
    </div>
  );
}

type Props = ButtonProps & CharacterInfoContentProps;
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
          <Icons.Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <CharacterInfoContent character={character} />
      </PopoverContent>
    </Popover>
  );
}
