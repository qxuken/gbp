import { produce } from 'immer';
import { ClientResponseError } from 'pocketbase';

import { authStore, pbClient } from '@/api/pocketbase';
import { queryClient } from '@/api/queryClient';
import type { Plans } from '@/api/types';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { logger } from '@/store/logger';

import { PLANS_QUERY } from '../plans';
import { CollectionMutationCoordinator } from './collection-mutation-coordinator';

export const plansMutationCoordinator = new CollectionMutationCoordinator({
  async send(operations) {
    const batch = pbClient.createBatch();
    for (const operation of operations) {
      const collection = batch.collection(operation.collectionName);
      if (operation.type === 'create') collection.create(operation.value);
      else if (operation.type === 'update')
        collection.update(operation.id, operation.value);
      else collection.delete(operation.id);
    }
    const responses = await batch.send();
    return responses.map((response) => response.body);
  },
  commit(apply) {
    try {
      queryClient.setQueryData<Plans[]>(PLANS_QUERY.queryKey, (plans) =>
        plans ? produce(plans, apply) : undefined,
      );
    } catch (error) {
      // The write already succeeded. Refetch rather than retrying creates.
      logger.error(error);
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY.queryKey });
    }
  },
  onError(error, retry) {
    const requestErrors =
      error instanceof ClientResponseError && error.data?.data?.requests;
    const nested = requestErrors && Object.values(requestErrors)[0];
    const reported = nested
      ? new ClientResponseError(nested)
      : error instanceof Error
        ? error
        : new Error(String(error));
    logger.error(reported);
    notifyWithRetry(retry)(reported);
  },
});

let userId = authStore.record?.id;
authStore.onChange(() => {
  const nextUserId = authStore.record?.id;
  if (nextUserId !== userId) {
    userId = nextUserId;
    plansMutationCoordinator.reset();
  }
});
