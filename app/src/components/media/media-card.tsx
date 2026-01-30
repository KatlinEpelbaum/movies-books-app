"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTransition, useState, useEffect } from 'react';
import { manageUserLibraryAction } from '@/app/actions';
import { MediaItem } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: MediaItem;
}

const SEARCH_STORAGE_KEY = 'search-state';

export function MediaCard({ media }: MediaCardProps) {
  const [isFavourite, setIsFavourite] = useState(media.isFavourite ?? false);
  const [isPending, startTransition] = useTransition();
  const [imageSrc, setImageSrc] = useState(media.coverImage);

  // Sync with prop when it changes (e.g., from server refetch)
  useEffect(() => {
    setIsFavourite(media.isFavourite ?? false);
  }, [media.isFavourite]);

  // Save scroll position before navigating
  const handleCardClick = () => {
    const savedState = sessionStorage.getItem(SEARCH_STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      state.scrollY = window.scrollY;
      sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state));
    }
  };

  const handleImageError = () => {
    // Fallback to Unsplash book image if OpenLibrary fails
    const hash = media.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = Math.abs(hash) % 1000;
    setImageSrc(`https://images.unsplash.com/photo-1507842217343-583f20270319?w=600&h=900&fit=crop&crop=faces&q=80&seed=${seed}`);
  };

  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavouriteStatus = !isFavourite;
    setIsFavourite(newFavouriteStatus); // Immediate UI update

    startTransition(async () => {
      const formData = new FormData();
      formData.set('mediaId', media.id);
      formData.set('mediaType', media.type);
      formData.set('title', media.title);
      formData.set('coverImage', media.coverImage);
      formData.set('authorOrDirector', media.authorOrDirector);
      formData.set('year', String(media.year));
      media.genres.forEach(g => formData.append('genres', g));
      formData.set('isFavourite', String(newFavouriteStatus));

      await manageUserLibraryAction(formData);
    });
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link href={`/media/${media.id}`} className="block" onClick={handleCardClick}>
        <CardContent className="p-0">
          <Image
            src={imageSrc}
            alt={`Cover for ${media.title}`}
            width={600}
            height={900}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="book cover movie poster"
            onError={handleImageError}
          />
          {media.isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-bold text-white">
                Coming Soon
              </div>
            </div>
          )}
        </CardContent>
      </Link>
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="font-headline text-lg font-bold text-white shadow-black/50 [text-shadow:_0_1px_4px_var(--tw-shadow-color)]">
          {media.title}
        </h3>
        <p className="text-sm text-gray-200">{media.authorOrDirector}</p>
      </div>
      <Button
        onClick={handleFavouriteClick}
        disabled={isPending}
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 rounded-full bg-background/50 text-primary-foreground backdrop-blur-sm transition-all hover:bg-background/75 hover:text-primary-foreground focus:ring-primary"
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
      >
        <Heart className={cn("h-5 w-5", isFavourite ? "fill-primary text-primary" : "text-primary")} />
      </Button>
    </Card>
  );
}
