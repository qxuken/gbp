import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { Textarea } from './textarea';

type Props = Omit<React.ComponentProps<'textarea'>, 'value'> &
  Required<Pick<React.ComponentProps<'textarea'>, 'value'>>;
function AutoTextarea({ className, ...props }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [props.value]);

  return (
    <Textarea
      ref={textareaRef}
      rows={1}
      className={cn('h-auto resize-none', className)}
      {...props}
    />
  );
}

export { AutoTextarea };
