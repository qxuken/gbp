import { useState } from 'react';

import { Icons } from '@/components/icons';
import { AutoTextarea } from '@/components/ui/auto-textarea';
import { Button } from '@/components/ui/button';

type Props = { note: string; mutate: (v: string) => void; disabled?: boolean };
export function Note(props: Props) {
  const [collapsed, setCollapsed] = useState(() => props.note.length == 0);
  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-fit gap-1.5 px-2 text-xs text-muted-foreground hover:bg-element/10 hover:text-element-fg"
        onClick={() => setCollapsed(false)}
        disabled={props.disabled}
      >
        <Icons.Note className="size-3.5" /> Add note
      </Button>
    );
  }
  return <NoteField {...props} />;
}

function NoteField(props: Props) {
  return (
    <div className="w-full">
      <AutoTextarea
        aria-label="Notes"
        placeholder="Additional build notes"
        value={props.note}
        autoFocus={props.note.length === 0}
        onChange={(e) => props.mutate(e.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
}
