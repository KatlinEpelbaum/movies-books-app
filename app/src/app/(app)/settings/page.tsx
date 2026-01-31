import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/server";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ProfileEditor } from "@/components/settings/profile-editor";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Fetch existing profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and profile settings.
        </p>
      </div>

      <ProfileEditor initialProfile={profile} user={user} />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Account</CardTitle>
          <CardDescription>
            Manage your account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} disabled />
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}