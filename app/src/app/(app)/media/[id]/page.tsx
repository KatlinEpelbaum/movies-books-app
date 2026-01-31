import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Book,
  Film,
  Tv,
  CalendarDays,
  Tag,
  Star,
  MessageSquare,
  Play,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvailabilityChecker } from "@/components/media/availability-checker";
import { RatingStars } from "@/components/media/rating-stars";
import { TrailerButton } from "@/components/media/trailer-button";
import { BackButton } from "@/components/media/back-button";
import { ReviewForm } from "@/components/media/review-form";
import { ReviewsSection } from "@/components/media/reviews-section";
import { getMediaDetails } from "@/lib/media-api";
import { MediaType } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { MediaUserControls } from "@/components/media/media-user-controls";
import { getUserCustomLists, getMediaListsAction } from "@/app/actions";

const typeIcons = {
  book: <Book className="h-4 w-4" />,
  movie: <Film className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
};

async function getMediaUserData(mediaId: string, userId?: string) {
    if (!userId) return null;
    const supabase = await createClient();
    const { data } = await supabase
        .from('user_media')
        .select('status, rating, is_favourite, current_episode, current_season, current_page')
        .eq('user_id', userId)
        .eq('media_id', mediaId)
        .single();
    return data;
}


export default async function MediaDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const [type, apiId] = id.split(/-(.+)/);

  console.log(`[Media Detail] Received ID: ${id}, Parsed Type: ${type}, API ID: ${apiId}`);

  if (!type || !apiId || !['book', 'movie', 'tv'].includes(type)) {
    console.log(`[Media Detail] Invalid ID format or type`);
    notFound();
  }

  const media = await getMediaDetails(id, type as MediaType);
  if (!media) {
    console.log(`[Media Detail] getMediaDetails returned null for ID: ${id}`);
    notFound();
  }
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userData = await getMediaUserData(media.id, user?.id);
  const customLists = user ? await getUserCustomLists() : [];
  const mediaLists = user ? await getMediaListsAction(media.id) : [];

  media.userStatus = userData?.status as any;
  media.isFavourite = userData?.is_favourite;
  media.userRating = userData?.rating;
  media.currentEpisode = userData?.current_episode;
  media.currentSeason = userData?.current_season;
  media.currentPage = userData?.current_page;
  
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <BackButton />
      
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <Image
              src={media.coverImage}
              alt={`Cover for ${media.title}`}
              width={400}
              height={600}
              className="h-auto w-full object-cover"
              data-ai-hint="book cover movie poster"
            />
          </Card>
          
          <TrailerButton trailerUrl={media.trailerUrl} title={media.title} />
          
          <MediaUserControls media={media} customLists={customLists} initialMediaLists={mediaLists} />
          
          <div className="mt-4">
            <AvailabilityChecker media={media} />
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {typeIcons[media.type]}
                <span className="capitalize">{media.type}</span>
              </div>
              <h1 className="font-headline text-4xl font-bold">
                {media.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {media.authorOrDirector}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{media.year}</span>
              </div>
              {media.genres.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <div className="flex flex-wrap gap-1">
                    {media.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {media.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>{media.rating}/10</span>
                </div>
              )}
            </div>

            <p className="text-base leading-relaxed">{media.description}</p>
          </div>

          <Separator className="my-8" />

          {/* Reviews Section */}
          <div className="space-y-8">
            <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                <MessageSquare />
                Reviews
            </h2>

            {/* Review Form */}
            <ReviewForm mediaId={media.id} />

            {/* Reviews List */}
            <ReviewsSection mediaId={media.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
  