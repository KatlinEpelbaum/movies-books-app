import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Star, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/media/back-button';
import { createClient } from '@/utils/supabase/server';
import { getUserProfileAction, getUserStatsAction, getUserPublicCollections } from '@/app/actions';
import { FollowButton } from '@/components/profile/follow-button';
import { ProfileReviews } from '@/components/profile/profile-reviews';

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const resolvedParams = await params;
  const profile = await getUserProfileAction(resolvedParams.username);

  if (!profile || !profile.is_public) {
    notFound();
  }

  const stats = await getUserStatsAction(profile.id);

  // Get reviews
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, media_id, rating, text, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get public collections
  const publicCollections = await getUserPublicCollections(profile.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackButton />

      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="relative -mt-24 px-4 md:px-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          {/* Avatar */}
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted">
            {profile.profile_picture_url && (
              <Image
                src={profile.profile_picture_url}
                alt={profile.display_name}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2 pb-4">
            <h1 className="font-headline text-3xl font-bold">{profile.display_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="max-w-md text-sm">{profile.bio}</p>}
          </div>

          {/* Follow Button */}
          <FollowButton targetUserId={profile.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">{stats.reviewCount}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" /> Reviews
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3 w-3" /> Avg Rating
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">{stats.totalHours}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Watch Hrs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">{stats.followerCount}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" /> Followers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold">Recent Reviews</h2>
        {reviews && reviews.length > 0 ? (
          <ProfileReviews reviews={reviews} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No reviews yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Public Collections Section */}
      {publicCollections && publicCollections.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-2xl font-bold">Public Collections</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {publicCollections.map((collection: any) => (
              <Link key={collection.id} href={`/profile/${resolvedParams.username}/collection/${collection.id}`}>
                <div className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg border p-4 bg-card h-full">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{collection.emoji || '📌'}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Public Collection
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
