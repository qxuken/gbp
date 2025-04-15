import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { pbClient } from '@/api/pocketbase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useRecord, useLogout } from '@/store/auth';

export const Route = createFileRoute('/_protected/builds/user/delete')({
  component: DeleteAccountRoute,
});

function DeleteAccountRoute() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const user = useRecord();
  const logout = useLogout();
  const [emailConfirmation, setEmailConfirmation] = useState('');

  const handleDeleteAccount = async () => {
    try {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      if (emailConfirmation !== user.email) {
        toast.error('Email confirmation does not match your account email');
        return;
      }

      // Delete the user account
      await pbClient.collection('users').delete(user.id);

      // Clear auth state and redirect
      logout();
      await router.invalidate();
      await navigate({ to: '/login' });

      toast.success('Your account has been deleted successfully');
    } catch (err) {
      console.error('Failed to delete account:', err);
      toast.error('Failed to delete account. Please try again.');
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
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive">
            Warning: This action cannot be undone. This will permanently delete
            your account and remove all of your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={emailConfirmation !== user?.email}
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
