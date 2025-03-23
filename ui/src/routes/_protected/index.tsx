import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/_protected/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/builds' });
  }, []);

  return null;
}
