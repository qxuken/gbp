import {
  createFileRoute,
  LinkOptions,
  linkOptions,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { lazy, PropsWithChildren, useEffect, useState } from 'react';
import { z } from 'zod';

import { PLANS_QUERY } from '@/api/plans/plans';
import { queryClient } from '@/api/queryClient';
import PlanDomainsAnalysisSkeleton from '@/components/plan-card/plan-domains-analysis-skeleton';
import PlanFiltersSkeleton from '@/components/plan-card/plan-filters-skeleton';
import { PlanInfoSkeleton } from '@/components/plan-card/plan-info-skeleton';
import PlansModeSkeleton from '@/components/plan-card/plan-mode-skeleton';
import { Label } from '@/components/ui/label';
import {
  Pagination as UIPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsDesktopQuery } from '@/hooks/use-is-desktop-query';
import { cn } from '@/lib/utils';
import { FiltersProvider, PlansFilters } from '@/store/plans/filters';
import {
  MAX_ITEMS,
  RenderingItemsProvider,
  useRenderingPlanTotal,
} from '@/store/plans/rendering-items';
import {
  UiPlansMode,
  useUiPlansConfigModeValue,
} from '@/store/ui-plans-config';

const LazyPlanMode = lazy(() => import('@/components/plan-card/plan-mode'));
const LazyPlans = lazy(() => import('@/components/plans'));
const LazyPlanFilters = lazy(
  () => import('@/components/plan-card/plan-filters'),
);
const LazyPlanDomainsAnalysis = lazy(
  () => import('@/components/plan-card/plan-domains-analysis'),
);

const PAGE_SIZE_OPTIONS = [30, 50, 80, MAX_ITEMS] as const;

const SEARCH_SCHEMA = z.object({
  page: z.number().min(1).optional(),
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

export const Route = createFileRoute('/_protected/builds')({
  component: HomeComponent,
  validateSearch: SEARCH_SCHEMA,
  loaderDeps: ({ search: { page = 1, perPage = PAGE_SIZE_OPTIONS[0] } }) => ({
    page,
    perPage,
  }),
  loader: () => queryClient.ensureQueryData(PLANS_QUERY),
  pendingComponent: HomeLoader,
});

function HomeLoader() {
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
          <PlansModeSkeleton />
          <PlanFiltersSkeleton />
          <PlanDomainsAnalysisSkeleton />
        </aside>
        <section
          aria-label="Build cards"
          className="grow-9999 p-2 grid grid-cols-[repeat(auto-fill,_minmax(20rem,_1fr))] gap-4 justify-center items-start"
        >
          <PlanInfoSkeleton />
          <PlanInfoSkeleton />
        </section>
      </section>
      <Outlet />
    </>
  );
}

function generatePaginationLink(page: number, perPage?: number) {
  return linkOptions({
    to: Route.to,
    search: (prev) => ({
      ...prev,
      page: Math.max(page, 1),
      perPage: perPage ?? prev.perPage,
    }),
  });
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

function useSearchFilters() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [filters, setFilters] = useState<PlansFilters>(() => ({
    name: search.cN ?? '',
    elements: new Set(search.cE),
    weaponTypes: new Set(search.cWT),
    characters: new Set(search.cs),
    specialsByArtifactTypePlans: new Map(
      search.cAT?.map(([at, specials]) => [at, new Set(specials)]),
    ),
  }));

  useEffect(() => {
    const cN = filters.name;
    const cE = Array.from(filters.elements);
    const cWT = Array.from(filters.weaponTypes);
    const cS = Array.from(filters.characters);
    const cAt: [string, string[]][] = Array.from(
      filters.specialsByArtifactTypePlans.entries(),
      ([key, value]) => [key, Array.from(value)],
    );
    navigate({
      to: Route.to,
      resetScroll: false,
      search: (state) => ({
        ...state,
        cN: cN.length > 0 ? cN : undefined,
        cE: cE.length > 0 ? cE : undefined,
        cWT: cWT.length > 0 ? cWT : undefined,
        cs: cS.length > 0 ? cS : undefined,
        cAT: cAt.length > 0 ? cAt : undefined,
      }),
    });
  }, [filters]);
  return [filters, setFilters] as const;
}

function HomeComponent() {
  const deps = Route.useLoaderDeps();
  const [filters, setFilters] = useSearchFilters();
  const isDesktop = useIsDesktopQuery();
  const mode = useUiPlansConfigModeValue();
  return (
    <FiltersProvider value={filters} setValue={setFilters}>
      <RenderingItemsProvider page={deps.page} perPage={deps.perPage}>
        <RedirectOnBadPage>
          <section
            aria-label="Builds with controls"
            className="flex flex-wrap gap-2"
          >
            <div
              className={cn('min-h-fit p-2 basis-80 grow', {
                'sticky top-0 max-h-screen': isDesktop,
              })}
            >
              <ScrollArea>
                <aside
                  aria-label="Controls"
                  className={cn('h-fit flex flex-col gap-4', {
                    'max-h-screen': isDesktop,
                  })}
                >
                  <LazyPlanMode />
                  <LazyPlanFilters />
                  <LazyPlanDomainsAnalysis />
                </aside>
                <ScrollBar />
              </ScrollArea>
            </div>
            <section
              aria-label="Build cards"
              className={cn('grow-9999 p-2 grid justify-center items-start', {
                'grid-cols-[repeat(auto-fill,_minmax(24rem,_1fr))] gap-4':
                  mode == UiPlansMode.Full,
                'grid-cols-[repeat(auto-fill,_minmax(20rem,_1fr))] gap-2':
                  mode == UiPlansMode.Short,
              })}
            >
              <LazyPlans />
            </section>
          </section>
          <nav
            aria-label="Page navigation"
            className="mt-2 mb-6 flex flex-wrap-reverse justify-between items-start gap-3"
          >
            <PerPageSelect />
            <Pagination />
          </nav>
          <Outlet />
        </RedirectOnBadPage>
      </RenderingItemsProvider>
    </FiltersProvider>
  );
}

function RedirectOnBadPage({ children }: PropsWithChildren) {
  const deps = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const totalItems = useRenderingPlanTotal();
  const totalPages = Math.max(Math.ceil(totalItems / deps.perPage), 1);
  useEffect(() => {
    if (totalItems >= 0 && deps.page > totalPages) {
      navigate(generatePaginationLink(totalPages));
    }
  }, [deps.page, totalPages]);
  return children;
}

function Pagination() {
  const deps = Route.useLoaderDeps();
  const totalItems = useRenderingPlanTotal();
  const { page: currentPage } = Route.useLoaderDeps();
  const totalPages = Math.ceil(totalItems / deps.perPage);
  const pagesToDisplay = useLinkToDisplay(currentPage, totalPages);
  if (totalPages < 2) {
    return <div className="h-9" aria-hidden />;
  }
  return (
    <div>
      <UIPagination>
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
      </UIPagination>
    </div>
  );
}

function PerPageSelect() {
  const deps = Route.useLoaderDeps();
  const totalItems = useRenderingPlanTotal();
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
