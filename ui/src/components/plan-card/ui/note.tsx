import { useId, useState } from 'react';

import { Icons } from '@/components/icons';
import { AutoTextarea } from '@/components/ui/auto-textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Props = { note: string; mutate: (v: string) => void };
export function Note(props: Props) {
  const [collapsed, setCollapsed] = useState(() => props.note.length == 0);
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
  return <NoteField {...props} />;
}

function NoteField({ note, mutate }: Props) {
  const id = useId();
  return (
    <div className="mt-1 w-full grid gap-2">
      <Label htmlFor={id + '_note'} className="text-muted-foreground">
        Notes
      </Label>
      <AutoTextarea
        id={id + '_note'}
        placeholder="Additional build notes"
        value={note}
        autoFocus={note.length === 0}
        onChange={(e) => mutate(e.target.value)}
      />
    </div>
  );
}
