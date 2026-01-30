import { getTrendingShows } from "@/lib/media-api";
import { MediaCard } from "@/components/media/media-card";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TrendingShowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUserMediaData = user ? await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', user.id) : { data: null };

  const favouriteMap = new Map<string, boolean>();
  if (dbUserMediaData.data) {
    dbUserMediaData.data.forEach((item: any) => {
      if (item.is_favourite) {
        favouriteMap.set(item.media_id, true);
      }
    });
  }

  const trendingShows = await getTrendingShows();
  const trendingShowsWithStatus = trendingShows.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trending TV Shows</h1>
          <p className="text-muted-foreground mt-2">
            Showing {trendingShowsWithStatus.length} popular TV shows
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {trendingShowsWithStatus.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {trendingShowsWithStatus.slice(0, 20).map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No trending TV shows available.</p>
        </div>
      )}
    </div>
  );
}
