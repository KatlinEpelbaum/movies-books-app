"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart3,
  Heart,
  Home,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { signOut } from "@/app/auth/actions";
import { Button } from "../ui/button";
import { createClient } from "@/utils/supabase/client";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/list", icon: Heart, label: "Lists" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar({ user }: { user: User }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("username, display_name, profile_picture_url")
          .eq("id", user.id)
          .single();
        
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);
  
  const userName = profileData?.display_name || profileData?.username || user?.email?.split('@')[0];
  const userAvatarUrl = profileData?.profile_picture_url || user?.user_metadata?.avatar_url;
  const userUsername = profileData?.username || user?.email?.split('@')[0];

  const handleLogoutClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t space-y-2">
          <Link href={userUsername ? `/profile/${userUsername}` : "#"} className={userUsername ? "cursor-pointer" : "cursor-default"}>
            <div className="flex w-full items-center p-2 rounded-md hover:bg-accent transition-colors">
              <Avatar className="h-9 w-9">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                <AvatarFallback>{userName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-semibold">{userName}</p>
                  {userUsername && <p className="text-xs text-muted-foreground">@{userUsername}</p>}
                </div>
              )}
            </div>
          </Link>
          <form onSubmit={handleLogoutClick} className="w-full">
            <SidebarMenuButton asChild tooltip="Log Out" className="w-full">
              <button type="submit">
                <LogOut />
                <span>Log Out</span>
              </button>
            </SidebarMenuButton>
          </form>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>
              Log Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
