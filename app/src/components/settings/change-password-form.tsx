"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { changePasswordAction } from "@/app/actions";
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
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        "Change Password"
      )}
    </Button>
  );
}

export function ChangePasswordForm() {
  const initialState = { message: "", error: undefined };
  const [state, formAction] = useActionState(changePasswordAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (!state.message && !state.error) return;

    if (state.error) {
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: state.error,
      });
    } else if (state.message) {
      toast({
        title: "Success",
        description: state.message,
      });
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="current-password">Current Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>
            <Input 
              id="current-password" 
              name="currentPassword" 
              type="password" 
              placeholder="Enter your current password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              name="newPassword" 
              type="password" 
              placeholder="Enter your new password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              name="confirmPassword" 
              type="password" 
              placeholder="Confirm your new password"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
