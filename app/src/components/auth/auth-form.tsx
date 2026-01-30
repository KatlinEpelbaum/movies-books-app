"use client";

import { useState } from "react";
import { useActionState } from 'react';
import { useFormStatus } from "react-dom";
import { login, signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function AuthButton({ isSignUp }: { isSignUp: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full font-bold" disabled={pending}>
      {pending ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
    </Button>
  );
}

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [loginState, loginAction] = useActionState(login as any, null as any);
  const [signupState, signupAction] = useActionState(signup as any, null as any);

  const error = isSignUp ? signupState?.error : loginState?.error;
  const message = isSignUp ? signupState?.message : null;

  return (
    <div>
      <form action={isSignUp ? signupAction : loginAction}>
        <div className="grid gap-4">
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Your full name" required />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters.
              </p>
            )}
          </div>
          <AuthButton isSignUp={isSignUp} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          {message && <p className="text-muted-foreground text-sm">{message}</p>}
        </div>
      </form>
      <div className="mt-4 text-center text-sm">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
        <button 
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
          }} 
          className="underline"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
      {!isSignUp && (
        <div className="mt-2 text-center text-sm">
          <Link href="/auth/forgot-password" className="underline text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
      )}
    </div>
  );
}