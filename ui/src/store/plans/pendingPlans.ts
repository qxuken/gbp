import { atom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { toast } from 'sonner';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
import { store } from '@/store/jotai-store';

import { auth } from '../auth';
import { plansAtom } from './plans';

export type PendingCharacter = {
  id: string;
  characterId: string;
  order: number;
  state: 'pending' | 'sent' | 'failed';
};

export const pendingCharacterPlansMapAtom = atomWithImmer(
  new Map<string, PendingCharacter>(),
);
export const pendingCharacterPlansAtom = atom((get) => {
  const items = get(pendingCharacterPlansMapAtom);
  return Array.from(items.values());
});
export const addNewCharacterPlanAtom = atom(
  null,
  (get, set, characterId: string) => {
    const id = Date.now().toString();
    const len = get(plansAtom).size;
    set(pendingCharacterPlansMapAtom, (plans) => {
      plans.set(id, {
        id,
        characterId,
        order: len + plans.size + 1,
        state: 'pending',
      });
    });
  },
);

store.sub(pendingCharacterPlansMapAtom, () => {
  const pendingPlans = store.get(pendingCharacterPlansMapAtom);
  for (const pendingPlan of pendingPlans.values()) {
    if (pendingPlan.state != 'pending') {
      continue;
    }
    const newPlanData = newCharacterPlan(pendingPlan);
    if (!newPlanData) {
      break;
    }
    let retries = 0;
    store.set(pendingCharacterPlansMapAtom, (pendingPlans) => {
      const pp = pendingPlans.get(pendingPlan.id);
      if (pp) pp.state = 'sent';
    });
    async function try_create() {
      try {
        const res = await pbClient
          .collection<CharacterPlans>('characterPlans')
          .create(newPlanData);
        store.set(plansAtom, (plans) => {
          plans.set(res.id, res);
        });
        toast.success('Plan successfuly created');
        store.set(pendingCharacterPlansMapAtom, (pendingPlans) => {
          pendingPlans.delete(pendingPlan.id);
        });
      } catch {
        if (retries >= 3) {
          store.set(pendingCharacterPlansMapAtom, (pendingPlans) => {
            const pp = pendingPlans.get(pendingPlan.id);
            if (pp) pp.state = 'failed';
          });
          toast.error('Error', {
            description: 'Unable to create character',
            action: {
              label: 'Retry',
              onClick() {
                store.set(pendingCharacterPlansMapAtom, (pendingPlans) => {
                  const pp = pendingPlans.get(pendingPlan.id);
                  if (pp) pp.state = 'pending';
                });
              },
            },
          });
        } else {
          retries += 1;
          try_create();
        }
      }
    }
    try_create();
  }
});

function newCharacterPlan(
  pending: PendingCharacter,
): Omit<CharacterPlans, 'id'> | undefined {
  if (!pbClient.authStore.record) {
    auth.getState().authRefresh();
    return;
  }
  return {
    user: pbClient.authStore.record?.id,
    character: pending.characterId,
    order: pending.order,
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
  };
}
