import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export const Route = createFileRoute('/_auth/confirm')({
  component: SignupComponent,
});

function SignupComponent() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Your account is almost ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>Please verify your email to continue.</Alert>
            <div className="mt-4 text-center text-sm">
              Proceed to{' '}
              <Link
                to="/login"
                className="underline underline-offset-4"
                search={(prev) => prev}
                activeOptions={{ exact: true }}
              >
                login
              </Link>{' '}
              if have you confirmed your email
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
