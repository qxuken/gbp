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

export type PendingCharacter = {
  id: string;
  characterId: string;
  order: number;
  state: 'pending' | 'sent' | 'failed';
};

export interface NewCharacterPlans {
  characterPlans: PendingCharacter[];
  latestId: number;
  addNew(characterId: string, itemsCount: number): void;
  planSent(planId: PendingCharacter['id']): void;
  planError(planId: PendingCharacter['id']): void;
  planRetry(planId: PendingCharacter['id']): void;
  planReady(planId: PendingCharacter['id']): void;
}

export const newCharacterPlans = create<NewCharacterPlans>((set) => ({
  characterPlans: [],
  latestId: 0,
  addNew(characterId, itemsCount) {
    set((state) => ({
      latestId: state.latestId + 1,
      characterPlans: [
        ...state.characterPlans,
        {
          id: String(state.latestId + 1),
          characterId,
          order: itemsCount + state.characterPlans.length + 1,
          state: 'pending',
        },
      ],
    }));
  },
  planSent(pendingPlanId) {
    set((state) => ({
      characterPlans: state.characterPlans.map((p) =>
        p.id == pendingPlanId ? { ...p, state: 'sent' } : p,
      ),
    }));
  },
  planError(pendingPlanId) {
    set((state) => ({
      characterPlans: state.characterPlans.map((p) =>
        p.id == pendingPlanId ? { ...p, state: 'failed' } : p,
      ),
    }));
  },
  planRetry(pendingPlanId) {
    set((state) => ({
      characterPlans: state.characterPlans.map((p) =>
        p.id == pendingPlanId ? { ...p, state: 'pending' } : p,
      ),
    }));
  },
  planReady(pendingPlanId) {
    set((state) => ({
      characterPlans: state.characterPlans.filter((p) => p.id != pendingPlanId),
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
function createPlans({ characterPlans }: NewCharacterPlans) {
  for (const pendingPlan of characterPlans) {
    if (pendingPlan.state !== 'pending') {
      continue;
    }
    const plan = newCharacterPlan(pendingPlan);
    if (!plan) {
      break;
    }
    let retries = 0;
    newCharacterPlans.getState().planSent(pendingPlan.id);
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
        newCharacterPlans.getState().planReady(pendingPlan.id);
      } catch {
        if (retries >= 3) {
          newCharacterPlans.getState().planError(pendingPlan.id);
          toast.error('Error', {
            description: 'Unable to create character',
            action: {
              label: 'Retry',
              onClick() {
                newCharacterPlans.getState().planRetry(pendingPlan.id);
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
