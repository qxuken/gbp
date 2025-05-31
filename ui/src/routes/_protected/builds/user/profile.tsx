import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4-mini';

import { pbClient, updateProfile } from '@/api/pocketbase';
import { Icons } from '@/components/icons';
import { AvatarInput } from '@/components/ui/avatar-input';
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
import { useUser } from '@/store/auth';

const profileFormSchema = z.object({
  name: z.string().check(z.minLength(2), z.maxLength(50)),
  avatar: z.optional(z.instanceof(FileList)),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const Route = createFileRoute('/_protected/builds/user/profile')({
  component: ProfileEditRoute,
});

function ProfileEditRoute() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const user = useUser();
  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onClose = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: '/builds', search: (s) => s });
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);

      if (data.avatar?.[0]) {
        formData.append('avatar', data.avatar[0]);
      }

      await updateProfile(formData);
      toast.success('Profile updated successfully');
      onClose();
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={onClose}
      title="Edit Profile"
      description="Change your name and profile picture"
    >
      <div className="pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <AvatarInput
                  field={field}
                  defaultAvatarUrl={
                    user ? pbClient.files.getURL(user, user.avatar) : undefined
                  }
                  name={user?.name}
                />
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
              Update Profile
            </Button>
          </form>
        </Form>
      </div>
    </ResponsiveDialog>
  );
}
