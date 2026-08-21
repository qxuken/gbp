import { SelectTrigger } from '@radix-ui/react-select';
import { CSSProperties, useMemo } from 'react';

import {
  useArtifactSetsMap,
  useArtifactTypes,
  useElements,
  useSpecialsMap,
  useWeaponTypes,
} from '@/api/dictionaries/hooks';
import { Specials } from '@/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CollectionAvatar } from '@/components/ui/collection-avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { mapGetOrSetDefault } from '@/lib/map-get-or-set-default';
import { cn } from '@/lib/utils';
import {
  useAvailableFiltersSelector,
  useFiltersEnabled,
  useFiltersSelector,
  useSetFilters,
} from '@/store/plans/filters';

import PlanCompleted from './plan-completed';
import { ArtifactSetPicker } from './ui/artifact-set-picker';
import { ArtifactSetShort } from './ui/artifact-sets';

export default function PlanFilters() {
  return (
    <Collapsible defaultOpen asChild>
      <section
        aria-label="Filters"
        className="@container/filters grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
      >
        <FilterHeader />
        <CollapsibleContent className="grid items-start gap-x-6 gap-y-3.5 @[34rem]/filters:grid-cols-2 @[56rem]/filters:grid-cols-3">
          <FilterName />
          <PlanCompleted />
          <FilterGroup label="Element">
            <FilterElements />
          </FilterGroup>
          <FilterGroup label="Weapon">
            <FilterWeaponTypes />
          </FilterGroup>
          <FilterArtifactSets />
          <FilterGroup label="Main stats">
            <FilterArtifactTypes />
          </FilterGroup>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

/* Filter chips all share one shape; only the active fill differs. */
const CHIP =
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-30';

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterHeader() {
  const filtersEnabled = useFiltersEnabled();
  const setFilters = useSetFilters();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold tracking-tight">Filter</h3>
      <div className="flex items-center gap-2">
        {filtersEnabled && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-muted-foreground"
            onClick={() =>
              setFilters((filters) => {
                filters.name = '';
                filters.elements.clear();
                filters.weaponTypes.clear();
                filters.characters.clear();
                filters.artifactSets.clear();
                filters.specialsByArtifactTypePlans.clear();
              })
            }
          >
            Clear All
          </Button>
        )}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6">
            <Icons.Dropdown className="h-3 w-3" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
    </div>
  );
}

function FilterName() {
  const value = useFiltersSelector('name');
  const setFilters = useSetFilters();
  return (
    <Input
      id="name"
      type="text"
      placeholder="Search characters"
      className="h-8"
      value={value}
      onChange={(e) =>
        setFilters((filters) => {
          filters.name = e.target.value;
        })
      }
    />
  );
}

function FilterElements() {
  const elements = useElements();
  const filter = useFiltersSelector('elements');
  const available = useAvailableFiltersSelector('elements');
  const setFilters = useSetFilters();
  return (
    <div className="flex flex-wrap gap-1.5">
      {elements.map((element) => {
        const active = filter.has(element.id);
        return (
          <button
            key={element.id}
            type="button"
            style={{ '--element': element.color } as CSSProperties}
            className={cn(
              CHIP,
              'element-scope',
              active
                ? 'border-element/50 bg-element/20 text-element-fg'
                : 'border-border text-muted-foreground hover:border-element/40 hover:bg-element/10 hover:text-element-fg',
            )}
            disabled={!available.has(element.id)}
            aria-pressed={active}
            onClick={() => {
              setFilters((filters) => {
                const elements = filters.elements;
                if (elements.has(element.id)) {
                  elements.delete(element.id);
                } else {
                  elements.add(element.id);
                }
              });
            }}
          >
            <CollectionAvatar
              record={element}
              fileName={element.icon}
              name={element.name}
              className="size-3.5"
            />
            {element.name}
          </button>
        );
      })}
    </div>
  );
}

function FilterWeaponTypes() {
  const weaponTypes = useWeaponTypes();
  const value = useFiltersSelector('weaponTypes');
  const available = useAvailableFiltersSelector('weaponTypes');
  const setFilters = useSetFilters();
  return (
    <div className="flex flex-wrap gap-1.5">
      {weaponTypes.map((weaponType) => {
        const active = value.has(weaponType.id);
        return (
          <button
            key={weaponType.id}
            type="button"
            className={cn(
              CHIP,
              active
                ? 'border-foreground/25 bg-foreground/8 text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground',
            )}
            disabled={!available.has(weaponType.id)}
            aria-pressed={active}
            onClick={() => {
              setFilters((filters) => {
                const weaponTypes = filters.weaponTypes;
                if (weaponTypes.has(weaponType.id)) {
                  weaponTypes.delete(weaponType.id);
                } else {
                  weaponTypes.add(weaponType.id);
                }
              });
            }}
          >
            <CollectionAvatar
              record={weaponType}
              fileName={weaponType.icon}
              name={weaponType.name}
              className="size-3.5 not-dark:invert"
            />
            {weaponType.name}
          </button>
        );
      })}
    </div>
  );
}

function FilterArtifactSets() {
  const value = useFiltersSelector('artifactSets');
  const available = useAvailableFiltersSelector('artifactSets');
  const setFilters = useSetFilters();
  const artifactSets = useArtifactSetsMap();
  const ignored = useMemo(() => {
    const res = new Set(artifactSets.keys());
    for (const as of available) {
      if (value.has(as)) continue;
      res.delete(as);
    }
    return res;
  }, [available, value]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          Artifact sets
        </span>
        <ArtifactSetPicker
          title="New artifact set"
          onSelect={(as) =>
            setFilters((state) => void state.artifactSets.add(as))
          }
          ignoreArtifacts={ignored}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-5 rounded-md text-muted-foreground hover:bg-accent disabled:opacity-25"
            disabled={artifactSets.size - ignored.size == 0}
            aria-label="Filter by artifact set"
          >
            <Icons.Add className="size-3.5" />
          </Button>
        </ArtifactSetPicker>
        <div className="flex-1" />
      </div>
      <div className="grid w-full gap-2">
        {Array.from(value, (as) => (
          <ArtifactSetShort
            key={as}
            artifactSet={as}
            add={() => {}}
            ignoreArtifacts={ignored}
            skipConfirmation
            delete={() =>
              setFilters((state) => void state.artifactSets.delete(as))
            }
          />
        ))}
      </div>
    </div>
  );
}

function FilterArtifactTypes() {
  const artifactTypes = useArtifactTypes();
  const specialsMap = useSpecialsMap();
  const value = useFiltersSelector('specialsByArtifactTypePlans');
  const available = useAvailableFiltersSelector('specialsByArtifactTypePlans');
  const setFilters = useSetFilters();
  return (
    <div className="grid w-full gap-1.5">
      {artifactTypes.map((at) => {
        const selectedSpecials = value.get(at.id);
        const selectedArr = Array.from(selectedSpecials?.values() ?? []);
        const activeSpecials = available?.get(at.id);
        const options = Array.from(activeSpecials?.values() ?? [])
          .map((s) => specialsMap?.get(s))
          .filter((s) => s && !selectedSpecials?.has(s.id)) as Specials[];

        if (!activeSpecials || activeSpecials.size == 0) {
          return null;
        }
        const isEmpty = selectedArr.length === 0;
        return (
          <div
            key={at.id}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors',
              isEmpty
                ? 'border-dashed border-border/60'
                : 'border-border/70 bg-muted/35',
            )}
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <CollectionAvatar
                record={at}
                fileName={at.icon}
                name={at.name}
                className={cn('size-5', { 'opacity-40': isEmpty })}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                {at.name}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {selectedArr.map((s) => {
                const special = specialsMap?.get(s);
                if (!special) {
                  return null;
                }
                return (
                  <button
                    key={special.id}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-foreground/5 px-1.5 py-0.5 text-xs leading-tight font-medium transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${special.name}`}
                    onClick={() => {
                      setFilters((filters) => {
                        const artifactTypeSpecials =
                          filters.specialsByArtifactTypePlans;
                        const selected = artifactTypeSpecials.get(at.id);
                        if (!selected) return;
                        selected.delete(s);
                        if (selected.size === 0) {
                          artifactTypeSpecials.delete(at.id);
                        }
                      });
                    }}
                  >
                    {special.name}
                    <Icons.Remove className="size-3 opacity-60" />
                  </button>
                );
              })}
              {options.length > 0 && (
                <Select
                  onValueChange={(s) => {
                    setFilters((filters) => {
                      mapGetOrSetDefault(
                        filters.specialsByArtifactTypePlans,
                        at.id,
                        () => new Set<string>(),
                      ).add(s);
                    });
                  }}
                  value=""
                >
                  <SelectTrigger data-slot="select-trigger" asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
                      aria-label={`Filter by ${at.name} main stat`}
                    >
                      <Icons.Add className="size-3.5" />
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((special) => (
                      <SelectItem key={special.id} value={special.id}>
                        {special.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
