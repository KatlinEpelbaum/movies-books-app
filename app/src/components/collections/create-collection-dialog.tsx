'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCustomListAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const EMOJIS = [
  '📚', '🎬', '📺', '⭐', '❤️',
  '🎯', '🔖', '📖', '🎪', '🎭',
  '🎨', '🎵', '🏆', '✨', '🌟',
  '💫', '🎁', '🔥', '💎', '🌈'
];

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated?: () => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCollectionCreated,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCustomListAction(
        name,
        emoji || undefined,
        description || undefined,
        isPublic
      );

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Collection created successfully',
        });
        setName('');
        setEmoji('');
        setDescription('');
        setIsPublic(false);
        onOpenChange(false);
        onCollectionCreated?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              placeholder="e.g., My Favorites"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Emoji Selector */}
          <div className="grid gap-2">
            <Label htmlFor="emoji">Emoji (Optional)</Label>
            <Select value={emoji || "none"} onValueChange={(val) => setEmoji(val === "none" ? "" : val)} disabled={isLoading}>
              <SelectTrigger id="emoji">
                <SelectValue placeholder="Select an emoji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {EMOJIS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e} {e === '📚' && '(Books)'}{e === '🎬' && '(Movies)'}{e === '📺' && '(TV)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public" className="font-medium">Visibility</Label>
              <p className="text-xs text-muted-foreground mt-1">{isPublic ? 'Public - visible on your profile' : 'Private - only you can see'}</p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
