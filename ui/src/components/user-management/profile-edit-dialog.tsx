import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { pbClient } from '@/api/pocketbase';
import { Icons } from '@/components/icons';
import { AvatarInput } from '@/components/ui/avatar-input';
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
import { auth as useAuth } from '@/stores/auth';

const profileFormSchema = z.object({
  name: z.string().min(2).max(50),
  avatar: z.instanceof(FileList).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileEditForm({ onSuccess }: { onSuccess(): void }) {
  const user = useAuth((s) => s.record);
  const updateProfile = useAuth((s) => s.updateProfile);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  if (!user) return null;

  async function onSubmit(data: ProfileFormValues) {
    try {
      const formData = new FormData();
      formData.append('name', data.name);

      if (data.avatar?.[0]) {
        formData.append('avatar', data.avatar[0]);
      }

      await updateProfile(formData);
      toast.success('Profile updated successfully');
      onSuccess();
    } catch {
      toast.error('Failed to update profile');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <AvatarInput
              field={field}
              defaultAvatarUrl={pbClient.files.getURL(user, user.avatar)}
              name={user.name}
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
  );
}

interface ProfileEditDialogProps {
  children?: React.ReactNode;
  onSuccess?(): void;
}

export function ProfileEditDialog({
  children,
  onSuccess,
}: ProfileEditDialogProps) {
  return (
    <ResponsiveDialog
      trigger={
        children ?? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Icons.Profile className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
        )
      }
      title="Edit Profile"
      description="Change your name and profile picture"
      contentClassName="pb-6"
    >
      <ProfileEditForm onSuccess={() => onSuccess?.()} />
    </ResponsiveDialog>
  );
}
