"use client";

import { useOptimistic, useRef, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus } from 'lucide-react';
import { manageUserLibraryAction, createCustomListAction, addMediaToListAction, removeMediaFromListAction } from '@/app/actions';
import type { MediaItem, MediaStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RatingStars } from '@/components/media/rating-stars';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type OptimisticUpdate = {
  status?: MediaStatus;
  rating?: number;
  isFavourite?: boolean;
  currentEpisode?: number;
  currentPage?: number;
}

export function MediaUserControls({ media, customLists = [], initialMediaLists = [] }: { media: MediaItem; customLists?: { id: string; name: string }[]; initialMediaLists?: string[] }) {
  const router = useRouter();
  
  console.log('🎮 MediaUserControls received media:', {
    title: media.title,
    numberOfSeasons: media.numberOfSeasons,
    episodesPerSeason: media.episodesPerSeason,
    totalEpisodes: media.totalEpisodes
  });
  
  const [optimisticMedia, setOptimisticMedia] = useOptimistic(
    media,
    (state, update: OptimisticUpdate) => ({ ...state, ...update })
  );
  const [isPending, startTransition] = useTransition();
  const [showListCreation, setShowListCreation] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [userCustomLists, setUserCustomLists] = useState<{ id: string; name: string }[]>(customLists);
  const [mediaInLists, setMediaInLists] = useState<Set<string>>(new Set(initialMediaLists));
  const [tempEpisode, setTempEpisode] = useState<number | null>(null);
  const [tempPage, setTempPage] = useState<string>('');
  const [isEditingPage, setIsEditingPage] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const actionHandler = async (formData: FormData) => {
    // Get the values from the form.
    const status = formData.get('status') as MediaStatus | null;
    const rating = formData.get('rating') ? Number(formData.get('rating')) : undefined;
    const isFavourite = formData.get('isFavourite') ? formData.get('isFavourite') === 'true' : undefined;
    const currentEpisode = formData.get('currentEpisode') ? Number(formData.get('currentEpisode')) : undefined;
    const currentSeason = formData.get('currentSeason') ? Number(formData.get('currentSeason')) : undefined;
    const currentPage = formData.get('currentPage') ? Number(formData.get('currentPage')) : undefined;

    console.log('📤 Submitting form data:', {
      status,
      rating,
      isFavourite,
      currentEpisode,
      currentSeason,
      currentPage,
      mediaId: media.id,
      title: media.title
    });

    // Start a transition for the optimistic update.
    startTransition(() => {
        setOptimisticMedia({ 
            status: status ?? optimisticMedia.userStatus,
            rating: rating ?? optimisticMedia.userRating,
            isFavourite: isFavourite ?? optimisticMedia.isFavourite,
            currentEpisode: currentEpisode ?? optimisticMedia.currentEpisode,
            currentSeason: currentSeason ?? optimisticMedia.currentSeason,
            currentPage: currentPage ?? optimisticMedia.currentPage,
         });
    });

    // Call the server action with all the form data.
    const result = await manageUserLibraryAction(formData);
    console.log('✅ Server action result:', result);
    
    // Refresh the page to get the latest data from the server
    if (result.success) {
      router.refresh();
    }
  };

  // This function will submit the form with the current status value
  const submitForm = (newStatus?: string) => {
    if (newStatus && formRef.current) {
      // Update the status value before submitting
      const statusInput = formRef.current.querySelector('input[name="status"]') as HTMLInputElement;
      if (statusInput) {
        statusInput.value = newStatus;
      }
    }
    // We need to use requestSubmit to trigger the form's action.
    formRef.current?.requestSubmit();
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    console.log('📝 Creating list:', newListName);
    startTransition(async () => {
      const result = await createCustomListAction(newListName);
      if (result.success) {
        console.log('✅ List created:', result.listId);
        setUserCustomLists([...userCustomLists, { id: result.listId!, name: newListName }]);
        setShowListCreation(false);
        setNewListName('');
        router.refresh();
      } else {
        console.error('❌ Error creating list:', result.error);
      }
    });
  };

  return (
    <>
      <form ref={formRef} action={actionHandler} className="space-y-4">
        {/* Hidden fields to ensure all media data is sent with every submission */}
        <input type="hidden" name="mediaId" value={media.id} />
        <input type="hidden" name="mediaType" value={media.type} />
        <input type="hidden" name="title" value={media.title} />
        <input type="hidden" name="coverImage" value={media.coverImage} />
        <input type="hidden" name="authorOrDirector" value={media.authorOrDirector} />
        <input type="hidden" name="year" value={media.year} />
        <input type="hidden" name="episodeRuntime" value={String(media.episodeRuntime || 0)} />
        <input type="hidden" name="totalEpisodes" value={String(media.totalEpisodes || 0)} />
        <input type="hidden" name="numberOfSeasons" value={String(media.numberOfSeasons || 0)} />
        <input type="hidden" name="episodesPerSeason" value={JSON.stringify(media.episodesPerSeason || {})} />
        {media.genres.map(g => <input key={g} type="hidden" name="genres" value={g} />)}
        
        {/* Hidden input for status that will be updated before submission */}
        <input type="hidden" name="status" value={optimisticMedia.userStatus || ''} />
        
        {/* Hidden inputs for isFavourite and currentEpisode */}
        <input type="hidden" name="isFavourite" value={String(optimisticMedia.isFavourite || false)} />
        <input type="hidden" name="currentEpisode" value={String(optimisticMedia.currentEpisode || 0)} />
        <input type="hidden" name="currentSeason" value={String(optimisticMedia.currentSeason || 1)} />
        <input type="hidden" name="currentPage" value={String(optimisticMedia.currentPage || 0)} />
        <input type="hidden" name="totalPages" value={String(media.totalPages || 0)} />
        
        {/* The inputs that the user interacts with */}
        <div className="flex gap-2">
            <Select
                value={optimisticMedia.userStatus}
                onValueChange={(value) => {
                  console.log('📝 Status changed to:', value);
                  submitForm(value);
                }}
                disabled={isPending}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={media.isComingSoon ? (media.type === 'book' ? "Only To Read available" : "Only Plan to Watch available") : "Set status"} />
                </SelectTrigger>
                <SelectContent>
                    {!media.isComingSoon ? (
                        media.type === 'book' ? (
                            <>
                                <SelectItem value="watching">Currently Reading</SelectItem>
                                <SelectItem value="completed">Finished</SelectItem>
                                <SelectItem value="plan_to_watch">To Read</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="dropped">Dropped</SelectItem>
                            </>
                        ) : (
                            <>
                                <SelectItem value="watching">Currently Watching</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="dropped">Dropped</SelectItem>
                            </>
                        )
                    ) : (
                        <SelectItem value="plan_to_watch">{media.type === 'book' ? 'To Read' : 'Plan to Watch'}</SelectItem>
                    )}
                </SelectContent>
            </Select>

            <Button 
              type="button"
              variant="outline" 
              size="icon" 
              aria-label="Add to favourites"
              onClick={() => {
                console.log('❤️ Favourite toggled:', !optimisticMedia.isFavourite);
                startTransition(async () => {
                  setOptimisticMedia({ isFavourite: !optimisticMedia.isFavourite });
                  const formData = new FormData(formRef.current!);
                  formData.set('isFavourite', String(!optimisticMedia.isFavourite));
                  await actionHandler(formData);
                });
              }}
              disabled={isPending}
            >
                <Heart className={optimisticMedia.isFavourite ? "fill-primary text-primary" : ""} />
            </Button>
        </div>

        {/* Season and Episode selector for currently watching TV series */}
        {media.type === 'tv' && optimisticMedia.userStatus === 'watching' && media.numberOfSeasons && media.totalEpisodes && (
          <div className="space-y-3">
            <div>
              <label htmlFor="currentSeason" className="text-sm font-medium">
                Current Season
              </label>
              <div className="flex gap-2 mt-1">
                <select
                  id="currentSeason"
                  value={optimisticMedia.currentSeason || 1}
                  onChange={(e) => {
                    const newSeason = Number(e.target.value);
                    setTempEpisode(null);
                    startTransition(() => {
                      setOptimisticMedia({ currentSeason: newSeason, currentEpisode: 1 });
                    });
                    const formData = new FormData(formRef.current!);
                    formData.set('currentSeason', String(newSeason));
                    formData.set('currentEpisode', '1');
                    actionHandler(formData);
                  }}
                  disabled={isPending}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  {Array.from({ length: media.numberOfSeasons }, (_, i) => i + 1).map(season => (
                    <option key={season} value={season}>
                      Season {season}
                    </option>
                  ))}
                </select>
                <span className="text-sm font-medium min-w-fit self-center">
                  / {media.numberOfSeasons}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="currentEpisode" className="text-sm font-medium">
                Current Episode (in Season {optimisticMedia.currentSeason || 1})
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="range"
                  id="currentEpisode"
                  min="1"
                  max={(() => {
                    if (media.episodesPerSeason && typeof media.episodesPerSeason === 'object') {
                      const seasonNum = optimisticMedia.currentSeason || 1;
                      return media.episodesPerSeason[seasonNum] || 10;
                    }
                    return 20;
                  })()}
                  value={tempEpisode !== null ? tempEpisode : (optimisticMedia.currentEpisode || 1)}
                  onChange={(e) => {
                    const newEpisode = Math.max(1, Number(e.target.value) || 1);
                    setTempEpisode(newEpisode);
                  }}
                  onMouseUp={(e) => {
                    const newEpisode = Math.max(1, Number((e.target as HTMLInputElement).value) || 1);
                    setTempEpisode(null);
                    startTransition(() => {
                      setOptimisticMedia({ currentEpisode: newEpisode });
                    });
                    const formData = new FormData(formRef.current!);
                    formData.set('currentEpisode', String(newEpisode));
                    actionHandler(formData);
                  }}
                  onTouchEnd={(e) => {
                    const newEpisode = Math.max(1, Number((e.target as HTMLInputElement).value) || 1);
                    setTempEpisode(null);
                    startTransition(() => {
                      setOptimisticMedia({ currentEpisode: newEpisode });
                    });
                    const formData = new FormData(formRef.current!);
                    formData.set('currentEpisode', String(newEpisode));
                    actionHandler(formData);
                  }}
                  disabled={isPending}
                  className="flex-1"
                  step="1"
                />
                <span className="text-sm font-medium min-w-fit">
                  {tempEpisode !== null ? tempEpisode : (optimisticMedia.currentEpisode || 1)} / {(() => {
                    if (media.episodesPerSeason && typeof media.episodesPerSeason === 'object') {
                      const seasonNum = optimisticMedia.currentSeason || 1;
                      return media.episodesPerSeason[seasonNum] || 10;
                    }
                    return 20;
                  })()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(() => {
                  if (media.episodesPerSeason && typeof media.episodesPerSeason === 'object') {
                    let total = 0;
                    const maxSeason = optimisticMedia.currentSeason || 1;
                    for (let s = 1; s < maxSeason; s++) {
                      total += media.episodesPerSeason[s] || 0;
                    }
                    total += tempEpisode !== null ? tempEpisode : (optimisticMedia.currentEpisode || 1);
                    return `You've completed ${total} total episodes`;
                  }
                  return `You've completed ~${((optimisticMedia.currentSeason || 1) - 1) * 10 + (tempEpisode !== null ? tempEpisode : (optimisticMedia.currentEpisode || 1))} total episodes`;
                })()}
              </p>
            </div>
          </div>
        )}

        {/* Page tracking for books that are currently being read */}
        {media.type === 'book' && optimisticMedia.userStatus === 'watching' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="currentPage" className="text-sm font-medium">
                Current Page
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  id="currentPage"
                  min="1"
                  max={media.totalPages || 1000}
                  value={isEditingPage ? tempPage : (optimisticMedia.currentPage || 1)}
                  onChange={(e) => {
                    setTempPage(e.target.value);
                  }}
                  onFocus={(e) => {
                    setIsEditingPage(true);
                    setTempPage(e.target.value);
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value.trim();
                    const newPage = inputValue === '' ? 1 : Math.max(1, Math.min(Number(inputValue), media.totalPages || 1000));
                    setIsEditingPage(false);
                    setTempPage('');
                    startTransition(() => {
                      setOptimisticMedia({ currentPage: newPage });
                    });
                    const formData = new FormData(formRef.current!);
                    formData.set('currentPage', String(newPage));
                    actionHandler(formData);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const inputValue = (e.target as HTMLInputElement).value.trim();
                      const newPage = inputValue === '' ? 1 : Math.max(1, Math.min(Number(inputValue), media.totalPages || 1000));
                      setIsEditingPage(false);
                      setTempPage('');
                      startTransition(() => {
                        setOptimisticMedia({ currentPage: newPage });
                      });
                      const formData = new FormData(formRef.current!);
                      formData.set('currentPage', String(newPage));
                      actionHandler(formData);
                    }
                  }}
                  disabled={isPending}
                  className="w-20 px-3 py-2 border rounded-lg text-center"
                />
                <span className="text-sm font-medium min-w-fit self-center">
                  / {media.totalPages || '?'}
                </span>
              </div>
              {media.totalPages && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(((isEditingPage && tempPage !== '' ? Number(tempPage) : (optimisticMedia.currentPage || 1)) / media.totalPages) * 100)}% complete
                </p>
              )}
            </div>
          </div>
        )}

        {/* List selection and custom list creation */}
        <div className="space-y-2">
          <label htmlFor="lists" className="text-sm font-medium">
            Add to Lists
          </label>
          <div className="flex gap-2 flex-wrap">
            {userCustomLists.map((list) => (
              <button 
                key={list.id}
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    const inList = mediaInLists.has(list.id);
                    if (inList) {
                      const result = await removeMediaFromListAction(media.id, list.id);
                      if (result.success || !result.error) {
                        const newLists = new Set(mediaInLists);
                        newLists.delete(list.id);
                        setMediaInLists(newLists);
                      }
                    } else {
                      const result = await addMediaToListAction(media.id, list.id);
                      if (result.success || !result.error) {
                        const newLists = new Set(mediaInLists);
                        newLists.add(list.id);
                        setMediaInLists(newLists);
                      }
                    }
                    router.refresh();
                  });
                }}
                className={`px-3 py-1 rounded border text-sm transition-colors ${mediaInLists.has(list.id) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-gray-100'}`}
                disabled={isPending}
              >
                📌 {list.name}
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowListCreation(!showListCreation)}
              disabled={isPending}
            >
              <Plus className="w-4 h-4" /> New List
            </Button>
          </div>
          
          {showListCreation && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateList}
                disabled={!newListName.trim() || isPending}
              >
                Create
              </Button>
            </div>
          )}
        </div>
        
        <Card>
             <CardHeader>
                <CardTitle className="font-headline text-lg">Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Hidden input for rating, to be submitted with the form */}
                <input type="hidden" name="rating" value={String(optimisticMedia.userRating || 0)} />
                <RatingStars
                    rating={optimisticMedia.userRating || 0}
                    isInteractive={true}
                    onRatingChange={(newRating) => {
                        console.log('⭐ Rating changed to:', newRating);
                        const formData = new FormData(formRef.current!);
                        formData.set('rating', String(newRating));
                        actionHandler(formData);
                    }}
                    disabled={isPending}
                />
            </CardContent>
        </Card>
      </form>
    </>
  );
}