import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
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
import { useUpdatePassword } from '@/store/auth';

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

export const Route = createFileRoute('/_protected/builds/user/password')({
  component: PasswordEditRoute,
});

function PasswordEditRoute() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const updatePassword = useUpdatePassword();
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onClose = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: '/builds', search: (s) => s });
    }
  };

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await updatePassword(
        data.oldPassword,
        data.password,
        data.passwordConfirm,
      );
      toast.success('Password updated successfully');
      form.reset();
      onClose();
    } catch {
      toast.error('Failed to update password');
    }
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={onClose}
      title="Change Password"
      description="Update your password"
    >
      <div className="pb-6">
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
      </div>
    </ResponsiveDialog>
  );
}
