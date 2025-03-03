import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';
import { create } from 'zustand';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
import { queryClient } from '@/main';

import { auth } from './auth';

function newCharacterPlan(characterId: string) {
  if (!pbClient.authStore.record) {
    auth.getState().authRefresh();
    return;
  }
  return {
    user: pbClient.authStore.record?.id,
    character: characterId,
    constellation_current: 0,
    constellation_target: 6,
    level_current: 0,
    level_target: 90,
    talent_atk_current: 0,
    talent_atk_target: 10,
    talent_skill_current: 0,
    talent_skill_target: 13,
    talent_burst_current: 0,
    talent_burst_target: 13,
    artifact_sets: [],
  };
}

type PendingCharacter = {
  id: string;
  characterId: string;
};

export interface NewCharacterPlans {
  characterPlans: PendingCharacter[];
  sentPlans: WeakSet<PendingCharacter>;
  latestId: number;
  addNew(plan: string): void;
  planReady(planId: PendingCharacter): void;
}

export const newCharacterPlans = create<NewCharacterPlans>((set) => ({
  characterPlans: [],
  latestId: 0,
  sentPlans: new WeakSet(),
  addNew(characterId) {
    const newId = this.latestId + 1;
    set(() => ({
      latestId: newId,
      characterPlans: [
        ...this.characterPlans,
        { id: String(newId), characterId },
      ],
    }));
  },
  planReady(pendingPlan) {
    this.sentPlans.delete(pendingPlan);
    set(() => ({
      characterPlans: this.characterPlans.filter((p) => p != pendingPlan),
    }));
  },
}));

auth.subscribe((state) => {
  if (!state.isAuthenticated) {
    newCharacterPlans.setState({ latestId: 0, characterPlans: [] });
  }
});

newCharacterPlans.subscribe(createPlans);
createPlans(newCharacterPlans.getState());
function createPlans({ characterPlans, sentPlans }: NewCharacterPlans) {
  for (const pendingPlan of characterPlans) {
    if (sentPlans.has(pendingPlan)) {
      continue;
    }
    const plan = newCharacterPlan(pendingPlan.characterId);
    if (!plan) {
      break;
    }
    sentPlans.add(pendingPlan);
    let retries = 0;
    async function try_create() {
      try {
        const res = await pbClient
          .collection<CharacterPlans>('character_plans')
          .create(plan);
        queryClient.setQueryData(['character_plans', res.id], res);
        await queryClient.invalidateQueries({
          queryKey: ['character_plans'],
          exact: true,
        });
        newCharacterPlans.getState().planReady(pendingPlan);
      } catch (e) {
        if (!(e instanceof ClientResponseError)) {
          return;
        }
        if (retries >= 3) {
          toast.error('Error', {
            description: e.message,
            action: {
              label: 'Retry',
              onClick() {
                retries = 0;
                try_create();
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
}

export function useNewCharacterPlans() {
  return newCharacterPlans();
}
