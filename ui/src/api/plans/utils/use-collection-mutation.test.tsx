import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { enableMapSet, enablePatches } from 'immer';
import type { PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useCharacterPlansMutation } from '@/api/plans/character-plans';
import { usePlans, useSharedPendingPlansStatusEntry } from '@/api/plans/plans';
import { useWeaponPlansMutation } from '@/api/plans/weapon-plans';
import { authStore } from '@/api/pocketbase';
import { queryClient } from '@/api/queryClient';
import type { Plans } from '@/api/types';
import { logger } from '@/store/logger';

import { plan, weapon } from './mutation-test-fixtures';
import { plansMutationCoordinator } from './plans-mutation-coordinator';
import { useCollectionMutation } from './use-collection-mutation';

beforeEach(() => {
  enableMapSet();
  enablePatches();
  logger.disable();
  vi.useFakeTimers();
  authStore.save('test-token', {
    id: 'user-a',
    collectionId: 'users',
    collectionName: 'users',
  });
  plansMutationCoordinator.reset();
  queryClient.setQueryData(['plans'], [plan()]);
});
afterEach(() => {
  cleanup();
  authStore.clear();
  plansMutationCoordinator.reset();
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function context() {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          {children}
        </RouterContextProvider>
      </QueryClientProvider>
    );
  }
  return { router, wrapper: Wrapper };
}

type ApiRequest = {
  method: string;
  url: string;
  body: Record<string, unknown>;
};
function network() {
  const requests: {
    url: string;
    operations: ApiRequest[];
    respond: (data: unknown, status?: number) => void;
  }[] = [];
  const fetch = vi.fn<typeof globalThis.fetch>(
    (url, options) =>
      new Promise<Response>((resolve) => {
        const payload = JSON.parse(
          String((options?.body as FormData).get('@jsonPayload')),
        );
        requests.push({
          url: String(url),
          operations: payload.requests,
          respond(data, status = 200) {
            resolve(
              new Response(JSON.stringify(data), {
                status,
                headers: { 'Content-Type': 'application/json' },
              }),
            );
          },
        });
      }),
  );
  vi.stubGlobal('fetch', fetch);
  return requests;
}

function useMutations(disabled = false) {
  const plans = usePlans();
  return {
    character: useCharacterPlansMutation(plans, disabled),
    weapon: useWeaponPlansMutation(plans[0].id, plans[0].weaponPlans, disabled),
    weaponStatus: useSharedPendingPlansStatusEntry(plans[0].id),
  };
}

async function advance(ms = 450) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}
async function respond(
  request: ReturnType<typeof network>[number],
  body: unknown,
  status = 200,
) {
  await act(async () => {
    request.respond(body, status);
    await vi.advanceTimersByTimeAsync(0);
  });
}
// PocketBase's BatchResponseError nests the failing API response under its index.
function failBody(index = '0', message = 'Invalid level') {
  return {
    code: 400,
    message: 'Batch failed',
    data: {
      requests: {
        [index]: {
          code: 'batch_request_failed',
          message: 'Batch request failed.',
          response: { code: 400, message, data: {} },
        },
      },
    },
  };
}

it('combines separate hooks into one PocketBase batch and commits both responses to the plans cache', async () => {
  const requests = network();
  const { result } = renderHook(() => useMutations(), context());
  act(() => {
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.levelCurrent = 20;
      },
    );
    result.current.weapon.update(result.current.weapon.records[0], (draft) => {
      draft.levelCurrent = 80;
    });
  });
  expect(result.current.character.records[0]).toMatchObject({
    levelCurrent: 20,
    isOptimistic: true,
  });
  expect(result.current.weapon.records[0]).toMatchObject({
    levelCurrent: 80,
    isOptimistic: true,
  });
  expect(result.current.weaponStatus).toEqual([true, false]);
  await advance();
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toMatch(/\/api\/batch$/);
  expect(requests[0].operations).toMatchObject([
    {
      method: 'PATCH',
      url: '/api/collections/characterPlans/records/plan-a',
      body: { levelCurrent: 20 },
    },
    {
      method: 'PATCH',
      url: '/api/collections/weaponPlans/records/weapon-a',
      body: { levelCurrent: 80 },
    },
  ]);
  expect(requests[0].operations[0].body).not.toHaveProperty('weaponPlans');
  await respond(requests[0], [
    { status: 200, body: { id: 'plan-a', levelCurrent: 20 } },
    { status: 200, body: { ...weapon(), levelCurrent: 80 } },
  ]);
  expect(queryClient.getQueryData<Plans[]>(['plans'])?.[0]).toMatchObject({
    levelCurrent: 20,
    weaponPlans: [{ levelCurrent: 80 }],
  });
  expect(result.current.weapon.records[0]).not.toHaveProperty('isOptimistic');
  expect(result.current.character.isPending).toBe(false);
  expect(result.current.weaponStatus).toEqual([false, false]);
});

it('shares optimistic edits across two consumers of the same collection and merges their changes', async () => {
  const requests = network();
  const { result } = renderHook(() => {
    const plans = usePlans();
    return [useCharacterPlansMutation(plans), useCharacterPlansMutation(plans)];
  }, context());
  act(() =>
    result.current[0].update(result.current[0].records[0], (draft) => {
      draft.note = 'first consumer';
    }),
  );
  expect(result.current[1].records[0].note).toBe('first consumer');
  act(() =>
    result.current[1].update(result.current[1].records[0], (draft) => {
      draft.levelCurrent = 40;
    }),
  );
  await advance();
  expect(requests[0].operations).toHaveLength(1);
  expect(requests[0].operations[0].body).toMatchObject({
    note: 'first consumer',
    levelCurrent: 40,
  });
});

it('preserves pending edits across unmount and remount without duplicating the request', async () => {
  const requests = network();
  const first = renderHook(() => useMutations(), context());
  act(() =>
    first.result.current.weapon.update(
      first.result.current.weapon.records[0],
      (draft) => {
        draft.levelCurrent = 80;
      },
    ),
  );
  first.unmount();
  await advance(100);
  const second = renderHook(() => useMutations(), context());
  expect(second.result.current.weapon.records[0]).toMatchObject({
    levelCurrent: 80,
    isOptimistic: true,
  });
  await advance(350);
  expect(requests).toHaveLength(1);
  second.unmount();
  await respond(requests[0], [
    { status: 200, body: { ...weapon(), levelCurrent: 80 } },
  ]);
  expect(
    queryClient.getQueryData<Plans[]>(['plans'])?.[0].weaponPlans?.[0]
      .levelCurrent,
  ).toBe(80);
});

it('keeps the optimistic view current when input records change during a pending write', () => {
  const original = [plan()];
  const { result, rerender } = renderHook(
    ({ records }) =>
      useCollectionMutation('characterPlans', (plans) => plans, records),
    { ...context(), initialProps: { records: original } },
  );
  act(() =>
    result.current.update(result.current.records[0], (draft) => {
      draft.note = 'pending';
    }),
  );
  rerender({ records: [{ ...plan(), levelCurrent: 50 }, plan('plan-b')] });
  expect(result.current.records[0]).toMatchObject({
    levelCurrent: 50,
    note: 'pending',
  });
  expect(result.current.records[1].id).toBe('plan-b');
});

it('marks a cumulative failure on both hooks and retries them together with one notification', async () => {
  const requests = network();
  const notify = vi.spyOn(toast, 'error');
  const { result } = renderHook(() => useMutations(), context());
  act(() => {
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'pending';
      },
    );
    result.current.weapon.update(result.current.weapon.records[0], (draft) => {
      draft.levelCurrent = 80;
    });
  });
  await advance();
  await respond(requests[0], failBody(), 400);
  expect(result.current.character.isError).toBe(true);
  expect(result.current.weapon.isError).toBe(true);
  expect(result.current.weaponStatus).toEqual([false, true]);
  expect(result.current.character.records[0].isOptimisticError).toBe(true);
  expect(queryClient.getQueryData<Plans[]>(['plans'])?.[0].note).toBe('');
  expect(notify).toHaveBeenCalledTimes(1);
  act(() => result.current.weapon.retry());
  expect(result.current.character.isError).toBe(false);
  expect(result.current.weaponStatus).toEqual([true, false]);
  expect(requests[1].operations).toHaveLength(2);
  await respond(requests[1], [
    { status: 200, body: { id: 'plan-a', note: 'pending' } },
    { status: 200, body: { ...weapon(), levelCurrent: 80 } },
  ]);
  expect(result.current.weaponStatus).toEqual([false, false]);
});

it('retains edits on disabled hooks and sends them when re-enabled', async () => {
  const requests = network();
  const { result, rerender } = renderHook(
    ({ disabled }) => useMutations(disabled),
    { ...context(), initialProps: { disabled: true } },
  );
  act(() => {
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'wait until enabled';
      },
    );
  });
  expect(result.current.character.records[0].note).toBe('wait until enabled');
  await advance(1000);
  expect(requests).toHaveLength(0);
  rerender({ disabled: false });
  await advance(0);
  expect(requests).toHaveLength(1);
  expect(requests[0].operations[0].body.note).toBe('wait until enabled');
});

it('uses distinct temporary IDs for multiple creates made in the same tick', async () => {
  const requests = network();
  const { result } = renderHook(() => useMutations(), context());
  act(() => {
    result.current.character.create('character-b');
    result.current.character.create('character-c');
    result.current.weapon.create('sword-b');
    result.current.weapon.create('sword-c');
  });
  expect(result.current.character.records).toHaveLength(3);
  expect(result.current.weapon.records).toHaveLength(3);
  await advance();
  expect(requests[0].operations).toHaveLength(4);
  expect(requests[0].operations.map((operation) => operation.body.id)).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
});

it('discards queued writes on logout', async () => {
  const requests = network();
  const { result } = renderHook(() => useMutations(), context());
  act(() =>
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'old user';
      },
    ),
  );
  act(() => authStore.clear());
  await advance(1000);
  expect(requests).toHaveLength(0);
  expect(result.current.character.isPending).toBe(false);
  expect(result.current.character.records[0].note).toBe('');
});

it('keeps queued writes across token refreshes for the same user', async () => {
  const requests = network();
  const { result } = renderHook(() => useMutations(), context());
  act(() =>
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'keep me';
      },
    ),
  );
  act(() =>
    authStore.save('refreshed-token', {
      id: 'user-a',
      collectionId: 'users',
      collectionName: 'users',
    }),
  );
  await advance();
  expect(requests[0].operations[0].body.note).toBe('keep me');
});

it('does not write an old response into the next signed-in user’s cache', async () => {
  const requests = network();
  const { result } = renderHook(() => useMutations(), context());
  act(() =>
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'old user';
      },
    ),
  );
  await advance();
  act(() => {
    authStore.save('another-token', {
      id: 'user-b',
      collectionId: 'users',
      collectionName: 'users',
    });
    queryClient.setQueryData(['plans'], [{ ...plan(), note: 'new user' }]);
  });
  await respond(requests[0], [
    { status: 200, body: { id: 'plan-a', note: 'stale response' } },
  ]);
  expect(queryClient.getQueryData<Plans[]>(['plans'])?.[0].note).toBe(
    'new user',
  );
  expect(result.current.character.records[0].note).toBe('new user');
});

it('blocks navigation while edits are still waiting for the batch window', async () => {
  const { router, wrapper } = context();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const { result } = renderHook(
    () => useCollectionMutation('characterPlans', (plans) => plans, [plan()]),
    { wrapper },
  );
  act(() =>
    result.current.update(result.current.records[0], (draft) => {
      draft.note = 'unsent';
    }),
  );
  await act(async () => {
    router.history.push('/other');
  });
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(router.history.location.pathname).toBe('/');
});

it('does not retry a successful create if its cache was cleared while the request was in flight', async () => {
  const requests = network();
  const notify = vi.spyOn(toast, 'error');
  const hook = renderHook(() => useMutations(), context());
  act(() => hook.result.current.character.create('character-b'));
  await advance();
  hook.unmount();
  queryClient.clear();
  await respond(requests[0], [
    { status: 200, body: { ...plan('real-id'), character: 'character-b' } },
  ]);
  expect(notify).not.toHaveBeenCalled();
  expect(
    plansMutationCoordinator.getStatus(JSON.stringify(['plans'])).hasChanges,
  ).toBe(false);
  await advance(1000);
  expect(requests).toHaveLength(1);
});

it('does not rerender hooks whose collection scope has no changes', () => {
  let untouchedRenders = 0;
  const first = renderHook(
    () => useCollectionMutation('characterPlans', (plans) => plans, [plan()]),
    context(),
  );
  renderHook(() => {
    untouchedRenders++;
    return useCollectionMutation(
      'weaponPlans',
      (plans) => plans[0].weaponPlans,
      [weapon()],
    );
  }, context());
  const before = untouchedRenders;
  act(() =>
    first.result.current.update(first.result.current.records[0], (draft) => {
      draft.note = 'edited';
    }),
  );
  expect(untouchedRenders).toBe(before);
});

it('shows the failing request’s error even when it is not the first operation', async () => {
  const requests = network();
  const notify = vi.spyOn(toast, 'error');
  const { result } = renderHook(() => useMutations(), context());
  act(() => {
    result.current.character.update(
      result.current.character.records[0],
      (draft) => {
        draft.note = 'queued';
      },
    );
    result.current.weapon.update(result.current.weapon.records[0], (draft) => {
      draft.levelCurrent = 80;
    });
  });
  await advance();
  await respond(requests[0], failBody('1', 'Invalid weapon level'), 400);
  const description = notify.mock.calls[0][1]?.description;
  render(
    <>{typeof description === 'function' ? description() : description}</>,
  );
  expect(screen.getByText('Invalid weapon level')).toBeDefined();
});
