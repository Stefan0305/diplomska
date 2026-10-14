import type { ProjectSummary } from '@app/shared';
import { FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteProjectDialog } from '@/features/projects/DeleteProjectDialog';
import {
  useCreateProject,
  useDeleteProject,
  useDuplicateProject,
  useProjects,
  useRenameProject,
} from '@/features/projects/hooks';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { ProjectNameDialog } from '@/features/projects/ProjectNameDialog';

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useProjects();
  const createMutation = useCreateProject();
  const renameMutation = useRenameProject();
  const duplicateMutation = useDuplicateProject();
  const deleteMutation = useDeleteProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<ProjectSummary | null>(null);
  const [deleting, setDeleting] = useState<ProjectSummary | null>(null);

  function handleDuplicate(project: ProjectSummary) {
    duplicateMutation.mutate(project.id, {
      onSuccess: (copy) => toast.success(`Created “${copy.name}”`),
      onError: () => toast.error('Could not duplicate the project'),
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const { id, name } = deleting;
    setDeleting(null);
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(`Deleted “${name}”`),
      onError: () => toast.error('Could not delete the project'),
    });
  }

  const newProjectButton = (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus />
      New project
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Your rooms, gardens and other spaces.</p>
        </div>
        {projects.data && projects.data.length > 0 && newProjectButton}
      </div>

      {projects.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      )}

      {projects.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Could not load your projects: {projects.error.message}
          </AlertDescription>
        </Alert>
      )}

      {projects.data?.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create your first project to start designing a room or a garden.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newProjectButton}</EmptyContent>
        </Empty>
      )}

      {projects.data && projects.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={() => setRenaming(project)}
              onDuplicate={() => handleDuplicate(project)}
              onDelete={() => setDeleting(project)}
            />
          ))}
        </div>
      )}

      <ProjectNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New project"
        description="Give your space a name. You can change it later."
        submitLabel="Create"
        onSubmit={async (input) => {
          const project = await createMutation.mutateAsync(input);
          navigate(`/projects/${project.id}`);
        }}
      />

      <ProjectNameDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title="Rename project"
        description="Choose a new name for this project."
        submitLabel="Save"
        initialName={renaming?.name}
        onSubmit={(input) =>
          renameMutation.mutateAsync({ id: renaming?.id ?? '', input }).then(() => {
            toast.success('Project renamed');
          })
        }
      />

      <DeleteProjectDialog
        projectName={deleting?.name ?? null}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
