"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Link as LinkIcon, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkAvailabilityAction } from "@/app/actions";
import type { ContentAvailabilityInput, ContentAvailabilityOutput, MediaItem } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      ) : (
        "Check Availability"
      )}
    </Button>
  );
}

export function AvailabilityChecker({ media }: { media: Pick<MediaItem, 'id' |'title' | 'type' | 'year'> }) {
  const initialState: ContentAvailabilityOutput = { availability: [] };
  const [state, formAction] = useActionState(checkAvailabilityAction, initialState);
  const [wasChecked, setWasChecked] = useState(false);

  const handleFormAction = (formData: FormData) => {
    setWasChecked(true);
    const input: ContentAvailabilityInput = {
        id: formData.get('id') as string,
        title: formData.get('title') as string,
        type: formData.get('type') as 'book' | 'movie' | 'tv',
        year: Number(formData.get('year')) || undefined
    };
    formAction(input);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleFormAction} className="space-y-4">
          <input type="hidden" name="id" value={media.id} />
          <input type="hidden" name="title" value={media.title} />
          <input type="hidden" name="type" value={media.type} />
          <input type="hidden" name="year" value={media.year} />
          
          {wasChecked && state.availability.length > 0 && !state.error && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Available on:</p>
              <ul className="list-disc list-inside space-y-1">
                {state.availability.map((platform) => (
                  <li key={platform.platform}>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary underline-offset-4 hover:underline"
                    >
                      {platform.platform}
                      <LinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {wasChecked && state.availability.length === 0 && !state.error &&(
             <p className="text-sm text-muted-foreground">
                Could not find any available platforms at this time.
             </p>
          )}

          {wasChecked && state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
