"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { updateUserProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  );
}

export function ProfileForm({ user }: { user: User }) {
  const initialState = { message: "", error: undefined };
  const [state, formAction] = useActionState(updateUserProfileAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const userName = user?.user_metadata?.full_name || '';
  const userBio = user?.user_metadata?.bio || '';
  const currentAvatar = user?.user_metadata?.avatar_url || null;
  useEffect(() => {
    if (!state) return;
    if (!state.message && !state.error) return;

    if (state.error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: state.error,
      });
    } else if (state.message) {
      toast({
        title: "Success",
        description: state.message,
      });
      if (formRef.current) {
        const avatarInput = formRef.current.querySelector('input[name="avatar"]') as HTMLInputElement;
        if (avatarInput) {
            avatarInput.value = "";
            setAvatarPreview(null);
        }
      }
    }
  }, [state, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form ref={formRef} action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" defaultValue={userName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us a little about yourself"
              defaultValue={userBio}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar</Label>
            <div className="space-y-4">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-border shadow-md flex items-center justify-center">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : currentAvatar ? (
                    <img 
                      src={currentAvatar} 
                      alt="Current avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm text-center px-4">No image selected</div>
                  )}
                </div>
              </div>

              {/* File Input */}
              <Input 
                id="avatar" 
                name="avatar" 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">Upload a new profile picture (max 2MB). The image will be cropped to fit the circular frame.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
