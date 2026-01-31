'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getMediaReviewsAction, likeReviewAction, deleteReviewAction, getReviewCommentsAction, createCommentAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';
import { CommentSection } from './comment-section';

export function ReviewsSection({ mediaId }: { mediaId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [reviewComments, setReviewComments] = useState<Record<string, any[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const reviewsData = await getMediaReviewsAction(mediaId);
      setReviews(reviewsData);
      
      // Load current user's liked reviews
      if (user) {
        const { data: userLikes } = await supabase
          .from('review_likes')
          .select('review_id')
          .eq('user_id', user.id)
          .in('review_id', reviewsData.map(r => r.id));
        
        if (userLikes) {
          setLikedReviews(new Set(userLikes.map(like => like.review_id)));
        }
      }
      
      setLoading(false);
    };

    loadData();
  }, [mediaId]);

  const handleLikeReview = async (reviewId: string) => {
    const result = await likeReviewAction(reviewId);
    if (result.success) {
      if (result.liked) {
        setLikedReviews(prev => new Set([...prev, reviewId]));
        // Increment like count
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, likeCount: (r.likeCount || 0) + 1 }
            : r
        ));
      } else {
        setLikedReviews(prev => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
        // Decrement like count
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, likeCount: Math.max(0, (r.likeCount || 0) - 1) }
            : r
        ));
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

  const toggleComments = async (reviewId: string) => {
    if (expandedComments.has(reviewId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    } else {
      // Load comments if not already loaded
      if (!reviewComments[reviewId]) {
        const comments = await getReviewCommentsAction(reviewId);
        setReviewComments(prev => ({
          ...prev,
          [reviewId]: comments,
        }));
      }
      setExpandedComments(prev => new Set([...prev, reviewId]));
    }
  };

  const handleCreateComment = async (reviewId: string) => {
    const text = newCommentText[reviewId]?.trim();
    if (!text) return;

    console.log('📝 Creating comment:', { reviewId, text });
    const result = await createCommentAction(reviewId, text);
    console.log('📤 Comment result:', result);
    
    if (result.success) {
      setNewCommentText(prev => ({
        ...prev,
        [reviewId]: '',
      }));
      // Refresh comments
      const comments = await getReviewCommentsAction(reviewId);
      console.log('📥 Refreshed comments:', comments);
      setReviewComments(prev => ({
        ...prev,
        [reviewId]: comments,
      }));
    } else {
      console.error('❌ Error creating comment:', result.error);
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

              <Button variant="ghost" size="sm" onClick={() => toggleComments(review.id)}>
                <MessageCircle className="h-4 w-4" />
                <span className="ml-1 text-xs">Comments</span>
              </Button>
            </div>

            {/* Comments Section */}
            {expandedComments.has(review.id) && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Comment Input */}
                {currentUserId && (
                  <div className="space-y-2">
                    <textarea
                      value={newCommentText[review.id] || ''}
                      onChange={(e) => setNewCommentText(prev => ({
                        ...prev,
                        [review.id]: e.target.value,
                      }))}
                      placeholder="Write a comment..."
                      className="w-full min-h-[80px] p-2 text-sm border rounded-md bg-background"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleCreateComment(review.id)}
                        disabled={!newCommentText[review.id]?.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {reviewComments[review.id] ? (
                  <CommentSection 
                    comments={reviewComments[review.id]} 
                    reviewId={review.id}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Loading comments...</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
