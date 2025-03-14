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
  arrayMove,
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
import { useEffect } from 'react';
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
import { queryClient } from '@/main';
import { useNewCharacterPlans } from '@/stores/newCharacterPlans';

type Item = Pick<CharacterPlans, 'id' | 'order' | 'character'>;
const FIELDS = 'id, order, character';

const PAGE_SIZE_OPTIONS = [5, 30, 50, 80] as const;

const SEARCH_SCHEMA = z.object({
  page: z.number().optional(),
  perPage: z.number().optional(),
});

type Deps = z.infer<typeof SEARCH_SCHEMA> & { queryKey: string[] };

const queryParams = ({ page, perPage, queryKey }: Deps) =>
  queryOptions({
    queryKey,
    queryFn: () =>
      pbClient
        .collection<Item>('characterPlans')
        .getList(page, perPage, { fields: FIELDS, sort: 'order' }),
  });

export const Route = createFileRoute('/_protected/')({
  component: HomeComponent,
  validateSearch: SEARCH_SCHEMA,
  loaderDeps: ({ search: { page = 1, perPage = PAGE_SIZE_OPTIONS[0] } }) => ({
    page,
    perPage,
    queryKey: ['characterPlans', 'page', `${page}:${perPage}`],
  }),
  loader: ({ deps }) => {
    return queryClient.ensureQueryData(queryParams(deps));
  },
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
  const generateLink = (page: number) => generatePaginationLink(page, perPage);
  return generateLink;
}

function HomeComponent() {
  const deps = Route.useLoaderDeps();
  const search = Route.useSearch();
  const query = queryParams(deps);
  const navigate = Route.useNavigate();
  const { data: queryData } = useSuspenseQuery(query);
  const { characterPlans } = useNewCharacterPlans();
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
      for (const it of items) {
        batch
          .collection('characterPlans')
          .update(it.id, { order: it.order }, { fields: FIELDS });
      }
      return batch.send();
    },
    onSuccess: async (data) => {
      const items = data.map((it) => it.body);
      await queryClient.setQueryData(deps.queryKey, { ...queryData, items });
      reset();
    },
    onError: notifyWithRetry((v) => {
      reorderItems(v);
    }),
  });

  const items = variables || queryData.items;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      console.error('Invalid drag indices:', {
        oldIndex,
        newIndex,
        active,
        over,
      });
      return;
    }

    reorderItems(
      arrayMove(items, oldIndex, newIndex).map((it, i) => ({
        ...it,
        order: queryData.perPage * (queryData.page - 1) + 1 + i,
      })),
    );
  }

  useEffect(() => {
    if (queryData.items.length === 0 && deps.page > 1) {
      navigate(generateLink(queryData.totalPages));
    }
  }, [queryData.items]);

  return (
    <div className="pb-8">
      <div className="p-2 grid grid-cols-[repeat(auto-fill,_minmax(24rem,_1fr))] gap-4 justify-center items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            {items.map((build) => (
              <BuildInfo
                key={build.id}
                buildId={build.id}
                characterId={build.character}
                reorderIsPending={reorderIsPending}
              />
            ))}
          </SortableContext>
        </DndContext>
        {characterPlans.slice(0, deps.perPage - items.length).map((pending) => (
          <PendingBuildInfo
            key={pending.id}
            characterId={pending.characterId}
          />
        ))}
        <Card className="w-full border-2 border-dashed border-muted bg-muted/5">
          <div className="w-full h-full flex items-center justify-center p-12">
            <CreateBuild
              size={queryData.totalItems}
              disabled={reorderIsPending}
            />
          </div>
        </Card>
      </div>
      <div className="mt-2 mb-6 flex flex-wrap-reverse justify-between items-start gap-3">
        <PerPagePagination />
        <PagePagination totalPages={queryData.totalPages} />
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
    return null;
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

function PerPagePagination() {
  const deps = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const { data: queryData } = useSuspenseQuery(queryParams(deps));

  const pageChange = (perPage: number) => {
    const link = generatePaginationLink(1, perPage);
    navigate(link);
    queryClient.invalidateQueries({ queryKey: ['characterPlans', 'page'] });
  };

  if (queryData.totalItems < PAGE_SIZE_OPTIONS[0] + 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-muted-foreground whitespace-nowrap">
        Show:
      </Label>
      <Select
        value={String(deps.perPage)}
        onValueChange={(perPage) => pageChange(Number(perPage))}
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
