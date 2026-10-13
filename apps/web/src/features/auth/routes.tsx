import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser } from './hooks';

/** Where the login page sends the user back to after logging in. */
export interface RedirectState {
  from?: string;
}

function FullPageSpinner() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="size-6" />
    </div>
  );
}

/** Renders child routes only for logged-in users; others are sent to /login. */
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) {
    const state: RedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** Login and register pages: logged-in users go straight to their projects. */
export function RedirectIfAuthenticated() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to="/projects" replace />;
  return <Outlet />;
}
