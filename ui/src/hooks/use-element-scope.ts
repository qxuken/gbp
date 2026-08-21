import { CSSProperties } from 'react';

import { useElementsItem } from '@/api/dictionaries/hooks';
import { Characters } from '@/api/types';

/**
 * Element colours ship with the dictionary (`elements.color`). Anything that
 * wants to tint itself by element sets `--element` once on a wrapper carrying
 * `element-scope`; children then use `bg-element/10`, `text-element-fg`, etc.
 */
export function useElementScope(elementId?: string) {
  const element = useElementsItem(elementId ?? '', false);
  const style = { '--element': element?.color } as CSSProperties;
  return { element, style };
}

export function useCharacterElementScope(character: Characters) {
  return useElementScope(character.element);
}
