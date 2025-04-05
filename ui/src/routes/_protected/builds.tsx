import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCorners,
  TouchSensor,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  createFileRoute,
  LinkOptions,
  linkOptions,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import fuzzysearch from 'fuzzysearch';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { db } from '@/api/dictionaries/db';
import { pbClient } from '@/api/pocketbase';
import { ArtifactTypePlans, CharacterPlans, Characters } from '@/api/types';
import { BuildDomainsAnalysis } from '@/components/build-card/build-domains-analysis';
import {
  BuildFilters,
  TBuildFilter,
} from '@/components/build-card/build-filters';
import { BuildInfo } from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';
import { PendingBuildInfo } from '@/components/build-card/pending-build-info';
import { Icons } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { handleReorder } from '@/lib/handle-reorder';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { queryClient } from '@/main';
import {
  newCharacterPlans as useNewCharacterPlans,
  PendingCharacter,
} from '@/stores/newCharacterPlans';

export type ShortBuildItem = Pick<CharacterPlans, 'id' | 'order' | 'character'>;

export type BuildsRenderItem =
  | { type: 'build'; build: ShortBuildItem; order: number }
  | { type: 'pending'; pending: PendingCharacter; order: number }
  | { type: 'create'; order: number };

const FIELDS = 'id, order, character';
const BUILDS_PAGE_QUERY_KEY = ['characterPlans', 'page'];
export const ARTIFACT_TYPE_PLANS_QUERY_KEY = [
  'characterPlans',
  'artifact_type_plans',
];

const PAGE_SIZE_OPTIONS = [30, 50, 80] as const;

const MAX_ITEMS = 130;
const MAX_PENDING_ITEMS = 10;

const SEARCH_SCHEMA = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
  // Characters
  cs: z.array(z.string()).optional(),
  // Character Name
  cN: z.string().optional(),
  // Character Elements
  cE: z.array(z.string()).optional(),
  // Character Weapon Types
  cWT: z.array(z.string()).optional(),
  // Character artifact types
  cAT: z.array(z.tuple([z.string(), z.array(z.string())])).optional(),
});

const BUILDS_PAGE_QUERY_PARAMS = queryOptions({
  queryKey: BUILDS_PAGE_QUERY_KEY,
  queryFn: () =>
    pbClient
      .collection<ShortBuildItem>('characterPlans')
      .getFullList({ fields: FIELDS, sort: 'order' }),
});

const ARTIFACT_TYPE_PLANS_QUERY_PARAMS = queryOptions({
  queryKey: ARTIFACT_TYPE_PLANS_QUERY_KEY,
  queryFn: () =>
    pbClient.collection<ArtifactTypePlans>('artifactTypePlans').getFullList(),
});

export const Route = createFileRoute('/_protected/builds')({
  component: HomeComponent,
  validateSearch: SEARCH_SCHEMA,
  loaderDeps: ({ search: { page = 1, perPage = PAGE_SIZE_OPTIONS[0] } }) => ({
    page,
    perPage,
  }),
  loader: () => queryClient.ensureQueryData(BUILDS_PAGE_QUERY_PARAMS),
  pendingComponent: () => (
    <div className="w-full p-4 flex justify-center">
      <Icons.Spinner className="animate-spin size-12" />
    </div>
  ),
});

export const indexRoute = Route;

const filterCharacters = (filters: TBuildFilter) => (character: Characters) =>
  (filters.elements.size === 0 ||
    (character.element && filters.elements.has(character.element))) &&
  (filters.weaponTypes.size === 0 ||
    filters.weaponTypes.has(character.weaponType)) &&
  (!filters.name ||
    fuzzysearch(filters.name.toLowerCase(), character.name.toLowerCase()));

const getRenderItems = (
  items: ShortBuildItem[],
  pendingPlans: PendingCharacter[],
  characters: Map<string, Characters> | undefined,
  filters: TBuildFilter,
) => {
  const filter = filterCharacters(filters);
  const buildItems: BuildsRenderItem[] = items
    .filter((build) => {
      const character = characters?.get(build.character);
      if (!character) {
        return false;
      }
      return filter(character);
    })
    .map((build) => ({
      type: 'build',
      build,
      order: build.order,
    }));
  const pendingItems: BuildsRenderItem[] = pendingPlans
    .filter((pending) => {
      const character = characters?.get(pending.characterId);
      if (!character) {
        return false;
      }
      return filter(character);
    })
    .map((pending) => ({
      type: 'pending',
      pending,
      order: pending.order,
    }));
  const all = buildItems.concat(pendingItems);
  all.sort((a, b) => a.order - b.order);
  if (
    items.length <= MAX_ITEMS - pendingPlans.length &&
    pendingPlans.length <= MAX_PENDING_ITEMS
  ) {
    all.push({ type: 'create', order: Infinity });
  }
  return all;
};

function generatePaginationLink(page: number, perPage?: number) {
  return linkOptions({
    to: Route.to,
    search: (prev) => ({
      ...prev,
      page,
      perPage: perPage ?? prev.perPage,
    }),
  });
}

function HomeComponent() {
  const deps = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data: queryData } = useSuspenseQuery(BUILDS_PAGE_QUERY_PARAMS);
  const { data: artifactTypePlans } = useSuspenseQuery(
    ARTIFACT_TYPE_PLANS_QUERY_PARAMS,
  );
  const pendingPlans = useNewCharacterPlans(
    (s) => s.characterPlans as PendingCharacter[],
  );
  const characters = useLiveQuery(
    () => db.characters.toArray().then((c) => new Map(c.map((c) => [c.id, c]))),
    [],
  );

  const {
    variables,
    mutate: reorderItems,
    isPending: reorderIsPending,
    reset,
  } = useMutation({
    mutationFn(items: ShortBuildItem[]) {
      const batch = pbClient.createBatch();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const originalItem = queryData[i];
        if (
          !originalItem ||
          originalItem.id !== it.id ||
          originalItem.order !== it.order
        ) {
          batch
            .collection('characterPlans')
            .update(it.id, { order: it.order }, { fields: FIELDS });
        }
      }
      return batch.send();
    },
    onSuccess: async (_, variables) => {
      await queryClient.setQueryData(BUILDS_PAGE_QUERY_KEY, variables);
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderItems(v);
    }),
  });

  const items = variables || queryData;
  const filters: TBuildFilter = useMemo(
    () => ({
      name: search.cN ?? '',
      elements: new Set(search.cE),
      weaponTypes: new Set(search.cWT),
      characters: new Set(search.cs),
      artifactTypeSpecials: new Map(
        search.cAT?.map(([at, specials]) => [at, new Set(specials)]),
      ),
    }),
    [search.cN, search.cE, search.cWT, search.cs, search.cAT],
  );

  const allItems: BuildsRenderItem[] = useMemo(
    () => getRenderItems(items, pendingPlans, characters, filters),
    [items, pendingPlans, characters, filters],
  );
  const availableFilters = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const character = characters?.get(item.character);
        if (character) {
          if (character.element) {
            acc.elements.add(character.element);
          }
          acc.weaponTypes.add(character.weaponType);
          acc.characters.add(character.id);
        }
        return acc;
      },
      {
        elements: new Set<string>(),
        weaponTypes: new Set<string>(),
        characters: new Set<string>(),
      },
    );
  }, [characters, items]);

  const filterEnabled =
    filters.name.length > 0 ||
    filters.elements.size > 0 ||
    filters.weaponTypes.size > 0 ||
    filters.artifactTypeSpecials.size > 0 ||
    filters.characters.size > 0;
  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / deps.perPage);

  const changeFilter = (newFilter: Partial<TBuildFilter>) => {
    navigate({
      to: Route.to,
      search: (state) => ({
        ...state,
        cN:
          typeof newFilter.name === 'string'
            ? newFilter.name.length > 0
              ? newFilter.name
              : undefined
            : state.cN,
        cE: newFilter.elements
          ? newFilter.elements.size > 0
            ? Array.from(newFilter.elements)
            : undefined
          : state.cE,
        cWT: newFilter.weaponTypes
          ? newFilter.weaponTypes.size > 0
            ? Array.from(newFilter.weaponTypes)
            : undefined
          : state.cWT,
        cs: newFilter.characters
          ? newFilter.characters.size > 0
            ? Array.from(newFilter.characters)
            : undefined
          : state.cs,
        cAT: newFilter.artifactTypeSpecials
          ? newFilter.artifactTypeSpecials.size > 0
            ? Array.from(newFilter.artifactTypeSpecials.entries()).map(
                ([k, v]) => [k, Array.from(v)] as const,
              )
            : undefined
          : state.cAT,
      }),
    });
  };

  useEffect(() => {
    if (deps.page > totalPages) {
      navigate(generatePaginationLink(totalPages));
    }
  }, [deps.page, totalPages]);

  return (
    <>
      <section
        aria-label="Builds with controls"
        className="flex flex-wrap gap-2"
      >
        <aside
          aria-label="Controls"
          className="p-2 basis-80 grow flex flex-col gap-4"
        >
          <BuildFilters
            name={filters.name}
            artifactTypePlansData={artifactTypePlans}
            elements={filters.elements}
            weaponTypes={filters.weaponTypes}
            characters={filters.characters}
            artifactTypeSpecials={filters.artifactTypeSpecials}
            availableElements={availableFilters.elements}
            availableWeaponTypes={availableFilters.weaponTypes}
            availableCharacters={availableFilters.characters}
            onChange={changeFilter}
            hasActiveFilters={filterEnabled}
          />
          <BuildDomainsAnalysis builds={items} />
        </aside>
        <section
          aria-label="Build cards"
          className="grow-9999 p-2 grid grid-cols-[repeat(auto-fill,_minmax(20rem,_1fr))] gap-4 justify-center items-start"
        >
          <Content
            buildItems={items}
            items={allItems}
            totalItems={totalItems}
            filterEnabled={filterEnabled}
            reorderIsPending={reorderIsPending}
            reorderItems={reorderItems}
          />
        </section>
      </section>
      <nav
        aria-label="Page navigation"
        className="mt-2 mb-6 flex flex-wrap-reverse justify-between items-start gap-3"
      >
        <PerPagePagination totalItems={totalItems} />
        <PagePagination totalPages={totalPages} />
      </nav>
      <Outlet />
    </>
  );
}

type ContentProps = {
  buildItems: ShortBuildItem[];
  items: BuildsRenderItem[];
  totalItems: number;
  filterEnabled: boolean;
  reorderIsPending: boolean;
  reorderItems(items: ShortBuildItem[]): void;
};
function Content({
  buildItems,
  items,
  totalItems,
  filterEnabled,
  reorderIsPending,
  reorderItems,
}: ContentProps) {
  const deps = Route.useLoaderDeps();
  const paginatedItems = items.slice(
    deps.perPage * (deps.page - 1),
    deps.perPage * deps.page,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function handleDragEnd(event: DragEndEvent) {
    handleReorder(event, buildItems, reorderItems);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={buildItems} strategy={rectSortingStrategy}>
        {paginatedItems.map((item) => {
          switch (item.type) {
            case 'build': {
              const { build } = item;
              return (
                <BuildInfo
                  key={build.id}
                  buildId={build.id}
                  characterId={build.character}
                  reorderIsPending={reorderIsPending}
                  dndEnabled={!filterEnabled}
                />
              );
            }
            case 'pending': {
              const { pending } = item;
              return <PendingBuildInfo key={pending.id} pending={pending} />;
            }
            case 'create':
              return (
                <Card
                  key="create"
                  className="w-full border-2 border-dashed border-muted bg-muted/5"
                >
                  <div className="w-full h-full flex items-center justify-center p-12">
                    <CreateBuild
                      size={totalItems - 1}
                      disabled={reorderIsPending}
                    />
                  </div>
                </Card>
              );
          }
        })}
      </SortableContext>
    </DndContext>
  );
}

function useLinkToDisplay(page: number, totalPages: number) {
  const items: [number, LinkOptions][] = [];
  const start = Math.max(2, page - 1);
  const end = Math.min(start + 3, totalPages);
  for (let i = start; i < end; i++) {
    items.push([i, generatePaginationLink(i)]);
  }
  return {
    items,
    leftDots: start > 2,
    rightDots: end < totalPages,
  };
}

type PagePaginationProps = { totalPages: number };
function PagePagination({ totalPages }: PagePaginationProps) {
  const { page: currentPage } = Route.useLoaderDeps();
  const pagesToDisplay = useLinkToDisplay(currentPage, totalPages);
  if (totalPages < 2) {
    return <div className="h-9" aria-hidden />;
  }
  return (
    <div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage > 1 && (
              <PaginationPrevious
                {...generatePaginationLink(currentPage - 1)}
              />
            )}
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              {...generatePaginationLink(1)}
              isActive={currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
          {pagesToDisplay.leftDots && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {pagesToDisplay.items.map(([page, link]) => (
            <PaginationItem key={page}>
              <PaginationLink {...link} isActive={currentPage === page}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pagesToDisplay.rightDots && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink
              {...generatePaginationLink(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            {currentPage < totalPages && (
              <PaginationNext {...generatePaginationLink(currentPage + 1)} />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

type PerPagePaginationProps = {
  totalItems: number;
};
function PerPagePagination({ totalItems }: PerPagePaginationProps) {
  const deps = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const perPageChange = (perPage: number) => {
    navigate(generatePaginationLink(1, perPage));
  };
  if (totalItems < PAGE_SIZE_OPTIONS[0] + 1) {
    return <div className="h-9" aria-hidden />;
  }
  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-muted-foreground whitespace-nowrap">
        Show:
      </Label>
      <Select
        value={String(deps.perPage)}
        onValueChange={(perPage) => perPageChange(Number(perPage))}
      >
        <SelectTrigger className="w-[4.5rem] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
