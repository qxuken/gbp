import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/api/dictionaries-db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactSetsPlans } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShortBuildItem } from '@/routes/_protected/builds';

import { CharacterInfoContent } from './ui/character-info';

type Props = {
  builds: ShortBuildItem[];
};
export function BuildDomainsAnalysis({ builds }: Props) {
  return (
    <Collapsible asChild>
      <section
        aria-label="Filters"
        className="p-3 grid gap-2 min-w-xs border border-border border-dashed rounded-xl"
      >
        <div className="flex justify-between gap-2">
          <h3 className="text-md font-semibold">Farm tips</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <Icons.Dropdown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="grid gap-2">
          <BuildDomainsAnalysisContent builds={builds} />
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

export const QUERY_KEY = ['characterPlans', 'domains'];

type Item = Pick<ArtifactSetsPlans, 'artifactSets' | 'characterPlan'>;
type AggItem = {
  domain: string;
  characters: string[];
  artifactSets: string[];
};

function aggregateSets(
  domainsBySet: Map<string, string>,
  builds: ShortBuildItem[],
  items: Item[],
): AggItem[] {
  const characterByBuildId = builds.reduce((acc, it) => {
    acc.set(it.id, it.character);
    return acc;
  }, new Map<string, string>());

  const domainsWithSets = new Map<
    string,
    { characters: Set<string>; artifactSets: Set<string> }
  >();

  for (const item of items) {
    for (const artifactSet of item.artifactSets) {
      const domain = domainsBySet.get(artifactSet);
      const character = characterByBuildId.get(item.characterPlan);
      if (!domain || !character) {
        continue;
      }
      let v = domainsWithSets.get(domain);
      if (!v) {
        v = { characters: new Set(), artifactSets: new Set() };
        domainsWithSets.set(domain, v);
      }
      v.characters.add(character);
      v.artifactSets.add(artifactSet);
    }
  }
  const res = Array.from(domainsWithSets.entries()).map(([domain, v]) => ({
    domain,
    characters: Array.from(v.characters),
    artifactSets: Array.from(v.artifactSets),
  }));
  res.sort((a, b) => b.characters.length - a.characters.length);
  return res;
}

function BuildDomainsAnalysisSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="pt-1 pb-2 px-2 bg-accent/50 rounded-lg">
        <div className="flex gap-1">
          {[1, 2].map((j) => (
            <Skeleton key={j} className="size-10 rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
      </div>
      <div className="pt-1 pb-2 px-2 bg-accent rounded-lg">
        <div className="flex gap-1">
          <Skeleton className="size-10 rounded-2xl" />
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function BuildDomainsAnalysisContent({ builds }: Props) {
  const domainsBySet = useLiveQuery(
    () =>
      db.domainsOfBlessing.toArray().then((domainsOfBlessing) =>
        domainsOfBlessing.reduce((acc, it) => {
          for (const set of it.artifactSets) {
            acc.set(set, it.id);
          }
          return acc;
        }, new Map<string, string>()),
      ),
    [],
  );
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      pbClient.collection<Item>('artifactSetsPlans').getFullList({
        fields: 'artifactSets,characterPlan',
      }),
  });

  if (!domainsBySet || query.isPending || !query.data) {
    return <BuildDomainsAnalysisSkeleton />;
  }

  const agg = aggregateSets(domainsBySet, builds, query.data);
  return (
    <div className="flex flex-wrap gap-2">
      {agg.map((it) => (
        <BuildDomainsAnalysisItem key={it.domain} item={it} />
      ))}
    </div>
  );
}

type BuildDomainsAnalysisItemProps = {
  item: AggItem;
};
function BuildDomainsAnalysisItem({ item }: BuildDomainsAnalysisItemProps) {
  const characters = useLiveQuery(
    () => db.characters.bulkGet(item.characters),
    [item.characters],
  );
  const artifactSets = useLiveQuery(
    () => db.artifactSets.bulkGet(item.artifactSets),
    [item.artifactSets],
  );
  const domain = useLiveQuery(
    () => db.domainsOfBlessing.get(item.domain),
    [item.domain],
  );
  return (
    <div className="pt-1 pb-2 px-2 bg-accent rounded-lg">
      <div className="flex gap-1">
        {artifactSets?.map(
          (it) =>
            it && (
              <Tooltip key={it.id}>
                <TooltipTrigger asChild>
                  <CollectionAvatar
                    className="size-10 rounded-2xl"
                    record={it}
                    fileName={it.icon}
                    name={it.name}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1">
                    <span>{it.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {domain?.name}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            ),
        )}
      </div>
      <ul className="flex flex-wrap mt-1">
        {characters?.map(
          (it) =>
            it && (
              <li
                key={it.id}
                className="text-xs text-accent-foreground not-last:after:content-['•'] after:mx-1 after:text-muted-foreground"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{it.name}</span>
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-2">
                    <CollectionAvatar
                      className="size-16 rounded-xl"
                      record={it}
                      fileName={it.icon}
                      name={it.name}
                    />
                    <CharacterInfoContent character={it} />
                  </TooltipContent>
                </Tooltip>
              </li>
            ),
        )}
      </ul>
    </div>
  );
}
