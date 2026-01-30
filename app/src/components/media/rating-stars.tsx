"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  isInteractive?: boolean;
  disabled?: boolean;
}

export function RatingStars({
  rating,
  onRatingChange,
  isInteractive = false,
  disabled = false,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (isInteractive && onRatingChange) {
      const newRating = starIndex + (isHalf ? 0.5 : 1);
      onRatingChange(newRating);
    }
  };

  const handleMouseMove = (starIndex: number, e: React.MouseEvent<SVGSVGElement>) => {
    if (!isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverRating(starIndex + (isHalf ? 0.5 : 1));
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        const displayRating = hoverRating || rating;
        const isFilled = starValue <= displayRating;
        const isHalfFilled = starValue - 0.5 === displayRating;

        return (
          <div key={i} className="relative">
            <Star
              className={cn(
                "h-6 w-6",
                isInteractive && !disabled ? "cursor-pointer" : "",
                isFilled || isHalfFilled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground"
              )}
              onMouseMove={isInteractive && !disabled ? (e) => handleMouseMove(i, e) : undefined}
              onMouseLeave={isInteractive && !disabled ? () => setHoverRating(0) : undefined}
              onClick={isInteractive && !disabled ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e as React.MouseEvent).clientX - rect.left;
                const isHalf = x < rect.width / 2;
                handleClick(i, isHalf);
              } : undefined}
            />
            {isHalfFilled && (
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
