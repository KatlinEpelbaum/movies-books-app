'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getMediaReviewsAction, likeReviewAction, deleteReviewAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export function ReviewsSection({ mediaId }: { mediaId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const reviewsData = await getMediaReviewsAction(mediaId);
      setReviews(reviewsData);
      setLoading(false);
    };

    loadData();
  }, [mediaId]);

  const handleLikeReview = async (reviewId: string) => {
    const result = await likeReviewAction(reviewId);
    if (result.success) {
      if (result.liked) {
        setLikedReviews(prev => new Set([...prev, reviewId]));
      } else {
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const result = await deleteReviewAction(reviewId);
      if (result.success) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    }
  };

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No reviews yet. Be the first to review!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} id={`review-${review.id}`}>
          <CardContent className="pt-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <Link href={`/profile/${review.user?.username}`} className="flex items-center gap-3 hover:opacity-80">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user?.profile_picture_url} />
                  <AvatarFallback>{review.user?.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{review.user?.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{review.user?.username}</p>
                </div>
              </Link>

              {currentUserId === review.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteReview(review.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Review Text */}
            <p className="text-sm leading-relaxed">{review.text}</p>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeReview(review.id)}
                className={likedReviews.has(review.id) ? 'text-red-500' : ''}
              >
                <Heart
                  className={`h-4 w-4 ${likedReviews.has(review.id) ? 'fill-current' : ''}`}
                />
                <span className="ml-1 text-xs">{review.likeCount}</span>
              </Button>

              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4" />
                <span className="ml-1 text-xs">Reply</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
