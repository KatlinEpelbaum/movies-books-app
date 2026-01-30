import Link from 'next/link';
import { BookHeart } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AuthForm from '@/components/auth/auth-form';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2 font-headline text-2xl font-bold">
              <BookHeart className="h-8 w-8 text-primary" />
              <span className="font-headline">Lune</span>
            </div>
          </div>
          <CardTitle className="font-headline text-2xl">Welcome</CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
}
