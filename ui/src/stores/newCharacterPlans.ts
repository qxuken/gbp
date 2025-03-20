import { ClientResponseError } from 'pocketbase';
import { toast } from 'sonner';
import { create } from 'zustand';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
import { queryClient } from '@/main';

import { auth } from './auth';

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

type PendingCharacter = {
  id: string;
  characterId: string;
  order: number;
};

export interface NewCharacterPlans {
  characterPlans: PendingCharacter[];
  sentPlans: WeakSet<PendingCharacter>;
  latestId: number;
  addNew(characterId: string, itemsCount: number): void;
  planReady(planId: PendingCharacter): void;
}

export const newCharacterPlans = create<NewCharacterPlans>((set) => ({
  characterPlans: [],
  latestId: 0,
  sentPlans: new WeakSet(),
  addNew(characterId, itemsCount) {
    const newId = this.latestId + 1;
    set(() => ({
      latestId: newId,
      characterPlans: [
        ...this.characterPlans,
        {
          id: String(newId),
          characterId,
          order: itemsCount + this.characterPlans.length + 1,
        },
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
    const plan = newCharacterPlan(pendingPlan);
    if (!plan) {
      break;
    }
    sentPlans.add(pendingPlan);
    let retries = 0;
    async function try_create() {
      try {
        const res = await pbClient
          .collection<CharacterPlans>('characterPlans')
          .create(plan);
        queryClient.setQueryData(['characterPlans', res.id], res);
        await queryClient.invalidateQueries({
          queryKey: ['characterPlans', 'page'],
        });
        toast.success('Plan successfuly created');
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
