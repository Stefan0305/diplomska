import { Link, Route, Routes } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

export function App() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
          <Link to="/" className="font-heading font-semibold">
            Spatial Planner 3D
          </Link>
          <Link to="/projects" className="text-muted-foreground hover:text-foreground">
            Projects
          </Link>
          <Link to="/login" className="ml-auto text-muted-foreground hover:text-foreground">
            Log in
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="login" element={<PlaceholderPage title="Log in" sprint={1} />} />
          <Route path="register" element={<PlaceholderPage title="Register" sprint={1} />} />
          <Route path="projects" element={<PlaceholderPage title="Projects" sprint={2} />} />
          <Route path="projects/:id" element={<PlaceholderPage title="Editor" sprint={2} />} />
          <Route path="view/:token" element={<PlaceholderPage title="Viewer" sprint={7} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
