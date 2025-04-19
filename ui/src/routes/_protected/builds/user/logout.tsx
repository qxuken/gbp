import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useLogout } from '@/store/auth';

export const Route = createFileRoute('/_protected/builds/user/logout')({
  component: LogoutRoute,
});

function LogoutRoute() {
  const router = useRouter();
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = async () => {
    logout();
    await router.invalidate();
    await navigate({ to: '/login' });
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
      title="Are you sure you want to log out?"
      description="You will be signed out of your account and redirected to the login page."
      footer={<Button onClick={handleLogout}>Log out</Button>}
    />
  );
}
