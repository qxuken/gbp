import { TeamPlans } from '../types';
import {
  OptimisticRecord,
  usePlansInnerCollectionMutation,
} from './utils/use-plans-inner-collection-mutation';

export function newTeamPlansMutation(planId: string) {
  return ['plans', planId, 'teamPlans'];
}

export type OptimisticTeamPlans = OptimisticRecord<TeamPlans>;

export function useTeamPlansMutation(
  planId: string,
  teamPlans?: TeamPlans[],
  disabled?: boolean,
) {
  const mutation = usePlansInnerCollectionMutation(
    'teamPlans',
    'teamPlans',
    planId,
    teamPlans,
    disabled,
    newTeamPlansMutation(planId),
  );

  const createHandler = (characterId: string) => {
    const id = Date.now().toString();
    const ts = new Date();
    mutation.create({
      id,
      created: ts,
      updated: ts,
      characterPlan: planId,
      characters: [characterId],
    });
  };

  return { ...mutation, create: createHandler };
}
