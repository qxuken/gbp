import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useAuth } from '@/stores/auth';

const emailFormSchema = z.object({
  email: z.string().email(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

function EmailEditForm({ onSuccess }: { onSuccess(): void }) {
  const auth = useAuth();
  const user = auth.record;
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  if (!user) return null;

  async function onSubmit(data: EmailFormValues) {
    try {
      await auth.updateEmail(data.email);
      toast.success('Email verification sent. Please check your inbox.');
      onSuccess();
    } catch {
      toast.error('Failed to update email');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          disabled={form.formState.isSubmitting}
          className="w-full md:w-fit"
          type="submit"
        >
          {form.formState.isSubmitting && (
            <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Send Verification
        </Button>
      </form>
    </Form>
  );
}

interface EmailEditDialogProps {
  children?: React.ReactNode;
  onSuccess?(open: boolean): void;
}

export function EmailEditDialog({ children, onSuccess }: EmailEditDialogProps) {
  return (
    <ResponsiveDialog
      trigger={
        children ?? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Icons.Email className="mr-2 h-4 w-4" />
            <span>Change Email</span>
          </DropdownMenuItem>
        )
      }
      title="Change Email"
      description="Enter your new email address. A verification link will be sent to confirm the change."
      contentClassName="pb-6"
    >
      <EmailEditForm onSuccess={() => onSuccess?.(false)} />
    </ResponsiveDialog>
  );
}
