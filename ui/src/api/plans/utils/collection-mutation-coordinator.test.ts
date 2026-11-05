import { enablePatches, produce } from 'immer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { Plans } from '@/api/types';

import {
  CollectionMutationCoordinator,
  type BatchOperation,
  type MutationTarget,
} from './collection-mutation-coordinator';
import { plan, weapon } from './mutation-test-fixtures';

beforeEach(() => {
  enablePatches();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

it('batches edits from separate plan collections into one request', async () => {
  const send = vi.fn(() => new Promise<{ id: string }[]>(() => {}));
  const coordinator = new CollectionMutationCoordinator({
    send,
    commit: () => {},
    onError: () => {},
  });
  coordinator.update(
    {
      scope: 'card-a',
      collectionName: 'characterPlans',
      getCollectionToUpdate: () => [],
    },
    { id: 'character-a', level: 1 },
    (draft) => {
      draft.level = 20;
    },
  );
  await vi.advanceTimersByTimeAsync(400);
  coordinator.update(
    {
      scope: 'card-b',
      collectionName: 'weaponPlans',
      getCollectionToUpdate: () => [],
    },
    { id: 'weapon-b', level: 1 },
    (draft) => {
      draft.level = 90;
    },
  );
  await vi.advanceTimersByTimeAsync(50);
  expect(send.mock.calls).toEqual([
    [
      [
        {
          type: 'update',
          collectionName: 'characterPlans',
          id: 'character-a',
          value: { id: 'character-a', level: 20 },
        },
        {
          type: 'update',
          collectionName: 'weaponPlans',
          id: 'weapon-b',
          value: { id: 'weapon-b', level: 90 },
        },
      ],
    ],
  ]);
});

// Tests exercise the public queue, its optimistic projection, and the transport/cache seams.

function setup(initial = [plan()]) {
  let cache = initial;
  const requests: {
    operations: BatchOperation[];
    resolve: (records: ({ id: string } & Record<string, unknown>)[]) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const send = vi.fn(
    (operations: BatchOperation[]) =>
      new Promise<({ id: string } & Record<string, unknown>)[]>(
        (resolve, reject) => {
          requests.push({ operations, resolve, reject });
        },
      ),
  );
  const onError = vi.fn<(error: unknown, retry: () => void) => void>();
  const commit = vi.fn((apply: (plans: Plans[]) => void) => {
    cache = produce(cache, apply);
  });
  const coordinator = new CollectionMutationCoordinator({
    send,
    commit,
    onError,
  });
  const characters: MutationTarget<Plans> = {
    scope: 'characters',
    collectionName: 'characterPlans',
    getCollectionToUpdate: (plans) => plans,
    serverPatches: [{ op: 'remove', path: ['weaponPlans'] }],
  };
  const weapons: MutationTarget<ReturnType<typeof weapon>> = {
    scope: 'weapons-a',
    collectionName: 'weaponPlans',
    getCollectionToUpdate: (plans) => plans[0].weaponPlans,
  };
  return {
    coordinator,
    characters,
    weapons,
    requests,
    send,
    commit,
    onError,
    get cache() {
      return cache;
    },
    charactersView() {
      return coordinator.getRecords(
        characters.scope,
        characters.collectionName,
        cache,
      );
    },
    weaponsView() {
      return coordinator.getRecords(
        weapons.scope,
        weapons.collectionName,
        cache[0].weaponPlans,
      );
    },
  };
}

it('merges edits to the same record and keeps IDs in different collections distinct', async () => {
  const f = setup([plan('same-id')]);
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 20;
  });
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.note = 'farm books';
  });
  f.coordinator.update(f.weapons, weapon('same-id'), (draft) => {
    draft.levelCurrent = 80;
  });
  expect(f.charactersView()[0]).toMatchObject({
    levelCurrent: 20,
    note: 'farm books',
    isOptimistic: true,
  });
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[0].operations).toMatchObject([
    {
      collectionName: 'characterPlans',
      id: 'same-id',
      value: { levelCurrent: 20, note: 'farm books' },
    },
    {
      collectionName: 'weaponPlans',
      id: 'same-id',
      value: { levelCurrent: 80 },
    },
  ]);
  expect(f.requests[0].operations).toHaveLength(2);
});

it('does not schedule requests or report pending for unchanged records', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 1;
  });
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(0);
  expect(f.coordinator.getStatus('characters')).toEqual({
    hasChanges: false,
    isPending: false,
    isError: false,
  });
});

it('folds edits into unsent creates and strips temporary metadata and optimistic flags', async () => {
  const f = setup();
  f.coordinator.create(f.characters, plan('temporary-id'));
  f.coordinator.update(f.characters, f.charactersView()[1], (draft) => {
    draft.levelCurrent = 40;
  });
  expect(f.charactersView()[1]).toMatchObject({
    id: 'temporary-id',
    levelCurrent: 40,
    isOptimistic: true,
  });
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[0].operations).toHaveLength(1);
  expect(f.requests[0].operations[0]).toMatchObject({
    type: 'create',
    value: { levelCurrent: 40 },
  });
  const operation = f.requests[0].operations[0];
  if (operation.type === 'delete') throw new Error('Expected a create');
  for (const key of [
    'id',
    'created',
    'updated',
    'weaponPlans',
    'isOptimistic',
    'isOptimisticBlocked',
    'isOptimisticError',
  ]) {
    expect(operation.value).not.toHaveProperty(key);
  }
});

it('cancels a create followed by delete without sending an empty batch', async () => {
  const f = setup();
  f.coordinator.create(f.characters, plan('temporary-id'));
  f.coordinator.delete(f.characters, 'temporary-id');
  expect(f.charactersView().map((p) => p.id)).toEqual(['plan-a']);
  expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(0);
});

it('lets delete replace queued edits and ignores subsequent edits to a deleted record', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'queued';
  });
  f.coordinator.delete(f.characters, 'plan-a');
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 20;
  });
  expect(f.charactersView()).toEqual([]);
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[0].operations).toEqual([
    { type: 'delete', collectionName: 'characterPlans', id: 'plan-a' },
  ]);
});

it('projects queued creates only into their owning plan collection', () => {
  const f = setup();
  f.coordinator.create(f.weapons, weapon('new-weapon'));
  const other = { ...f.weapons, scope: 'weapons-b' };
  expect(f.weaponsView().map((w) => w.id)).toEqual(['weapon-a', 'new-weapon']);
  expect(
    f.coordinator.getRecords(other.scope, other.collectionName, []).length,
  ).toBe(0);
  expect(f.coordinator.getStatus(other.scope)).toEqual({
    hasChanges: false,
    isPending: false,
    isError: false,
  });
});

it('applies ordered responses across mixed operations and collections in one cache update', async () => {
  const f = setup();
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  f.coordinator.create(f.characters, plan('temporary-id'));
  f.coordinator.delete(f.characters, 'plan-a');
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[0].operations.map((operation) => operation.type)).toEqual([
    'update',
    'create',
    'delete',
  ]);
  f.requests[0].resolve([
    { ...weapon(), levelCurrent: 80 },
    { ...plan('server-id'), note: 'created' },
    { id: 'plan-a' },
  ]);
  await Promise.resolve();
  expect(f.cache.map((p) => p.id)).toEqual(['server-id']);
  expect(f.cache[0].note).toBe('created');
  expect(f.commit).toHaveBeenCalledTimes(1);
  expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
  expect(f.coordinator.getStatus('weapons-a').hasChanges).toBe(false);
});

it('retains server fields when applying partial update responses', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'sent';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].resolve([{ id: 'plan-a', note: 'server-normalized' }]);
  await Promise.resolve();
  expect(f.cache[0]).toMatchObject({
    note: 'server-normalized',
    levelTarget: 90,
    weaponPlans: [{ id: 'weapon-a' }],
  });
});

it('keeps in-flight requests immutable and rebases later edits onto the server response', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 20;
  });
  await vi.advanceTimersByTimeAsync(450);
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.note = 'newer edit';
  });
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(1);
  expect(f.requests[0].operations[0]).toMatchObject({
    value: { levelCurrent: 20, note: '' },
  });
  expect(f.charactersView()[0]).toMatchObject({
    levelCurrent: 20,
    note: 'newer edit',
  });
  f.requests[0].resolve([
    { ...plan(), levelCurrent: 21, levelTarget: 80, note: '' },
  ]);
  await Promise.resolve();
  expect(f.charactersView()[0]).toMatchObject({
    levelCurrent: 21,
    levelTarget: 80,
    note: 'newer edit',
    isOptimistic: true,
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(f.requests).toHaveLength(2);
  expect(f.requests[1].operations[0]).toMatchObject({
    value: { levelCurrent: 21, levelTarget: 80, note: 'newer edit' },
  });
  f.requests[1].resolve([
    { ...plan(), levelCurrent: 21, levelTarget: 80, note: 'newer edit' },
  ]);
  await Promise.resolve();
  expect(f.charactersView()[0]).not.toHaveProperty('isOptimistic');
  expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
});

it('waits out the original batching window for edits made just before a request completes', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'first';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  f.requests[0].resolve([{ ...plan(), note: 'first' }]);
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(449);
  expect(f.requests).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(f.requests).toHaveLength(2);
});

it('allows deletes to queue behind an update in flight without resurrecting the record', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'first';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.coordinator.delete(f.characters, 'plan-a');
  expect(f.charactersView()).toEqual([]);
  f.requests[0].resolve([{ ...plan(), note: 'first' }]);
  await Promise.resolve();
  expect(f.charactersView()).toEqual([]);
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[1].operations).toEqual([
    { type: 'delete', collectionName: 'characterPlans', id: 'plan-a' },
  ]);
  f.requests[1].resolve([{ id: 'plan-a' }]);
  await Promise.resolve();
  expect(f.cache).toEqual([]);
});

it('blocks edits and deletes of a create in flight until its real ID arrives', async () => {
  const f = setup();
  f.coordinator.create(f.characters, plan('temporary-id'));
  await vi.advanceTimersByTimeAsync(450);
  expect(f.charactersView()[1].isOptimisticBlocked).toBe(true);
  f.coordinator.update(f.characters, f.charactersView()[1], (draft) => {
    draft.note = 'ignored';
  });
  f.coordinator.delete(f.characters, 'temporary-id');
  f.requests[0].resolve([{ ...plan('server-id'), note: 'saved' }]);
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(1);
  expect(f.charactersView().map((p) => p.id)).toEqual(['plan-a', 'server-id']);
  expect(f.charactersView()[1]).not.toHaveProperty('isOptimisticBlocked');
});

it('retains the entire failed batch, flags only affected scopes, and does not commit any records', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'character';
  });
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  await vi.advanceTimersByTimeAsync(450);
  const error = new Error('one invalid update');
  f.requests[0].reject(error);
  await Promise.resolve();
  expect(f.commit).not.toHaveBeenCalled();
  expect(f.cache[0].note).toBe('');
  expect(f.charactersView()[0]).toMatchObject({
    note: 'character',
    isOptimisticError: true,
  });
  expect(f.weaponsView()[0]).toMatchObject({
    levelCurrent: 80,
    isOptimisticError: true,
  });
  expect(f.coordinator.getStatus('characters')).toEqual({
    hasChanges: true,
    isPending: false,
    isError: true,
  });
  expect(f.coordinator.getStatus('unrelated')).toEqual({
    hasChanges: false,
    isPending: false,
    isError: false,
  });
  expect(f.onError).toHaveBeenCalledTimes(1);
  expect(f.onError.mock.calls[0][0]).toBe(error);
  await vi.advanceTimersByTimeAsync(5000);
  expect(f.requests).toHaveLength(1);
});

it('retries the failed batch together with newer edits and deletions', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 20;
  });
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  await vi.advanceTimersByTimeAsync(450);
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.note = 'newer';
  });
  f.coordinator.delete(f.weapons, 'weapon-a');
  f.requests[0].reject(new Error('offline'));
  await Promise.resolve();
  f.onError.mock.calls[0][1]();
  expect(f.requests).toHaveLength(2);
  expect(f.requests[1].operations).toMatchObject([
    {
      type: 'update',
      collectionName: 'characterPlans',
      value: { levelCurrent: 20, note: 'newer' },
    },
    { type: 'delete', collectionName: 'weaponPlans', id: 'weapon-a' },
  ]);
  expect(f.coordinator.getStatus('characters')).toEqual({
    hasChanges: true,
    isPending: true,
    isError: false,
  });
  f.coordinator.retry();
  expect(f.requests).toHaveLength(2);
});

it('automatically retries when a failed record is edited, preserving all earlier patches', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.substats.push('atk');
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].reject(new Error('invalid'));
  await Promise.resolve();
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.substats.push('crit');
  });
  expect(f.requests).toHaveLength(2);
  expect(f.requests[1].operations[0]).toMatchObject({
    value: { substats: ['atk', 'crit'] },
  });
});

it('allows a failed create to be corrected and retried as one create', async () => {
  const f = setup();
  f.coordinator.create(f.characters, plan('temporary-id'));
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].reject(new Error('invalid'));
  await Promise.resolve();
  expect(f.charactersView()[1]).toMatchObject({
    isOptimisticBlocked: false,
    isOptimisticError: true,
  });
  f.coordinator.update(f.characters, f.charactersView()[1], (draft) => {
    draft.note = 'corrected';
  });
  expect(f.requests[1].operations).toMatchObject([
    { type: 'create', value: { note: 'corrected' } },
  ]);
  f.requests[1].resolve([{ ...plan('real-id'), note: 'corrected' }]);
  await Promise.resolve();
  expect(f.cache[1]).toMatchObject({ id: 'real-id', note: 'corrected' });
});

it('can discard a failed create without leaving a failed or pending batch behind', async () => {
  const f = setup();
  f.coordinator.create(f.characters, plan('temporary-id'));
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].reject(new Error('invalid'));
  await Promise.resolve();
  const listener = vi.fn();
  f.coordinator.subscribe(listener);
  f.coordinator.delete(f.characters, 'temporary-id');
  expect(f.coordinator.getStatus('characters')).toEqual({
    hasChanges: false,
    isPending: false,
    isError: false,
  });
  expect(f.charactersView().map((p) => p.id)).toEqual(['plan-a']);
  expect(f.requests).toHaveLength(1);
  expect(listener).toHaveBeenCalled();
});

it('does not retry no-op edits on a failed batch', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'first';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].reject(new Error('offline'));
  await Promise.resolve();
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.note = 'first';
  });
  expect(f.requests).toHaveLength(1);
  expect(f.coordinator.getStatus('characters').isError).toBe(true);
});

it('forgets unsent work on session reset', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'old session';
  });
  f.coordinator.reset();
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(0);
  expect(f.charactersView()[0]).toMatchObject({ note: '' });
  expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
});

it.each(['success', 'failure'])(
  'ignores stale in-flight %s after a session reset',
  async (outcome) => {
    const f = setup();
    f.coordinator.update(f.characters, f.cache[0], (draft) => {
      draft.note = 'old session';
    });
    await vi.advanceTimersByTimeAsync(450);
    f.coordinator.reset();
    f.coordinator.update(f.characters, f.cache[0], (draft) => {
      draft.note = 'new session';
    });
    await vi.advanceTimersByTimeAsync(450);
    if (outcome === 'success')
      f.requests[0].resolve([{ ...plan(), note: 'stale response' }]);
    else f.requests[0].reject(new Error('stale failure'));
    await Promise.resolve();
    expect(f.commit).not.toHaveBeenCalled();
    expect(f.onError).not.toHaveBeenCalled();
    expect(f.charactersView()[0].note).toBe('new session');
    expect(f.coordinator.getStatus('characters').isPending).toBe(true);
    f.requests[1].resolve([{ ...plan(), note: 'new session' }]);
    await Promise.resolve();
    expect(f.cache[0].note).toBe('new session');
    expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
  },
);

it('ignores old retry callbacks after the signed-in user changes', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'old session';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].reject(new Error('old failure'));
  await Promise.resolve();
  const staleRetry = f.onError.mock.calls[0][1];
  f.coordinator.reset();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'new session';
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[1].reject(new Error('new failure'));
  await Promise.resolve();
  staleRetry();
  expect(f.requests).toHaveLength(2);
  expect(f.coordinator.getStatus('characters').isError).toBe(true);
  f.coordinator.retry();
  expect(f.requests).toHaveLength(3);
  expect(f.requests[2].operations[0]).toMatchObject({
    value: { note: 'new session' },
  });
});

it('does not lose data if request serialization throws before reaching the network', async () => {
  const f = setup();
  f.coordinator.update(
    {
      ...f.characters,
      serverPatches: [{ op: 'replace', path: ['missing', 'nested'], value: 1 }],
    },
    f.cache[0],
    (draft) => {
      draft.note = 'keep me';
    },
  );
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests).toHaveLength(0);
  expect(f.charactersView()[0]).toMatchObject({
    note: 'keep me',
    isOptimisticError: true,
  });
  expect(f.onError).toHaveBeenCalledTimes(1);
});

it('treats incomplete server responses as a failed batch without a partial cache update', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'character';
  });
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  await vi.advanceTimersByTimeAsync(450);
  f.requests[0].resolve([{ ...plan(), note: 'character' }]);
  await Promise.resolve();
  expect(f.commit).not.toHaveBeenCalled();
  expect(f.coordinator.getStatus('characters').isError).toBe(true);
  expect(f.coordinator.getStatus('weapons-a').isError).toBe(true);
});

it('keeps the failed marker visible on a record with newer queued edits', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.levelCurrent = 20;
  });
  await vi.advanceTimersByTimeAsync(450);
  f.coordinator.update(f.characters, f.charactersView()[0], (draft) => {
    draft.note = 'newer';
  });
  f.requests[0].reject(new Error('offline'));
  await Promise.resolve();
  expect(f.charactersView()[0]).toMatchObject({
    levelCurrent: 20,
    note: 'newer',
    isOptimisticError: true,
  });
});

it('splits large queues at the server’s 150-operation limit without overlapping requests', async () => {
  const f = setup(
    Array.from({ length: 151 }, (_, index) => plan(`plan-${index}`)),
  );
  for (const record of f.cache) f.coordinator.delete(f.characters, record.id);
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests).toHaveLength(1);
  expect(f.requests[0].operations).toHaveLength(150);
  f.requests[0].resolve(
    Array.from({ length: 150 }, (_, index) => ({ id: `plan-${index}` })),
  );
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(f.requests).toHaveLength(2);
  expect(f.requests[1].operations).toEqual([
    { type: 'delete', collectionName: 'characterPlans', id: 'plan-150' },
  ]);
  f.requests[1].resolve([{ id: 'plan-150' }]);
  await Promise.resolve();
  expect(f.cache).toEqual([]);
  expect(f.coordinator.getStatus('characters').hasChanges).toBe(false);
});

it('lets enabled scopes flush while a disabled scope retains its edits', async () => {
  const f = setup();
  f.coordinator.setDisabled('characters', true);
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'paused';
  });
  f.coordinator.update(f.weapons, weapon(), (draft) => {
    draft.levelCurrent = 80;
  });
  await vi.advanceTimersByTimeAsync(450);
  expect(f.requests[0].operations).toMatchObject([
    { collectionName: 'weaponPlans' },
  ]);
  expect(f.requests[0].operations).toHaveLength(1);
  f.requests[0].resolve([{ ...weapon(), levelCurrent: 80 }]);
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(1);
  expect(f.charactersView()[0]).toMatchObject({
    note: 'paused',
    isOptimistic: true,
  });
  f.coordinator.setDisabled('characters', false);
  await vi.advanceTimersByTimeAsync(0);
  expect(f.requests[1].operations).toMatchObject([
    { collectionName: 'characterPlans', value: { note: 'paused' } },
  ]);
});

it('pauses an already scheduled scope without losing its batching deadline', async () => {
  const f = setup();
  f.coordinator.update(f.characters, f.cache[0], (draft) => {
    draft.note = 'paused';
  });
  await vi.advanceTimersByTimeAsync(400);
  f.coordinator.setDisabled('characters', true);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.requests).toHaveLength(0);
  f.coordinator.setDisabled('characters', false);
  await vi.advanceTimersByTimeAsync(0);
  expect(f.requests).toHaveLength(1);
});
