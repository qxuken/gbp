import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { CloudDownload, EllipsisVertical } from 'lucide-react';
import Pocketbase, { LocalAuthStore, RecordModel } from 'pocketbase';
import { ChangeEvent, useRef } from 'react';
import { toast } from 'sonner';

import { reloadDictionaries } from '@/api/dictionaries/loader';
import { queryClient } from '@/api/queryClient';
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

const authStore = new LocalAuthStore('__pb_superuser_auth__');
const pbClient = new Pocketbase(import.meta.env.VITE_POCKETBASE_URL, authStore);

interface Dump extends RecordModel {
  hash: string;
  dump: string;
  notes: string;
}

const dumpsQuery = queryOptions({
  queryKey: ['dumps'],
  async queryFn() {
    return pbClient.collection<Dump>('_dbDumps').getFullList();
  },
});

function useDumpGenerateMutations() {
  const mutation = useMutation({
    mutationKey: ['dumps', 'dump'],
    mutationFn(notes: string = '') {
      return pbClient.send<{ status: string }>('/api/dump/generate', {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: dumpsQuery.queryKey });
      toast.success('Dump created');
    },
    onError: notifyWithRetry((v) => mutation.mutateAsync(v)),
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
      queryClient.invalidateQueries({ queryKey: dumpsQuery.queryKey });
      reloadDictionaries();
      toast.success('Restored');
    },
    onError: notifyWithRetry((v) => mutation.mutateAsync(v)),
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
      queryClient.invalidateQueries({ queryKey: dumpsQuery.queryKey });
      reloadDictionaries();
      toast.success('Restored');
    },
    onError: notifyWithRetry((v) => mutation.mutateAsync(v)),
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
        <Button variant="secondary" onClick={() => dumpGenerate.mutateAsync()}>
          Dump current
        </Button>
        <div className="border rounded-md p-2 flex gap-2">
          <Label
            className="data-[error=true]:text-destructive"
            htmlFor="upload-dump"
          >
            Upload dump
          </Label>
          <Input
            ref={uploadDumpRef}
            id="upload-dump"
            type="file"
            placeholder="Upload dump"
            value={undefined}
            onChange={(e) => onDumpUpload(e)}
          />
        </div>
      </header>
      <main>
        <Table>
          <TableCaption>A list of dumps.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-140">Hash</TableHead>
              <TableHead className="w-70">File</TableHead>
              <TableHead>Hotes</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.hash}</TableCell>
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
