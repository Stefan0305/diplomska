import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

export function AppHeader() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    });
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
        <Link to="/" className="font-heading font-semibold">
          Spatial Planner 3D
        </Link>
        {user && (
          <Link to="/projects" className="text-muted-foreground hover:text-foreground">
            Projects
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-muted-foreground">{user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
