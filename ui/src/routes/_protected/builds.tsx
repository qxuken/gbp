import {
  createFileRoute,
  LinkOptions,
  linkOptions,
} from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';
import { lazy, useEffect } from 'react';
import { z } from 'zod';

import { PLANS_QUERY_PARAMS } from '@/api/plans/plans';
import { BuildDomainsAnalysis } from '@/components/build-card/build-domains-analysis';
import { BuildFilters } from '@/components/build-card/build-filters';
import { Builds } from '@/components/builds';
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
import { queryClient } from '@/main';
import { useFilters } from '@/store/plans/filters';
import { useRenderingPlanItems } from '@/store/plans/renderingItems';

const LazyBuilds = lazy(() => import('@/components/builds'));

const PAGE_SIZE_OPTIONS = [30, 50, 80] as const;

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

export const Route = createFileRoute('/_protected/builds')({
  component: HomeComponent,
  validateSearch: SEARCH_SCHEMA,
  loaderDeps: ({ search: { page = 1, perPage = PAGE_SIZE_OPTIONS[0] } }) => ({
    page,
    perPage,
  }),
  loader: () => queryClient.ensureQueryData(PLANS_QUERY_PARAMS),
  pendingComponent: () => (
    <div className="w-full p-4 flex justify-center">
      <Icons.Spinner className="animate-spin size-12" />
    </div>
  ),
});

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
  const renderingItems = useRenderingPlanItems();
  const [filters, setFilters] = useFilters();

  useEffect(() => {
    setFilters({
      name: search.cN ?? '',
      elements: new Set(search.cE),
      weaponTypes: new Set(search.cWT),
      characters: new Set(search.cs),
      artifactTypeSpecials: new Map(
        search.cAT?.map(([at, specials]) => [at, new Set(specials)]),
      ),
    });
  }, []);

  useEffect(() => {
    const cN = filters.name;
    const cE = Array.from(filters.elements);
    const cWT = Array.from(filters.weaponTypes);
    const cS = Array.from(filters.characters);
    const cAt: [string, string[]][] = Array.from(
      filters.artifactTypeSpecials.entries(),
      ([key, value]) => [key, Array.from(value)],
    );
    navigate({
      to: Route.to,
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

  const totalItems = renderingItems.length;
  const totalPages = Math.ceil(totalItems / deps.perPage);

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
          <BuildFilters />
          <BuildDomainsAnalysis />
        </aside>
        <section
          aria-label="Build cards"
          className="grow-9999 p-2 grid grid-cols-[repeat(auto-fill,_minmax(20rem,_1fr))] gap-4 justify-center items-start"
        >
          <LazyBuilds page={deps.page} perPage={deps.perPage} />
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
