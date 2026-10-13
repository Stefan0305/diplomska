import { Route, Routes } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/routes';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { RegisterPage } from '@/pages/RegisterPage';

export function App() {
  return (
    <div className="min-h-svh">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route index element={<HomePage />} />

          <Route element={<RedirectIfAuthenticated />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="projects" element={<PlaceholderPage title="Projects" sprint={2} />} />
            <Route path="projects/:id" element={<PlaceholderPage title="Editor" sprint={2} />} />
          </Route>

          {/* Public: clients open shared designs without an account. */}
          <Route path="view/:token" element={<PlaceholderPage title="Viewer" sprint={7} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
