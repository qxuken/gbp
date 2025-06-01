import {
  queryOptions,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { CloudDownload, CircleSmall, EllipsisVertical } from 'lucide-react';
import Pocketbase, { LocalAuthStore, RecordModel } from 'pocketbase';
import { ChangeEvent, useRef } from 'react';
import { toast } from 'sonner';

import { reloadDictionaries } from '@/api/dictionaries/loader';
import { queryClient } from '@/api/queryClient';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notifyWithRetry } from '@/lib/notify-with-retry';
import { cn } from '@/lib/utils';

const authStore = new LocalAuthStore('__pb_superuser_auth__');
const pbClient = new Pocketbase(import.meta.env.VITE_POCKETBASE_URL, authStore);

interface Dump extends RecordModel {
  hash: string;
  dump: string;
  notes: string;
}

const ROOT_QUERY_KEY = 'dumps';

const dumpsQuery = queryOptions({
  queryKey: [ROOT_QUERY_KEY],
  queryFn: () =>
    pbClient.collection<Dump>('_dbDumps').getFullList({ sort: '-created' }),
});

const dictionaryVersionQuery = queryOptions({
  queryKey: [ROOT_QUERY_KEY, 'dictionaryVersion'],
  queryFn: () => pbClient.send<string>('/api/dictionaryVersion', {}),
});

function useDumpGenerateMutations() {
  const mutation = useMutation({
    mutationKey: [ROOT_QUERY_KEY, 'dump'],
    mutationFn(notes: string | undefined = '') {
      return pbClient.send<{ status: string }>('/api/dump/generate', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [ROOT_QUERY_KEY] });
      toast.success('Dump created');
    },
    onError(err, v) {
      notifyWithRetry((v?: string) => mutation.mutate(v))(err, v);
    },
  });
  return mutation;
}

function useDumpRestoreMutations() {
  const mutation = useMutation({
    mutationKey: ['dumps', 'restore'],
    mutationFn(dumpId: string) {
      return pbClient.send<{ status: string }>(`/api/dump/restore/${dumpId}`, {
        method: 'POST',
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [ROOT_QUERY_KEY] });
      reloadDictionaries();
      toast.success('Restored');
    },
    onError(err, v) {
      notifyWithRetry((v: string) => mutation.mutate(v))(err, v);
    },
  });
  return mutation;
}

function useDumpUploadDbMutations() {
  const mutation = useMutation({
    mutationKey: ['dumps', 'upload'],
    mutationFn(body: FormData) {
      return pbClient.send<{ status: string }>(`/api/dump/upload`, {
        method: 'POST',
        body,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [ROOT_QUERY_KEY] });
      reloadDictionaries();
      toast.success('Restored');
    },
    onError(err, v) {
      notifyWithRetry((v: FormData) => mutation.mutate(v))(err, v);
    },
  });
  return mutation;
}

export const Route = createFileRoute('/_admin/dump')({
  beforeLoad: () => {
    if (!authStore.isValid) {
      throw redirect({ to: import.meta.env.VITE_POCKETBASE_URL + '/_/' });
    }
  },
  component: RouteComponent,
  loader: () => queryClient.ensureQueryData(dumpsQuery),
});

function RouteComponent() {
  const uploadDumpRef = useRef<HTMLInputElement | null>(null);
  const data = useSuspenseQuery(dumpsQuery);
  const dumpGenerate = useDumpGenerateMutations();
  const dumpRestore = useDumpRestoreMutations();
  const dumpUpload = useDumpUploadDbMutations();
  const dictionaryVersion = useQuery(dictionaryVersionQuery);

  const onDumpUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const data = new FormData();
    if (e.target.files?.[0]) {
      data.append('dump', e.target.files?.[0]);
      dumpUpload
        .mutateAsync(data)
        .finally(() => (uploadDumpRef.current!.value = ''));
    }
  };

  return (
    <div className="grid gap-4 p-4">
      <header className="flex gap-2 items-center">
        <Button
          variant="secondary"
          onClick={() => dumpGenerate.mutateAsync('')}
          disabled={dumpGenerate.isPending}
        >
          {dumpGenerate.isPending && <Icons.Spinner className="animate-spin" />}
          Dump current
        </Button>
        <div className="border rounded-md p-2 flex gap-2">
          <Label
            className="data-[error=true]:text-destructive flex gap-1 items-center"
            htmlFor="upload-dump"
          >
            {dumpUpload.isPending && <Icons.Spinner className="animate-spin" />}
            Upload dump
          </Label>
          <Input
            ref={uploadDumpRef}
            id="upload-dump"
            type="file"
            placeholder="Upload dump"
            className="hidden"
            value={undefined}
            disabled={dumpUpload.isPending}
            onChange={(e) => onDumpUpload(e)}
          />
        </div>
      </header>
      <main>
        <Table>
          <TableCaption>A list of dumps.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-144">Hash</TableHead>
              <TableHead className="w-70">File</TableHead>
              <TableHead>Hotes</TableHead>
              <TableHead className="w-60">Created At</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((it) => (
              <TableRow key={it.id}>
                <TableCell
                  className={cn('font-medium flex gap-1 text-center', {
                    'text-accent-foreground': it.hash == dictionaryVersion.data,
                    'text-muted-foreground': it.hash != dictionaryVersion.data,
                  })}
                >
                  {it.hash == dictionaryVersion.data && (
                    <CircleSmall className="size-5" />
                  )}
                  {it.hash}
                </TableCell>
                <TableCell>
                  <a
                    href={pbClient.files.getURL(it, it.dump)}
                    className="flex gap-1 items-center"
                  >
                    <CloudDownload />
                    {it.dump}
                  </a>
                </TableCell>
                <TableCell dangerouslySetInnerHTML={{ __html: it.notes }} />
                <TableCell>{it.created}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => dumpRestore.mutateAsync(it.id)}
                      >
                        Restore
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
