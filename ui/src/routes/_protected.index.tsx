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
import {
  BuildInfo,
  BuildInfoSkeleton,
} from '@/components/build-card/build-info';
import { CreateBuild } from '@/components/build-card/create-build';
import { PendingBuildInfo } from '@/components/build-card/pending-build-info';
import { Icons } from '@/components/icons';
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
  loaderDeps: ({ search: { page = 1, perPage = 30 } }) => ({
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
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((it) => it.id === active.id);
      const newIndex = items.findIndex((it) => it.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }
      reorderItems(
        arrayMove(items, oldIndex, newIndex).map((it, i) => ({
          ...it,
          order: queryData.perPage * (queryData.page - 1) + 1 + i,
        })),
      );
    }
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
      </div>
      <div className="mt-2 mb-6 flex flex-wrap-reverse justify-between items-start gap-3">
        <div className="flex flex-wrap-reverse items-start gap-3">
          <PerPagePagination />
          <PagePagination totalPages={queryData.totalPages} />
        </div>
        <div className="h-fit">
          <CreateBuild
            size={queryData.totalItems}
            disabled={reorderIsPending}
          />
        </div>
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
  const res = {
    items,
    leftDots: start > 2,
    rightDots: end < totalPages,
  };
  return res;
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

function PerPagePagination() {
  const { perPage } = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const pageChange = (perPage: number) => {
    const link = generatePaginationLink(1, perPage);
    navigate(link);
    queryClient.invalidateQueries({ queryKey: ['characterPlans', 'page'] });
  };

  return (
    <div>
      <Label>Per Page</Label>
      <Select
        value={String(perPage)}
        onValueChange={(perPage) => pageChange(Number(perPage))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Per Page" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="30">30</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="80">80</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
