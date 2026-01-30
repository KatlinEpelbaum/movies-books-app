import { createClient } from "@/utils/supabase/server";
import { MediaItem, MediaStatus } from "@/lib/types";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_CONFIG: Record<MediaStatus, { label: string; icon: string; description: string }> = {
  completed: { label: "Completed", icon: "✅", description: "Books, movies, and shows you've finished" },
  watching: { label: "In Progress", icon: "▶️", description: "Media you're currently enjoying" },
  plan_to_watch: { label: "Up Next", icon: "📋", description: "Media you want to enjoy next" },
  on_hold: { label: "On Hold", icon: "⏸️", description: "Media you've paused" },
  dropped: { label: "Dropped", icon: "❌", description: "Media you've stopped" },
};

interface StatusPageProps {
  params: Promise<{ status: MediaStatus }>;
}

export async function generateMetadata({ params }: StatusPageProps) {
  const { status } = await params;
  const config = STATUS_CONFIG[status];
  return {
    title: `${config?.label || 'Status'} - Movies Books App`,
    description: config?.description || 'View your media by status',
  };
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { status } = await params;
  const config = STATUS_CONFIG[status];
  
  if (!config) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-headline text-3xl font-bold">Not Found</h1>
          <p className="text-muted-foreground">This status doesn't exist.</p>
        </div>
        <Button asChild>
          <Link href="/list">Back to Lists</Link>
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let items: MediaItem[] = [];

  if (user) {
    const { data: statusData } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id)
      .eq('status', status);

    if (statusData) {
      items = statusData.map((item: any) => ({
        id: item.media_items?.id || item.media_id,
        title: item.media_items?.title || 'Unknown',
        type: item.media_items?.type || 'book',
        coverImage: item.media_items?.cover_image,
        authorOrDirector: item.media_items?.author_or_director,
        year: item.media_items?.year,
        isFavourite: item.is_favourite || false,
        userRating: item.rating,
        userStatus: status,
        description: '',
        genres: item.media_items?.genres || [],
      }));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="font-headline text-3xl font-bold">{config.label}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      <section>
        {items.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No media in this category yet.
              </p>
              <Button asChild>
                <Link href="/search">Start Exploring</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </section>

      <div className="text-sm text-muted-foreground">
        Total: {items.length} item{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
