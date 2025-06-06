import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { logout, pbClient } from '@/api/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useUser } from '@/store/auth';
import { logger } from '@/store/logger';

export const Route = createFileRoute('/_protected/builds/user/delete')({
  component: DeleteAccountRoute,
});

function DeleteAccountRoute() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const user = useUser()!;

  const handleDeleteAccount = async () => {
    try {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      if (emailConfirmation !== user.email) {
        toast.error('Email confirmation does not match your account email');
        return;
      }

      await pbClient.collection('users').delete(user.id);

      logout();
      await navigate({ to: '/login' });

      toast.success('Your account has been deleted successfully');
    } catch (err) {
      toast.error('Failed to delete account. Please try again.');
      logger.error('Failed to delete account:', err);
    }
  };

  const onClose = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: '/builds', search: (s) => s });
    }
  };

  return (
    <ResponsiveDialog
      open
      onOpenChange={onClose}
      title="Delete account"
      description={
        <p className="text-destructive">
          Warning: This action cannot be undone. This will permanently delete
          your account and remove all of your data from our servers.
        </p>
      }
      footer={
        <Button
          onClick={handleDeleteAccount}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={emailConfirmation !== user?.email}
        >
          Delete Account
        </Button>
      }
    >
      <div className="py-4">
        <p className="text-sm text-muted-foreground mb-2">
          Please type your email address to confirm account deletion:
        </p>
        <Input
          type="email"
          placeholder={user?.email}
          value={emailConfirmation}
          onChange={(e) => setEmailConfirmation(e.target.value)}
          className="w-full"
        />
      </div>
    </ResponsiveDialog>
  );
}
