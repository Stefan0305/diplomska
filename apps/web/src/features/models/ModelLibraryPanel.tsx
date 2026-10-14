import { modelCategories, type ModelInfo } from '@app/shared';
import { Search, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/features/editor/store';
import { categoryInfo, formatFileSize } from './categories';
import { filterModels, type CategoryFilter } from './filterModels';
import { useDeleteModel, useModels } from './hooks';
import { UploadModelDialog } from './UploadModelDialog';

function ModelRow({
  model,
  onPlace,
  onDelete,
}: {
  model: ModelInfo;
  onPlace: () => void;
  onDelete: () => void;
}) {
  const Icon = categoryInfo[model.category].icon;
  return (
    <li className="group flex items-center gap-1 rounded-md hover:bg-muted">
      <button
        type="button"
        onClick={onPlace}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
        title={`Place “${model.name}” in the scene`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-background">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium">{model.name}</span>
          <span className="block text-[11px] text-muted-foreground">
            {model.builtIn ? 'Built-in' : `Yours · ${formatFileSize(model.fileSize)}`}
          </span>
        </span>
      </button>
      {!model.builtIn && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Delete ${model.name}`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </li>
  );
}

export function ModelLibraryPanel() {
  const models = useModels();
  const deleteModel = useDeleteModel();
  const addObject = useEditorStore((s) => s.addObject);
  const removeObjectsByModel = useEditorStore((s) => s.removeObjectsByModel);
  const objects = useEditorStore((s) => s.scene?.objects);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<ModelInfo | null>(null);

  const usedInScene = deleting
    ? (objects ?? []).filter((o) => o.modelId === deleting.id).length
    : 0;
  const visible = models.data ? filterModels(models.data, category, search) : [];

  function place(model: ModelInfo) {
    if (addObject(model.id)) toast.success(`Placed “${model.name}” in the centre of the floor`);
    else toast.error('This scene already has the maximum number of objects');
  }

  function confirmDelete() {
    if (!deleting) return;
    const model = deleting;
    setDeleting(null);
    deleteModel.mutate(model.id, {
      onSuccess: () => {
        const removed = removeObjectsByModel(model.id);
        toast.success(
          removed > 0
            ? `Deleted “${model.name}” and removed it ${removed}× from this scene`
            : `Deleted “${model.name}”`,
        );
      },
      onError: (err) => toast.error(`Could not delete the model: ${err.message}`),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Model library</h2>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload />
            Upload
          </Button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search models"
            aria-label="Search models"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Tabs value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="all" className="flex-none text-xs">
              All
            </TabsTrigger>
            {modelCategories.map((value) => (
              <TabsTrigger key={value} value={value} className="flex-none text-xs">
                {categoryInfo[value].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {models.isPending && (
          <div className="flex flex-col gap-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        )}
        {models.isError && (
          <p className="p-2 text-xs text-destructive">
            Could not load models: {models.error.message}
          </p>
        )}
        {models.isSuccess && visible.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">
            {models.data.length === 0 ? 'No models yet. Upload a GLB file.' : 'No models match.'}
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {visible.map((model) => (
            <ModelRow
              key={model.id}
              model={model}
              onPlace={() => place(model)}
              onDelete={() => setDeleting(model)}
            />
          ))}
        </ul>
      </div>

      <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">
        Click a model to place it. Moving and resizing come in Sprint 5.
      </p>

      <UploadModelDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={(model) => {
          setCategory('all');
          setSearch('');
          toast.success(`Uploaded “${model.name}”. Click it in the library to place it.`);
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The file is deleted permanently.
              {usedInScene > 0 &&
                ` It is used ${usedInScene}× in this scene; those objects are removed too.`}{' '}
              Other projects that use it will show a placeholder instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
