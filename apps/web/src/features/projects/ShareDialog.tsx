import { shareViewPath } from '@app/shared';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSetSharing } from './hooks';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  shareToken: string | null;
}

/** Turn the read-only share link on or off, and copy it. */
export function ShareDialog({ open, onOpenChange, projectId, shareToken }: ShareDialogProps) {
  const setSharing = useSetSharing();
  const [copied, setCopied] = useState(false);
  const link = shareToken ? `${window.location.origin}${shareViewPath(shareToken)}` : '';

  function toggle(shared: boolean) {
    setCopied(false);
    setSharing.mutate(
      { id: projectId, shared },
      {
        onError: (error) => toast.error('Could not change sharing', { description: error.message }),
      },
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      toast.error('Copying failed; select the link and copy it by hand');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share for presentation</DialogTitle>
          <DialogDescription>
            Anyone with the link can look at the design in 3D, without an account. They cannot
            change anything. The link always shows the last saved version.
          </DialogDescription>
        </DialogHeader>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="share-switch">Share link</FieldLabel>
            <FieldDescription>
              Turning it off makes the link stop working. Turning it on again creates a new link.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="share-switch"
            checked={shareToken !== null}
            disabled={setSharing.isPending}
            onCheckedChange={toggle}
          />
        </Field>

        {shareToken && (
          <div className="flex gap-2">
            <Input
              readOnly
              value={link}
              aria-label="Share link"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button variant="outline" onClick={() => void copy()}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={link} target="_blank" rel="noreferrer" aria-label="Open the viewer">
                <ExternalLink />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
