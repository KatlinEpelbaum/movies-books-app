import { createClient } from "@/utils/supabase/server";
import { MediaItem } from "@/lib/types";
import ListPageClient from "./list-client";

interface List {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  is_public?: boolean;
  created_at: string;
}

export default async function ListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let favourites: MediaItem[] = [];
  let lists: List[] = [];

  console.log('📋 List page - User:', user?.id);

  if (user) {
    // Fetch favourites
    const { data: favouriteData } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id)
      .eq('is_favourite', true);

    if (favouriteData) {
      favourites = favouriteData.map((item: any) => ({
        id: item.media_items?.id || item.media_id,
        title: item.media_items?.title || 'Unknown',
        type: item.media_items?.type || 'book',
        coverImage: item.media_items?.cover_image,
        authorOrDirector: item.media_items?.author_or_director,
        year: item.media_items?.year,
        isFavourite: true,
        description: '',
        genres: item.media_items?.genres || [],
      }));
    }

    // Fetch custom lists
    const { data: listData, error: listError } = await supabase
      .from('custom_lists')
      .select('id, name, emoji, description, is_public, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    console.log('📋 Lists query result:', { listData, listError });
    lists = listData || [];
  }

  console.log('📋 Final lists to send to client:', lists);
  return <ListPageClient initialFavourites={favourites} initialLists={lists} />;
}

