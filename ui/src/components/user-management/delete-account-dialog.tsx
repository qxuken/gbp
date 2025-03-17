import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { pbClient } from '@/api/pocketbase';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/stores/auth';

interface DeleteAccountDialogProps {
  onDelete?(): void;
}

export function DeleteAccountDialog({ onDelete }: DeleteAccountDialogProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const auth = useAuth();
  const [emailConfirmation, setEmailConfirmation] = useState('');

  const handleDeleteAccount = async () => {
    try {
      if (!auth.record?.id) {
        throw new Error('Not authenticated');
      }

      if (emailConfirmation !== auth.record.email) {
        toast.error('Email confirmation does not match your account email');
        return;
      }

      // Delete the user account
      await pbClient.collection('users').delete(auth.record.id);

      // Clear auth state and redirect
      auth.logout();
      await router.invalidate();
      await navigate({ to: '/login' });
      onDelete?.();

      toast.success('Your account has been deleted successfully');
    } catch (err) {
      console.error('Failed to delete account:', err);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive"
        >
          <Icons.Remove className="mr-2 h-4 w-4" />
          <span>Delete Account</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
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
            placeholder={auth.record?.email}
            value={emailConfirmation}
            onChange={(e) => setEmailConfirmation(e.target.value)}
            className="w-full"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setEmailConfirmation('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={emailConfirmation !== auth.record?.email}
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
