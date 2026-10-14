import type { ProjectSummary } from '@app/shared';
import { Box, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/time';

interface ProjectCardProps {
  project: ProjectSummary;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  return (
    <Card className="group relative gap-0 overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <Box className="size-10 text-muted-foreground/50" />
        )}
      </div>
      <CardHeader className="pt-4">
        <CardTitle className="truncate pr-8">
          {/* The stretched link makes the whole card clickable. */}
          <Link to={`/projects/${project.id}`} className="after:absolute after:inset-0">
            {project.name}
          </Link>
        </CardTitle>
        <CardDescription>Updated {formatRelativeTime(project.updatedAt)}</CardDescription>
      </CardHeader>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-4 z-10"
            aria-label={`Actions for ${project.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onRename}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
