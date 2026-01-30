import { MediaCard } from "@/components/media/media-card";
import type { MediaItem } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let wishlistItems: MediaItem[] = [];

  if (user) {
    const { data, error } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id)
      .eq('is_wishlisted', true);

    if (data) {
        wishlistItems = data.map((item: any) => ({
            id: item.media_items?.id || item.media_id,
            title: item.media_items?.title || 'Unknown',
            type: item.media_items?.type || 'book',
            coverImage: item.media_items?.cover_image,
            authorOrDirector: item.media_items?.author_or_director,
            year: item.media_items?.year,
            isWishlisted: true,
            description: '',
            genres: item.genres || [],
        }));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Your Wishlist</h1>
        <p className="text-muted-foreground">
          A collection of media you plan to enjoy.
        </p>
      </div>

      <section>
        {wishlistItems.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-center text-muted-foreground">
              Your wishlist is empty. Start exploring to add items!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {wishlistItems.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
