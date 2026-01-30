import { getTrendingBooks } from "@/lib/media-api";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingBooksContent } from "./trending-books-client";

export default async function TrendingBooksPage() {
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

  const trendingBooks = await getTrendingBooks();
  const trendingBooksWithStatus = trendingBooks.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trending Books</h1>
          <p className="text-muted-foreground mt-2">
            Popular books this week from Open Library
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <TrendingBooksContent items={trendingBooksWithStatus} />
    </div>
  );
}
