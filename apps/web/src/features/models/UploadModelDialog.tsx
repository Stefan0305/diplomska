import {
  checkModelFile,
  MODEL_MAX_BYTES,
  modelCategories,
  modelNameFromFileName,
  uploadModelFieldsSchema,
  type ModelCategory,
  type ModelInfo,
} from '@app/shared';
import { Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api';
import { categoryInfo, formatFileSize } from './categories';
import { useUploadModel } from './hooks';

interface UploadModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (model: ModelInfo) => void;
}

export function UploadModelDialog({ open, onOpenChange, onUploaded }: UploadModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted only while open, so every upload starts with an empty form. */}
        <UploadModelForm
          onDone={(model) => {
            onUploaded(model);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type FieldErrors = Partial<Record<'file' | 'name' | 'category', string>>;

function UploadModelForm({ onDone }: { onDone: (model: ModelInfo) => void }) {
  const upload = useUploadModel();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [category, setCategory] = useState<ModelCategory>('furniture');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleFile(selected: File | null) {
    setFile(selected);
    setErrors((e) => ({
      ...e,
      file: selected ? (checkModelFile(selected) ?? undefined) : undefined,
    }));
    // Suggest a name from the file name until the user types their own.
    if (selected && !nameEdited) setName(modelNameFromFileName(selected.name));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const next: FieldErrors = {};
    if (!file) next.file = 'Choose a .glb file';
    else next.file = checkModelFile(file) ?? undefined;
    const fields = uploadModelFieldsSchema.safeParse({ name, category });
    if (!fields.success) {
      for (const issue of fields.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
    }
    setErrors(next);
    if (!file || next.file || next.name || next.category || !fields.success) return;

    try {
      onDone(await upload.mutateAsync({ file, fields: fields.data }));
    } catch (err) {
      if (err instanceof ApiError && err.fields && Object.keys(err.fields).length > 0) {
        setErrors(err.fields as FieldErrors);
      } else {
        setFormError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Upload a model</DialogTitle>
        <DialogDescription>
          GLB files only, up to {MODEL_MAX_BYTES / 1024 / 1024} MB. Models should be modelled in
          metres; you can resize them after placing.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="py-4">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={Boolean(errors.file)}>
          <FieldLabel htmlFor="model-file">File</FieldLabel>
          <Input
            id="model-file"
            type="file"
            accept=".glb,model/gltf-binary"
            aria-invalid={Boolean(errors.file)}
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
          {file && !errors.file && <FieldDescription>{formatFileSize(file.size)}</FieldDescription>}
          <FieldError>{errors.file}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="model-name">Name</FieldLabel>
          <Input
            id="model-name"
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              setName(event.target.value);
              setNameEdited(true);
            }}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.category)}>
          <FieldLabel htmlFor="model-category">Category</FieldLabel>
          <Select value={category} onValueChange={(value) => setCategory(value as ModelCategory)}>
            <SelectTrigger id="model-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelCategories.map((value) => {
                const { label, icon: Icon } = categoryInfo[value];
                return (
                  <SelectItem key={value} value={value}>
                    <Icon />
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FieldError>{errors.category}</FieldError>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={upload.isPending}>
          {upload.isPending ? <Spinner /> : <Upload />}
          Upload
        </Button>
      </DialogFooter>
    </form>
  );
}
