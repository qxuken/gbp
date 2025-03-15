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

const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(8),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

function PasswordEditForm({ onSuccess }: { onSuccess(): void }) {
  const auth = useAuth();
  const user = auth.record;
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  if (!user) return null;

  async function onSubmit(data: PasswordFormValues) {
    try {
      await auth.updatePassword(
        data.oldPassword,
        data.password,
        data.passwordConfirm,
      );
      toast.success('Password updated successfully');
      form.reset();
      onSuccess();
    } catch {
      toast.error('Failed to update password');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
          Update Password
        </Button>
      </form>
    </Form>
  );
}

interface PasswordEditDialogProps {
  children?: React.ReactNode;
  onSuccess?(): void;
}

export function PasswordEditDialog({
  children,
  onSuccess,
}: PasswordEditDialogProps) {
  return (
    <ResponsiveDialog
      trigger={
        children ?? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Icons.Password className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
        )
      }
      title="Change Password"
      description="Update your password"
      contentClassName="pb-6"
    >
      <PasswordEditForm onSuccess={() => onSuccess?.()} />
    </ResponsiveDialog>
  );
}
