'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { followUserAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      if (user.id === targetUserId) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
      setIsLoading(false);
    };

    checkFollowStatus();
  }, [targetUserId]);

  const handleFollowClick = async () => {
    setIsLoading(true);
    const result = await followUserAction(targetUserId);

    if (result.success !== undefined) {
      setIsFollowing(result.following);
    }

    setIsLoading(false);
  };

  // Don't show button if it's the user's own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  if (!currentUserId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowClick}
      disabled={isLoading}
      variant={isFollowing ? 'default' : 'outline'}
    >
      {isFollowing ? (
        <>
          <Heart className="mr-2 h-4 w-4 fill-current" />
          Following
        </>
      ) : (
        <>
          <HeartOff className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
