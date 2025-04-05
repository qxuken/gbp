import { queryOptions, useQuery } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';

const CHARACTER_PLANS_QUERY_KEY = ['characterPlans'];
const CHARACTER_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: CHARACTER_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient
      .collection<CharacterPlans>('characterPlans')
      .getFullList({ sort: 'order' }),
});

export function useCharacterPlans() {
  return useQuery(CHARACTER_PLANS_QUERY_PARAMS);
}
