import {
  useArtifactSetsItem,
  useCharactersItem,
  useDomainsOfBlessingItem,
} from '@/api/dictionaries/hooks';
import {
  DomainsByArtifactSets,
  useDomainsByArtifactSets,
} from '@/api/plans/domains-of-blessing';
import { usePlansIsLoading } from '@/api/plans/plans';
import { DomainsOfBlessing } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFiltersSelector, useSetFilters } from '@/store/plans/filters';

import { BuildDomainsAnalysisContentSkeleton } from './plan-domains-analysis-skeleton';
import { CharacterInfoContent } from './ui/character-info';

export default function PlanDomainsAnalysis() {
  return (
    <Collapsible defaultOpen asChild>
      <section
        aria-label="Farm tips"
        className="grid min-w-0 gap-2 rounded-xl border border-border bg-card p-3 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-tight">Farm tips</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6">
              <Icons.Dropdown className="h-3 w-3" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="grid gap-2">
          <PlanDomainsAnalysisContent />
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function PlanDomainsAnalysisContent() {
  const isLoading = usePlansIsLoading();
  const isComplete = useFiltersSelector('complete');
  const items = useDomainsByArtifactSets(isComplete);

  if (isLoading) {
    return <BuildDomainsAnalysisContentSkeleton />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <PlanDomainsAnalysisItem key={it.domain} item={it} />
      ))}
    </div>
  );
}

function PlanDomainsAnalysisItem({ item }: { item: DomainsByArtifactSets }) {
  const domain = useDomainsOfBlessingItem(item.domain);
  if (!domain) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 px-2 pt-1 pb-2 transition-colors hover:bg-muted/70">
      <div className="flex gap-1">
        {item.artifactSets.map((it) => (
          <PlanDomainsAnalysisItemArtifactSets
            key={it}
            domain={domain}
            item={it}
          />
        ))}
      </div>
      <ul className="flex flex-wrap mt-1">
        {item.characters.map((it) => (
          <PlanDomainsAnalysisItemCharacter key={it} item={it} />
        ))}
      </ul>
    </div>
  );
}

function PlanDomainsAnalysisItemArtifactSets({
  item,
  domain,
}: {
  item: string;
  domain: DomainsOfBlessing;
}) {
  const artifactSet = useArtifactSetsItem(item);
  const setFilters = useSetFilters();
  if (!artifactSet) return null;
  return (
    <Tooltip key={artifactSet.id}>
      <TooltipTrigger asChild>
        <div
          className="cursor-pointer"
          onClick={() =>
            setFilters((state) =>
              state.artifactSets.has(artifactSet.id)
                ? state.artifactSets.delete(artifactSet.id)
                : state.artifactSets.add(artifactSet.id),
            )
          }
        >
          <CollectionAvatar
            className="size-10 rounded-2xl"
            record={artifactSet}
            fileName={artifactSet.icon}
            name={artifactSet.name}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          <span>{artifactSet.name}</span>
          <span className="text-xs text-muted-foreground">{domain.name}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function PlanDomainsAnalysisItemCharacter({ item }: { item: string }) {
  const character = useCharactersItem(item);
  if (!character) return null;
  return (
    <li
      key={character.id}
      className="text-xs text-accent-foreground not-last:after:content-['•'] after:mx-1 after:text-muted-foreground"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{character.name}</span>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-3 p-3">
          <CollectionAvatar
            className="size-16 rounded-xl"
            record={character}
            fileName={character.icon}
            name={character.name}
          />
          <CharacterInfoContent character={character} />
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
