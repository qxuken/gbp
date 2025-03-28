import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { auth as useAuth } from '@/stores/auth';

const emailFormSchema = z.object({
  email: z.string().email(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export const Route = createFileRoute('/_protected/builds/user/email')({
  component: EmailEditRoute,
});

function EmailEditRoute() {
  const router = useRouter();
  const navigate = useNavigate();
  const user = useAuth((s) => s.record);
  const updateEmail = useAuth((s) => s.updateEmail);
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const onClose = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: '/builds', search: (s) => s });
    }
  };

  const onSubmit = async (data: EmailFormValues) => {
    try {
      await updateEmail(data.email);
      toast.success('Email verification sent. Please check your inbox.');
      onClose();
    } catch {
      toast.error('Failed to update email');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email</DialogTitle>
          <DialogDescription>
            Enter your new email address. A verification link will be sent to
            confirm the change.
          </DialogDescription>
        </DialogHeader>
        <div className="pb-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
