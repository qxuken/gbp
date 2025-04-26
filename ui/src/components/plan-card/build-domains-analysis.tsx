import {
  useArtifactSet,
  useCharactersItem,
  useDomainOfBlessing,
} from '@/api/dictionaries/atoms';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { CharacterInfoContent } from './ui/character-info';

export default function BuildDomainsAnalysis() {
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
          <BuildDomainsAnalysisContent />
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
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

function BuildDomainsAnalysisContent() {
  const isLoading = usePlansIsLoading();
  const items = useDomainsByArtifactSets();

  if (isLoading) {
    return <BuildDomainsAnalysisSkeleton />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <BuildDomainsAnalysisItem key={it.domain} item={it} />
      ))}
    </div>
  );
}

type BuildDomainsAnalysisItemProps = {
  item: DomainsByArtifactSets;
};
function BuildDomainsAnalysisItem({ item }: BuildDomainsAnalysisItemProps) {
  const domain = useDomainOfBlessing(item.domain)!;
  return (
    <div className="pt-1 pb-2 px-2 bg-accent rounded-lg">
      <div className="flex gap-1">
        {item.artifactSets.map((it) => (
          <BuildDomainsAnalysisItemArtifactSets
            key={it}
            domain={domain}
            item={it}
          />
        ))}
      </div>
      <ul className="flex flex-wrap mt-1">
        {item.characters.map((it) => (
          <BuildDomainsAnalysisItemCharacter key={it} item={it} />
        ))}
      </ul>
    </div>
  );
}

type BuildDomainsAnalysisItemArtifactSetsProps = {
  item: string;
  domain: DomainsOfBlessing;
};
function BuildDomainsAnalysisItemArtifactSets({
  item,
  domain,
}: BuildDomainsAnalysisItemArtifactSetsProps) {
  const artifactSet = useArtifactSet(item);
  if (!artifactSet) return null;
  return (
    <Tooltip key={artifactSet.id}>
      <TooltipTrigger asChild>
        <CollectionAvatar
          className="size-10 rounded-2xl"
          record={artifactSet}
          fileName={artifactSet.icon}
          name={artifactSet.name}
        />
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

type BuildDomainsAnalysisItemCharacterProps = {
  item: string;
};
function BuildDomainsAnalysisItemCharacter({
  item,
}: BuildDomainsAnalysisItemCharacterProps) {
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
        <TooltipContent className="flex items-center gap-2">
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
