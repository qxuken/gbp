import { Toaster as Sonner } from 'sonner';

import { theme as useTheme } from '@/stores/theme';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const displayTheme = useTheme((s) => s.displayTheme);

  return (
    <Sonner
      theme={displayTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          description: 'group-[.toast]:text-muted-foreground',
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
