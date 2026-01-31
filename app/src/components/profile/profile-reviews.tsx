'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProfileReviews({ reviews }: { reviews: any[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Link key={review.id} href={`/media/${review.media_id}#review-${review.id}`}>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
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
              <p className="text-sm line-clamp-2">{review.text}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
