import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeoutButton } from '@/hooks/useTimeoutButton';
import { auth as useAuth } from '@/stores/auth';

export const Route = createFileRoute('/_auth/confirm')({
  component: ConfirmComponent,
  validateSearch: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

function ConfirmComponent() {
  const login = useAuth((s) => s.login);
  const requestVerification = useAuth((s) => s.requestVerification);
  const router = useRouter();
  const search = Route.useSearch();
  const [resendTimeout, startResendTimeout] = useTimeoutButton();

  const tryLogin = async () => {
    try {
      await login(search.email, search.password);
      await router.invalidate();
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      }
    }
  };

  const resendEmail = async () => {
    try {
      await requestVerification(search.email);
      startResendTimeout();
      toast.success('Check your inbox');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">
              Verify your email to activate your account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Alert>
              <Icons.Alert className="size-4" />
              <AlertDescription>
                We’ve sent a verification email. Please check your inbox and
                confirm your email to proceed.
              </AlertDescription>
            </Alert>
            <Button size="lg" className="mt-2 w-full" onClick={tryLogin}>
              I’ve Verified My Email
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={resendEmail}
              disabled={resendTimeout > 0}
            >
              Resend Verification Email
              {resendTimeout > 0 && ` - ${resendTimeout}`}
            </Button>
            <div className="mt-2 text-center text-sm">
              Have verified account?{' '}
              <Link
                to="/login"
                className="underline underline-offset-4"
                search={() => ({ redirect: search.redirect })}
                activeOptions={{ exact: true }}
              >
                Login
              </Link>{' '}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
