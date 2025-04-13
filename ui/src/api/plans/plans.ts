import { queryOptions } from '@tanstack/react-query';

import { pbClient } from '@/api/pocketbase';
import { Plans } from '@/api/types';

export const PLANS_QUERY_KEY = ['plans'];
export const PLANS_QUERY_PARAMS = queryOptions({
  queryKey: PLANS_QUERY_KEY,
  queryFn: () => pbClient.collection<Plans>('plans').getFullList(),
});
