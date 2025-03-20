import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCorners,
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
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { pbClient } from '@/api/pocketbase';
import { CharacterPlans } from '@/api/types';
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
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { handleReorder } from '@/lib/utils';
import { queryClient } from '@/main';
import {
  newCharacterPlans as useNewCharacterPlans,
  PendingCharacter,
} from '@/stores/newCharacterPlans';

type Item = Pick<CharacterPlans, 'id' | 'order' | 'character'>;

type RenderItem =
  | { type: 'build'; build: Item; order: number }
  | { type: 'pending'; pending: PendingCharacter; order: number }
  | { type: 'create'; order: number };

const FIELDS = 'id, order, character';
const QUERY_KEY = ['characterPlans', 'page'];

const PAGE_SIZE_OPTIONS = [30, 50, 80] as const;

const SEARCH_SCHEMA = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
});

const QUERY_PARAMS = queryOptions({
  queryKey: QUERY_KEY,
  queryFn: () =>
    pbClient
      .collection<Item>('characterPlans')
      .getFullList({ fields: FIELDS, sort: 'order' }),
});

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
  validateSearch: SEARCH_SCHEMA,
  loaderDeps: ({ search: { page = 1, perPage = PAGE_SIZE_OPTIONS[0] } }) => ({
    page,
    perPage,
  }),
  loader: () => queryClient.ensureQueryData(QUERY_PARAMS),
  pendingComponent: () => (
    <div className="w-full p-4 flex justify-center">
      <Icons.Spinner className="animate-spin size-12" />
    </div>
  ),
});

function generatePaginationLink(page: number, perPage?: number) {
  return linkOptions({
    to: Route.to,
    search: {
      page,
      perPage,
    },
  });
}

function usePageLink(perPage?: number) {
  return function (page: number) {
    return generatePaginationLink(page, perPage);
  };
}

function HomeComponent() {
  const deps = Route.useLoaderDeps();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: queryData } = useSuspenseQuery(QUERY_PARAMS);
  const pendingPlans = useNewCharacterPlans(
    (s) => s.characterPlans as PendingCharacter[],
  );
  const generateLink = usePageLink(search.perPage);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    variables,
    mutate: reorderItems,
    isPending: reorderIsPending,
    reset,
  } = useMutation({
    mutationFn(items: Item[]) {
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
      await queryClient.setQueryData(QUERY_KEY, variables);
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderItems(v);
    }),
  });

  const items = variables || queryData;

  const allItems: RenderItem[] = useMemo(() => {
    const buildItems: RenderItem[] = items.map((build) => ({
      type: 'build',
      build,
      order: build.order,
    }));
    const pendingItems: RenderItem[] = pendingPlans.map((pending) => ({
      type: 'pending',
      pending,
      order: pending.order,
    }));
    const all = buildItems
      .concat(pendingItems)
      .concat([{ type: 'create', order: Infinity }]);
    all.sort((a, b) => a.order - b.order);
    return all;
  }, [items, pendingPlans]);
  const renderItems = allItems.slice(
    deps.perPage * (deps.page - 1),
    deps.perPage * deps.page,
  );

  const totalItems = queryData.length + pendingPlans.length + 1;
  const totalPages = Math.ceil(totalItems / deps.perPage);

  function handleDragEnd(event: DragEndEvent) {
    handleReorder(event, items, reorderItems);
  }

  useEffect(() => {
    if (deps.page > totalPages) {
      navigate(generateLink(totalPages));
    }
  }, [deps.page, totalPages]);

  return (
    <div className="pb-8">
      <div className="p-2 grid grid-cols-[repeat(auto-fill,_minmax(24rem,_1fr))] gap-4 justify-center items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            {renderItems.map((item) => {
              switch (item.type) {
                case 'build': {
                  const { build } = item;
                  return (
                    <BuildInfo
                      key={build.id}
                      buildId={build.id}
                      characterId={build.character}
                      reorderIsPending={reorderIsPending}
                    />
                  );
                }
                case 'pending': {
                  const { pending } = item;
                  return (
                    <PendingBuildInfo key={pending.id} pending={pending} />
                  );
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
      </div>
      <div className="mt-2 mb-6 flex flex-wrap-reverse justify-between items-start gap-3">
        <PerPagePagination totalItems={totalItems} />
        <PagePagination totalPages={totalPages} />
      </div>
    </div>
  );
}

function useLinkToDisplay(page: number, totalPages: number, perPage?: number) {
  const generateLink = usePageLink(perPage);

  const items: [number, LinkOptions][] = [];
  const start = Math.max(2, page - 1);
  const end = Math.min(start + 3, totalPages);

  for (let i = start; i < end; i++) {
    items.push([i, generateLink(i)]);
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
  const { perPage } = Route.useSearch();
  const generateLink = usePageLink(perPage);

  const pagesToDisplay = useLinkToDisplay(currentPage, totalPages, perPage);

  if (totalPages < 2) {
    return <div />;
  }

  return (
    <div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage > 1 && (
              <PaginationPrevious {...generateLink(currentPage - 1)} />
            )}
          </PaginationItem>
          <PaginationItem>
            <PaginationLink {...generateLink(1)} isActive={currentPage === 1}>
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
              {...generateLink(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            {currentPage < totalPages && (
              <PaginationNext {...generateLink(currentPage + 1)} />
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
    return <div />;
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
