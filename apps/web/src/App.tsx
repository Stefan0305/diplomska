import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { Spinner } from '@/components/ui/spinner';
import { Toaster } from '@/components/ui/sonner';
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/routes';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { RegisterPage } from '@/pages/RegisterPage';

// The editor pulls in three.js; load it only when a project is opened.
const EditorPage = lazy(() =>
  import('@/pages/EditorPage').then((module) => ({ default: module.EditorPage })),
);

/** Regular pages: centred, scrolling content. */
function PageLayout() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Outlet />
    </main>
  );
}

/** Full-screen tools (editor, viewer): fill the space under the header without scrolling. */
function FullScreenLayout() {
  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </main>
  );
}

export function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <Routes>
        <Route element={<PageLayout />}>
          <Route index element={<HomePage />} />

          <Route element={<RedirectIfAuthenticated />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="projects" element={<ProjectsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<FullScreenLayout />}>
          <Route element={<RequireAuth />}>
            <Route path="projects/:id" element={<EditorPage />} />
          </Route>
          {/* Public: clients open shared designs without an account. */}
          <Route path="view/:token" element={<PlaceholderPage title="Viewer" sprint={7} />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </div>
  );
}
