import { produce } from 'immer';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans, Plans } from '@/api/types';
import { AsyncDebounce } from '@/lib/async-debounce';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { retryPromise } from '@/lib/retry-promise';

type OptimisticRecord<Item extends object, Ctx = unknown> = {
  ctx?: Ctx;
} & (
  | {
      state: 'loading';
      task: AsyncDebounce<Item, void>;
    }
  | {
      state: 'error';
      message: string;
      internalError?: unknown;
      cancel?: () => void;
      retry?: () => void;
    }
);

type PlansQueryState =
  | {
      state: 'init';
    }
  | {
      state: 'loaded';
    }
  | {
      state: 'loading';
    }
  | {
      state: 'error';
      message: string;
      internalError: unknown;
    };

type UpdateCallback = () => void;

function newCharacterPlan(
  id: string,
  character: string,
  order: number,
): CharacterPlans {
  if (!pbClient.authStore.record) {
    throw new Error('User should be authorized at this point');
  }
  return {
    collectionId: '',
    collectionName: '',
    id,
    user: pbClient.authStore.record.id,
    character,
    order,
    constellationCurrent: 0,
    constellationTarget: 0,
    levelCurrent: 1,
    levelTarget: 90,
    talentAtkCurrent: 1,
    talentAtkTarget: 10,
    talentSkillCurrent: 1,
    talentSkillTarget: 10,
    talentBurstCurrent: 1,
    talentBurstTarget: 10,
    substats: [],
    note: '',
  };
}

class PlansState {
  items = new Map<string, Plans>();
  queryState: PlansQueryState = { state: 'init' };
  pendingUpdate = new Map<string, OptimisticRecord<Plans>>();
}

class PlansCommands {
  constructor(
    private readonly repo: PlansState,
    private readonly presenter: PlansPresentation,
  ) {}

  async load(force = false) {
    if (!force && this.repo.queryState.state !== 'init') {
      return;
    }
    this.repo.items.clear();
    this.repo.queryState = { state: 'loading' };
    try {
      const plans = await retryPromise(() =>
        pbClient.collection<Plans>('plans').getFullList(),
      );
      for (const plan of plans) {
        this.repo.items = this.repo.items.set(plan.id, plan);
      }
      this.repo.queryState = { state: 'loaded' };
    } catch (error) {
      this.repo.queryState = {
        state: 'error',
        message: 'Loading error',
        internalError: error,
      };
    } finally {
      this.presenter.updated();
    }
  }

  async create(characterId: string) {
    const id = Date.now().toString();
    const order = this.repo.items.size + 1;
    try {
      const pendingCharacterPlan = newCharacterPlan(id, characterId, order);
      const pendingUpdate = {
        ctx: pendingCharacterPlan,
        state: 'loading',
        task: new AsyncDebounce(async (pendingCharacterPlan) => {
          const newPlan = await retryPromise(() =>
            pbClient.collection<CharacterPlans>('characterPlans').create({
              ...pendingCharacterPlan,
              id: undefined,
              collectionName: undefined,
              collectionId: undefined,
            }),
          );
          this.repo.items.delete(id);
          this.repo.pendingUpdate.delete(id);
          this.repo.items.set(newPlan.id, newPlan);
          this.presenter.updated();
        }, 0),
      } satisfies OptimisticRecord<Plans>;
      this.repo.items.set(id, pendingCharacterPlan);
      this.repo.pendingUpdate.set(id, pendingUpdate);
      this.presenter.updated();
      pendingUpdate.task.run(pendingCharacterPlan);
    } catch (error) {
      const pendingUpdate = this.repo.pendingUpdate.get(id);
      if (pendingUpdate?.state !== 'loading') return;
      this.repo.pendingUpdate.set(id, {
        ctx: pendingUpdate.ctx,
        state: 'error',
        message: 'Unknown error',
        internalError: error,
        cancel: () => {
          this.repo.items.delete(id);
          this.repo.pendingUpdate.delete(id);
          this.presenter.updated();
        },
        retry: () => {
          this.repo.pendingUpdate.set(id, pendingUpdate);
          pendingUpdate.task.run(pendingUpdate.ctx as CharacterPlans);
          this.presenter.updated();
        },
      });
      this.presenter.updated();
    }
  }

  async update<Key extends keyof CharacterPlans, Value extends Plans[Key]>(
    planId: string,
    field: Key,
    value: Value,
  ) {
    const prevState = this.repo.items.get(planId);
    if (!prevState) return;
    const plan = produce(prevState, (s) => (s[field] = value));
    try {
      let pendingUpdate = this.repo.pendingUpdate.get(planId);
      if (!pendingUpdate || pendingUpdate.state === 'error') {
        pendingUpdate = {
          ctx: pendingUpdate?.ctx ?? prevState,
          state: 'loading',
          task: new AsyncDebounce(async (newPlanValue) => {
            await retryPromise(() =>
              pbClient
                .collection<CharacterPlans>('characterPlans')
                .update(newPlanValue.id, newPlanValue),
            );
            this.repo.items.delete(newPlanValue.id);
            this.repo.pendingUpdate.delete(newPlanValue.id);
            this.repo.items.set(newPlanValue.id, newPlanValue);
            this.presenter.updated(newPlanValue.id);
          }),
        } satisfies OptimisticRecord<Plans>;
        this.repo.pendingUpdate.set(planId, pendingUpdate);
      }
      this.repo.items.set(planId, plan);
      this.presenter.updated();
      pendingUpdate.task.run(plan);
    } catch (error) {
      const pendingUpdate = this.repo.pendingUpdate.get(planId);
      if (pendingUpdate?.state !== 'loading') return;
      this.repo.pendingUpdate.set(planId, {
        ctx: pendingUpdate.ctx,
        state: 'error',
        message: 'Failed to update plan',
        internalError: error,
        cancel: () => {
          const record = pendingUpdate.ctx as Plans;
          if (!record) return;
          this.repo.items.set(record.id, record);
          this.repo.pendingUpdate.delete(record.id);
          this.presenter.updated();
        },
        retry: () => {
          const record = this.repo.items.get(planId);
          if (!record) return;
          this.repo.pendingUpdate.set(record.id, pendingUpdate);
          pendingUpdate.task.run(record);
          this.presenter.updated();
        },
      });
      this.presenter.updated();
    }
  }

  async delete(plan: Plans) {
    try {
      const pendingUpdate = {
        state: 'loading',
        task: new AsyncDebounce(async (planToDelete) => {
          await retryPromise(() =>
            pbClient
              .collection<CharacterPlans>('characterPlans')
              .delete(planToDelete.id),
          );
          this.repo.items.delete(planToDelete.id);
          this.repo.pendingUpdate.delete(planToDelete.id);
          this.presenter.updated();
        }, 0),
      } satisfies OptimisticRecord<Plans>;
      this.repo.pendingUpdate.set(plan.id, pendingUpdate);
      this.repo.items.delete(plan.id);
      this.presenter.updated();
      pendingUpdate.task.run(plan);
    } catch (error) {
      const pendingUpdate = this.repo.pendingUpdate.get(plan.id);
      if (pendingUpdate?.state !== 'loading') return;
      this.repo.pendingUpdate.set(plan.id, {
        ctx: pendingUpdate.ctx,
        state: 'error',
        message: 'Failed to delete plan',
        internalError: error,
        cancel: () => {
          const record = pendingUpdate.ctx as Plans;
          if (!record) return;
          this.repo.items.set(record.id, record);
          this.repo.pendingUpdate.delete(record.id);
          this.presenter.updated();
        },
        retry: () => {
          const record = pendingUpdate.ctx as Plans;
          if (!record) return;
          this.repo.pendingUpdate.set(record.id, pendingUpdate);
          pendingUpdate.task.run(record);
          this.presenter.updated();
        },
      });
      this.presenter.updated();
    }
  }
}

class PlansPresentation {
  static readonly FULL_COLLECTION: unique symbol = Symbol('FULL_COLLECTION');
  private items: (Plans & { optimistic?: OptimisticRecord<CharacterPlans> })[] =
    [];
  private subscribers = new Map<
    string | typeof PlansPresentation.FULL_COLLECTION,
    Set<UpdateCallback>
  >();

  constructor(private readonly repo: PlansState) {}

  #update() {
    const items = Array.from(this.repo.items.values(), (it) => ({
      ...it,
      optimistic: this.repo.pendingUpdate.get(it.id),
    }));
    items.sort((a, b) => b.order - a.order);
    this.items = items;
  }

  updated(id?: string) {
    this.#update();
    const cbs =
      this.subscribers.get(id ?? PlansPresentation.FULL_COLLECTION) ?? [];
    for (const cb of cbs) {
      cb();
    }
  }

  all() {
    return this.items.map((it) => ({
      ...it,
      optimistic: this.repo.pendingUpdate.get(it.id),
    }));
  }

  subscribe(fn: UpdateCallback) {
    const cbs = mapGetOrSetDefault(
      this.subscribers,
      PlansPresentation.FULL_COLLECTION,
      () => new Set<UpdateCallback>(),
    );
    cbs.add(fn);
    return () => cbs.delete(fn);
  }

  getById(
    id: string,
  ): (Plans & { optimistic?: OptimisticRecord<CharacterPlans> }) | undefined {
    const record = this.repo.items.get(id);
    if (!record) return;
    return {
      ...record,
      optimistic: this.repo.pendingUpdate.get(id),
    };
  }

  subscribeTo(id: string, fn: UpdateCallback) {
    const cbs = mapGetOrSetDefault(
      this.subscribers,
      id,
      () => new Set<UpdateCallback>(),
    );
    cbs.add(fn);
    return () => cbs.delete(fn);
  }
}

export const state = new PlansState();
export const presenter = new PlansPresentation(state);
export const commands = new PlansCommands(state, presenter);
