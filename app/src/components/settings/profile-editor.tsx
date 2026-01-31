'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Camera, Upload, Save, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/utils/supabase/client';
import { updateUserProfileAction } from '@/app/actions';

export function ProfileEditor({ initialProfile, user }: any) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: initialProfile?.username || user?.email?.split('@')[0] || '',
    display_name: initialProfile?.display_name || '',
    bio: initialProfile?.bio || '',
    profile_picture_url: initialProfile?.profile_picture_url || '',
    banner_url: initialProfile?.banner_url || '',
  });

  const [previewBanner, setPreviewBanner] = useState(initialProfile?.banner_url || '');
  const [previewAvatar, setPreviewAvatar] = useState(initialProfile?.profile_picture_url || '');

  const handleImageUpload = async (file: File, type: 'banner' | 'avatar') => {
    try {
      const supabase = await createClient();
      
      // Verify user is authenticated
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('You must be logged in to upload images');
        return;
      }

      // Sanitize filename - remove special characters and keep only safe ones
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
      
      const fileName = `${authUser.id}/${type}/${Date.now()}-${sanitizedName}`;
      const bucketName = type === 'banner' ? 'banner' : 'avatars';

      // Upload with proper auth context and options
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Upload failed');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_url: publicUrl }));
        setPreviewBanner(publicUrl);
      } else {
        setFormData(prev => ({ ...prev, profile_picture_url: publicUrl }));
        setPreviewAvatar(publicUrl);
      }

      setSuccess(`${type === 'banner' ? 'Banner' : 'Avatar'} uploaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${type}: ${err.message}`);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (!formData.username?.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('username', formData.username);
    formDataObj.append('display_name', formData.display_name);
    formDataObj.append('bio', formData.bio);
    formDataObj.append('profile_picture_url', formData.profile_picture_url);
    formDataObj.append('banner_url', formData.banner_url);

    startTransition(async () => {
      const result = await updateUserProfileAction(undefined, formDataObj);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800 flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Banner Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Banner</CardTitle>
          <CardDescription>Upload a banner image (recommended: 1200x300px)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 group">
            {previewBanner ? (
              <Image
                src={previewBanner}
                alt="Banner preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/60">
                No banner
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-center text-white">
                <Camera className="mx-auto h-8 w-8" />
                <p className="text-sm mt-1">Change banner</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Avatar and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>This is how others see your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted group">
              {previewAvatar ? (
                <Image
                  src={previewAvatar}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Camera className="h-8 w-8" />
                </div>
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-center text-white">
                  <Upload className="mx-auto h-6 w-6" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Your unique username (min 2 characters)"
              />
              <p className="text-xs text-muted-foreground">Your unique URL. Can be changed every 5 days</p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="How others see your name"
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground">
              {formData.display_name.length}/32 characters
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell people about yourself"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSaveProfile}
        disabled={isPending}
        size="lg"
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
