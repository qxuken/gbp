import { useId, useState } from 'react';

import { Icons } from '@/components/icons';
import { AutoTextarea } from '@/components/ui/auto-textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { note?: string; mutate?: (v: string) => void };
export function Note({ note, mutate }: Props) {
  if (note === undefined || !mutate) {
    return <NoteSkeleton />;
  }
  return <NoteLoaded note={note} mutate={mutate} />;
}

type PropsLoaded = Required<Props>;
function NoteLoaded({ note, mutate }: PropsLoaded) {
  const [collapsed, setCollapsed] = useState(note.length == 0);
  const id = useId();
  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100"
        onClick={() => setCollapsed(false)}
      >
        <Icons.Note /> Add note
      </Button>
    );
  }
  return (
    <div className="mt-1 w-full grid gap-2">
      <Label htmlFor={id + '_note'} className="text-muted-foreground">
        Notes
      </Label>
      <AutoTextarea
        id={id + '_note'}
        placeholder="Additional build notes"
        value={note}
        autoFocus={!collapsed && note.length === 0}
        onChange={(e) => mutate(e.target.value)}
      />
    </div>
  );
}

export function NoteSkeleton() {
  return (
    <div className="mt-1 w-full grid gap-2">
      <Skeleton className="h-5 w-24 rounded-md justify-self-center" />
    </div>
  );
}
