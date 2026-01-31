'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createReviewAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export function ReviewForm({ mediaId, onReviewAdded }: { mediaId: string; onReviewAdded?: () => void }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to leave a review');
      setIsAuthenticated(false);
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!text.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    const result = await createReviewAction(mediaId, rating, text);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Review posted successfully!');
      setRating(0);
      setText('');
      onReviewAdded?.();
      setTimeout(() => setSuccess(''), 3000);
    }

    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <Link href="/auth" className="text-blue-500 hover:underline">
                Sign in
              </Link>
              {' '}to leave a review
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Rating Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? 'fill-yellow-400 stroke-yellow-500'
                      : 'stroke-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Review</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder="Share your thoughts about this..."
            className="min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {text.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || rating === 0 || !text.trim()}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {loading ? 'Posting...' : 'Post Review'}
        </Button>
      </CardContent>
    </Card>
  );
}
