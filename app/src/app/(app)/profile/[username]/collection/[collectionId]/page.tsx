import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { BackButton } from '@/components/media/back-button';
import { MediaCard } from '@/components/media/media-card';
import { Card, CardContent } from '@/components/ui/card';
import { getCollectionItemsAction } from '@/app/actions';

export default async function PublicCollectionPage({
  params,
}: {
  params: { username: string; collectionId: string };
}) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Fetch the collection details
  const { data: collection, error: collectionError } = await supabase
    .from('custom_lists')
    .select('id, name, emoji, description, is_public, user_id')
    .eq('id', resolvedParams.collectionId)
    .eq('is_public', true)
    .single();

  console.log('📚 Collection fetch:', { collectionError, collection, collectionId: resolvedParams.collectionId });

  if (collectionError || !collection) {
    console.error('❌ Collection not found or not public:', collectionError);
    notFound();
  }

  // Verify the collection belongs to the user with this username
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', resolvedParams.username.toLowerCase())
    .single();

  console.log('👤 User fetch:', { userError, username: resolvedParams.username, userId: user?.id, collectionUserId: collection.user_id });

  if (userError || !user || user.id !== collection.user_id) {
    console.error('❌ User not found or collection does not belong to user');
    notFound();
  }

  // Fetch collection items
  const items = await getCollectionItemsAction(resolvedParams.collectionId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackButton />

      {/* Collection Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{collection.emoji || '📌'}</div>
          <div className="flex-1">
            <h1 className="font-headline text-4xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-muted-foreground mt-2">{collection.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Items */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item: any) => (
            <div key={item.id} className="w-full">
              <MediaCard media={item} />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            This collection is empty
          </CardContent>
        </Card>
      )}
    </div>
  );
}
