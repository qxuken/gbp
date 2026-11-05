import { applyPatches, Patch, produceWithPatches, WritableDraft } from 'immer';

import type { Plans } from '@/api/types';

export type OptimisticRecord<T> = T & {
  isOptimistic?: boolean;
  isOptimisticBlocked?: boolean;
  isOptimisticError?: boolean;
};

type MutationRecord = { id: string };
type MutationType = 'create' | 'update' | 'delete';

export interface MutationTarget<T extends MutationRecord> {
  scope: string;
  collectionName: string;
  getCollectionToUpdate: (plans: Plans[]) => T[] | undefined;
  serverPatches?: Patch[];
  postUpdate?: (records: T[]) => void;
}

export type BatchOperation = {
  collectionName: string;
  id: string;
} & (
  | { type: 'create' | 'update'; value: Record<string, unknown> }
  | { type: 'delete' }
);

interface QueuedMutation {
  type: MutationType;
  scope: string;
  collectionName: string;
  id: string;
  value: MutationRecord;
  patches: Patch[];
  serverPatches: Patch[];
  applyResult: (plans: Plans[], body: MutationRecord) => void;
}

interface Dependencies {
  send: (operations: BatchOperation[]) => Promise<MutationRecord[]>;
  commit: (apply: (plans: Plans[]) => void) => void;
  onError: (error: unknown, retry: () => void) => void;
}

const BATCH_WINDOW_MS = 450;
// Matches settings.Batch.MaxRequests in migrations/1732466000_app_setup.go.
const MAX_BATCH_OPERATIONS = 150;
const keyOf = (collectionName: string, id: string) =>
  JSON.stringify([collectionName, id]);

/** One queue and one in-flight request for all plan collections in a session. */
export class CollectionMutationCoordinator {
  private queued = new Map<string, QueuedMutation>();
  private current: {
    entries: Map<string, QueuedMutation>;
    state: 'sending' | 'error';
  } | null = null;
  private readyAt: number | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private version = 0;
  private disabledScopes = new Set<string>();
  private scopeVersions = new Map<string, number>();
  private listeners = new Set<() => void>();

  constructor(private dependencies: Dependencies) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (scope?: string) =>
    scope === undefined ? this.version : (this.scopeVersions.get(scope) ?? 0);

  setDisabled(scope: string, disabled: boolean) {
    if (disabled) this.disabledScopes.add(scope);
    else this.disabledScopes.delete(scope);
    this.schedule();
  }

  getStatus(scope: string) {
    const queued = [...this.queued.values()].some(
      (entry) => entry.scope === scope,
    );
    const current = [...(this.current?.entries.values() ?? [])].some(
      (entry) => entry.scope === scope,
    );
    return {
      hasChanges: queued || current,
      isPending: queued || (current && this.current?.state === 'sending'),
      isError: current && this.current?.state === 'error',
    };
  }

  getRecords<T extends MutationRecord>(
    scope: string,
    collectionName: string,
    records: T[] = [],
  ): OptimisticRecord<T>[] {
    const result = new Map<string, OptimisticRecord<T>>(
      records.map((record) => [record.id, record]),
    );
    for (const [entries, inFlight] of [
      [this.current?.entries, true],
      [this.queued, false],
    ] as const) {
      for (const entry of entries?.values() ?? []) {
        if (entry.collectionName !== collectionName) continue;
        if (
          !result.has(entry.id) &&
          !(entry.type === 'create' && entry.scope === scope)
        )
          continue;
        if (entry.type === 'delete') {
          result.delete(entry.id);
          continue;
        }
        const value =
          entry.type === 'create'
            ? entry.value
            : (result.get(entry.id) ?? entry.value);
        result.set(entry.id, {
          ...applyPatches(value, entry.patches),
          isOptimistic: true,
          isOptimisticBlocked:
            entry.type === 'create' &&
            inFlight &&
            this.current?.state === 'sending',
          isOptimisticError:
            this.current?.state === 'error' &&
            this.current.entries.has(keyOf(collectionName, entry.id)),
        } as OptimisticRecord<T>);
      }
    }
    return [...result.values()];
  }

  create<T extends MutationRecord>(target: MutationTarget<T>, value: T) {
    this.enqueue(this.entry(target, 'create', value));
  }

  update<T extends MutationRecord>(
    target: MutationTarget<T>,
    value: T,
    recipe: (draft: WritableDraft<T>) => void,
  ) {
    const [, patches] = produceWithPatches(
      value,
      (draft) => void recipe(draft as WritableDraft<T>),
    );
    if (patches.length)
      this.enqueue(this.entry(target, 'update', value, patches));
  }

  delete<T extends MutationRecord>(target: MutationTarget<T>, id: string) {
    this.enqueue(this.entry(target, 'delete', { id } as T));
  }

  retry = () => {
    if (this.current?.state !== 'error') return;
    const entries = this.current.entries;
    const changed = [...entries.values(), ...this.queued.values()];
    for (const [key, entry] of this.queued) this.merge(entries, key, entry);
    this.queued = entries;
    this.current = null;
    this.readyAt = Date.now();
    this.publish(changed);
    if (!this.queued.size) {
      this.schedule();
      return;
    }
    void this.flush();
  };

  reset() {
    const changed = [
      ...(this.current?.entries.values() ?? []),
      ...this.queued.values(),
    ];
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.readyAt = undefined;
    this.queued.clear();
    this.current = null;
    this.publish(changed);
  }

  private entry<T extends MutationRecord>(
    target: MutationTarget<T>,
    type: MutationType,
    value: T,
    patches: Patch[] = [],
  ): QueuedMutation {
    return {
      type,
      scope: target.scope,
      collectionName: target.collectionName,
      id: value.id,
      value,
      patches,
      serverPatches: target.serverPatches ?? [],
      applyResult(plans, body) {
        const records = target.getCollectionToUpdate(plans);
        if (!records)
          throw new Error(`Missing ${target.collectionName} collection`);
        const index = records.findIndex((record) => record.id === value.id);
        if (type === 'create') records.push(body as T);
        else if (type === 'delete') {
          if (index >= 0) records.splice(index, 1);
        } else {
          if (index < 0)
            throw new Error(
              `Missing ${target.collectionName} record ${value.id}`,
            );
          records[index] = { ...records[index], ...body };
        }
        target.postUpdate?.(records);
      },
    };
  }

  private merge(
    entries: Map<string, QueuedMutation>,
    key: string,
    entry: QueuedMutation,
  ) {
    const previous = entries.get(key);
    if (previous?.type === 'delete') return;
    if (previous?.type === 'create') {
      if (entry.type === 'delete') entries.delete(key);
      else {
        previous.value = applyPatches(previous.value, entry.patches);
      }
    } else if (previous?.type === 'update' && entry.type === 'update') {
      previous.patches = previous.patches.concat(entry.patches);
    } else entries.set(key, entry);
  }

  private enqueue(entry: QueuedMutation) {
    const key = keyOf(entry.collectionName, entry.id);
    const active = this.current?.entries.get(key);
    // A create's temporary ID cannot be addressed on the server until it succeeds.
    if (
      this.current?.state === 'sending' &&
      (active?.type === 'create' || active?.type === 'delete')
    )
      return;
    if (!this.queued.size) this.readyAt = Date.now() + BATCH_WINDOW_MS;
    this.merge(this.queued, key, entry);
    if (this.current?.state === 'error') {
      this.retry();
      return;
    }
    this.publish([entry]);
    this.schedule();
  }

  private publish(
    entries: Iterable<QueuedMutation> = [
      ...(this.current?.entries.values() ?? []),
      ...this.queued.values(),
    ],
  ) {
    this.version++;
    for (const entry of entries)
      this.scopeVersions.set(entry.scope, this.version);
    this.listeners.forEach((listener) => listener());
  }

  private schedule() {
    const hasEnabledChanges = [...this.queued.values()].some(
      (entry) => !this.disabledScopes.has(entry.scope),
    );
    if (!hasEnabledChanges) {
      clearTimeout(this.timer);
      this.timer = undefined;
      if (!this.queued.size) this.readyAt = undefined;
    } else if (!this.current && this.timer === undefined) {
      this.timer = setTimeout(
        () => {
          this.timer = undefined;
          void this.flush();
        },
        Math.max(0, (this.readyAt ?? Date.now()) - Date.now()),
      );
    }
  }

  private serialize(entry: QueuedMutation): BatchOperation {
    const { type, collectionName, id } = entry;
    if (type === 'delete') return { type, collectionName, id };
    const value: Record<string, unknown> = {
      ...applyPatches(entry.value, entry.patches.concat(entry.serverPatches)),
    };
    delete value.isOptimistic;
    delete value.isOptimisticBlocked;
    delete value.isOptimisticError;
    if (type === 'create') {
      delete value.id;
      delete value.created;
      delete value.updated;
    }
    return { type, collectionName, id, value };
  }

  private async flush() {
    if (this.current) return;
    const entriesToSend = new Map(
      [...this.queued]
        .filter(([, entry]) => !this.disabledScopes.has(entry.scope))
        .slice(0, MAX_BATCH_OPERATIONS),
    );
    if (!entriesToSend.size) return;
    const batch = {
      entries: entriesToSend,
      state: 'sending' as 'sending' | 'error',
    };
    this.current = batch;
    for (const key of batch.entries.keys()) this.queued.delete(key);
    if (!this.queued.size) this.readyAt = undefined;
    const generation = this.generation;
    this.publish();
    try {
      const entries = [...batch.entries.values()];
      const responses = await this.dependencies.send(
        entries.map((entry) => this.serialize(entry)),
      );
      if (generation !== this.generation) return;
      if (
        responses.length !== entries.length ||
        entries.some(
          (entry, index) =>
            entry.type !== 'delete' &&
            (!responses[index]?.id ||
              (entry.type === 'update' && responses[index].id !== entry.id)),
        )
      )
        throw new Error('Invalid plan batch response');
      this.dependencies.commit((plans) => {
        entries.forEach((entry, index) =>
          entry.applyResult(plans, responses[index]),
        );
      });
      entries.forEach((entry, index) => {
        const next = this.queued.get(keyOf(entry.collectionName, entry.id));
        if (next?.type === 'update')
          next.value = { ...next.value, ...responses[index] };
      });
      this.current = null;
      this.publish([...entries, ...this.queued.values()]);
      this.schedule();
    } catch (error) {
      if (generation !== this.generation) return;
      batch.state = 'error';
      this.publish();
      this.dependencies.onError(error, () => {
        if (generation === this.generation) this.retry();
      });
    }
  }
}
