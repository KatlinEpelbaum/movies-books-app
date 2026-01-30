"use client";

import { useState, useEffect } from "react";
import { MediaCard } from "@/components/media/media-card";
import { MediaItem } from "@/lib/types";
import { Heart, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getListItemsAction, removeMediaFromListAction, updateCustomListAction, deleteCustomListAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface List {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface ListPageClientProps {
  initialFavourites: MediaItem[];
  initialLists: List[];
}

const statusOptions = [
  { status: "plan_to_watch", label: "Up Next", icon: "📋" },
  { status: "watching", label: "In Progress", icon: "▶️" },
  { status: "completed", label: "Completed", icon: "✅" },
  { status: "on_hold", label: "On Hold", icon: "⏸️" },
  { status: "dropped", label: "Dropped", icon: "❌" },
];

export default function ListPageClient({ 
  initialFavourites = [],
  initialLists = [] 
}: ListPageClientProps) {
  const router = useRouter();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<MediaItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedList = initialLists.find(l => l.id === selectedListId);

  useEffect(() => {
    if (selectedListId) {
      setIsLoadingItems(true);
      getListItemsAction(selectedListId).then(({ items }) => {
        setListItems(items);
        setIsLoadingItems(false);
      });
    } else {
      setListItems([]);
    }
  }, [selectedListId]);

  const handleRemoveFromList = async (mediaId: string) => {
    if (!selectedListId) return;
    
    await removeMediaFromListAction(mediaId, selectedListId);
    setListItems(listItems.filter(item => item.id !== mediaId));
    router.refresh();
  };

  const handleEditClick = (list: List) => {
    setEditingListId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingListId || !editName.trim()) return;
    setIsSubmitting(true);
    
    const result = await updateCustomListAction(editingListId, editName.trim(), editDescription.trim() || undefined);
    
    if (result.success) {
      setEditingListId(null);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (list: List) => {
    setDeletingListId(list.id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingListId) return;
    setIsSubmitting(true);
    
    const result = await deleteCustomListAction(deletingListId);
    
    if (result.success) {
      setDeletingListId(null);
      if (selectedListId === deletingListId) {
        setSelectedListId(null);
      }
      router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Lists</h1>
        <p className="text-muted-foreground">
          Organize and manage your media collections
        </p>
      </div>

      {/* Status Categories */}
      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">Your Status Categories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statusOptions.map(({ status, label, icon }) => (
            <Button 
              key={status}
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Link href={`/status/${status}`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-sm">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {/* Favourites Section - Horizontal Scroll */}
      {initialFavourites.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            <h2 className="font-headline text-2xl font-semibold">Favourites</h2>
            <span className="text-sm text-muted-foreground">({initialFavourites.length})</span>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4 min-w-min">
              {initialFavourites.map((item) => (
                <div key={item.id} className="w-40 flex-shrink-0">
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lists Carousel */}
      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">Your Collections</h2>
        
        {initialLists.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-center text-muted-foreground">
              No custom lists yet. Create one from a media page!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-4 min-w-min">
              {initialLists.map((list) => (
                <Button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id === selectedListId ? null : list.id)}
                  variant={selectedListId === list.id ? "default" : "outline"}
                  className="whitespace-nowrap"
                >
                  📌 {list.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Selected List Full View */}
      {selectedList && (
        <section className="space-y-4 border-t pt-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-headline text-3xl font-semibold">{selectedList.name}</h2>
              {selectedList.description && (
                <p className="text-base text-muted-foreground mt-2">{selectedList.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {listItems.length} item{listItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => handleEditClick(selectedList)}
              >
                <Edit2 className="h-4 w-4" /> Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-500 hover:text-red-600"
                onClick={() => handleDeleteClick(selectedList)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          {isLoadingItems ? (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <p className="text-center text-muted-foreground">Loading...</p>
            </div>
          ) : listItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <p className="text-center text-muted-foreground">
                This list is empty. Add items from a media page!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {listItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <MediaCard media={item} />
                    <button
                      onClick={() => handleRemoveFromList(item.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      aria-label="Remove from list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Edit List Modal */}
      {editingListId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit List</h3>
              <button
                onClick={() => setEditingListId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
                  List Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter list name"
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter list description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingListId(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editName.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingListId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Delete List</h3>
            
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this list? This action cannot be undone.
            </p>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingListId(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
