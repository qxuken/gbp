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
        className="opacity-50 transition-opacity focus:opacity-100 hover:opacity-100"
        onClick={() => setCollapsed(false)}
        disabled={props.disabled}
      >
        <Icons.Note /> Add note
      </Button>
    );
  }
  return <NoteField {...props} />;
}

function NoteField(props: Props) {
  return (
    <div className="mt-1 w-full">
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
