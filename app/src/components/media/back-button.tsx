"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => router.back()}
      className="gap-2 mb-4 hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
