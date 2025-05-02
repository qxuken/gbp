import { TeamPlans } from '../types';
import { useSharedPendingPlansCollectionReporter } from './plans';
import {
  OptimisticRecord,
  usePlanCollectionAccessor,
  useCollectionMutation,
} from './utils/use-collection-mutation';

export function newTeamPlansMutation(planId: string) {
  return ['plans', planId, 'teamPlans'];
}

export type OptimisticTeamPlans = OptimisticRecord<TeamPlans>;

export function useTeamPlansMutation(
  planId: string,
  teamPlans?: TeamPlans[],
  disabled?: boolean,
) {
  const collectionGetter = usePlanCollectionAccessor('teamPlans', planId);
  const [onPendingChange, onErrorChange] =
    useSharedPendingPlansCollectionReporter('teamPlans', planId);
  const mutation = useCollectionMutation(
    'teamPlans',
    collectionGetter,
    teamPlans,
    disabled,
    newTeamPlansMutation(planId),
    { debounceMS: 0, onPendingChange, onErrorChange },
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
