import { BehaviorSubject, Observable, Subject, from, of, zip } from 'rxjs';
import { catchError, filter, map, retry, switchMap, tap } from 'rxjs/operators';

import { pbClient } from '@/api/pocketbase';
import { Plans } from '@/api/types';

type OptimisticRecord<Ctx = unknown> = {
  ctx?: Ctx;
} & (
  | {
      state: 'loading';
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

type Command = { type: 'LOAD_PLANS'; force?: boolean };

const plans = new BehaviorSubject<Map<string, Plans>>(new Map());
const plansQueryState = new BehaviorSubject<PlansQueryState>({ state: 'init' });
const pendingPlans = new BehaviorSubject<Map<string, OptimisticRecord<Plans>>>(
  new Map(),
);

export const commands = new Subject<Command>();

export const loadPlans$ = from(zip(commands, plansQueryState, plans)).pipe(
  filter(
    ([cmd, state]) =>
      cmd.type === 'LOAD_PLANS' && (cmd.force || state.state === 'init'),
  ),
  tap(([cmd]) => {
    if (!cmd.force) {
      const currentPlans = plans.getValue();
      if (currentPlans.size > 0) {
        return;
      }
    }
    plans.next(new Map());
  }),
  switchMap(() => pbClient.collection<Plans>('plans').getFullList()),
  retry(3),
  map((plansList) => {
    const plansMap = new Map<string, Plans>();
    for (const plan of plansList) {
      plansMap.set(plan.id, plan);
    }
    return plansMap;
  }),
  tap((plansMap) => plans.next(plansMap)),
  catchError((error) => {
    console.error('Failed to load plans:', error);
    return of(new Map());
  }),
);
