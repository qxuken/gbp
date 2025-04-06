import { queryOptions } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';

export const CHARACTER_PLANS_QUERY_KEY = ['characterPlans'];
export const CHARACTER_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: CHARACTER_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient
      .collection<CharacterPlans>('characterPlans')
      .getFullList({ sort: 'order' }),
});
