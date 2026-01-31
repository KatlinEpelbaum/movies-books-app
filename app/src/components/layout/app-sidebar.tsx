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
  Sparkles,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { signOut } from "@/app/auth/actions";
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
      <Sidebar className="border-r border-slate-100 bg-white/50 backdrop-blur-xl">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
              <Sparkles className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-headline font-semibold tracking-tight text-xl">
                Lune<span className="text-rose-400">.</span>
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4">
          <SidebarMenu className="gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={`
                      relative flex h-12 items-center rounded-2xl px-4 transition-all duration-300
                      ${isActive 
                        ? "bg-slate-900 text-white shadow-md translate-x-1" 
                        : "text-slate-500 hover:bg-rose-50 hover:text-rose-500"
                      }
                    `}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isActive ? "text-rose-300" : ""}`} />
                      <span className="font-headline font-medium text-[15px] tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className={`
            flex items-center rounded-[2rem] bg-slate-50 p-2 transition-all
            ${isCollapsed ? "justify-center" : "justify-between border border-slate-100 p-3"}
          `}>
            <Link 
              href={userUsername ? `/profile/${userUsername}` : "#"} 
              className={`flex items-center gap-3 ${userUsername ? "cursor-pointer" : "cursor-default"}`}
            >
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                <AvatarFallback className="bg-rose-100 text-rose-500 font-headline">
                  {userName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <p className="text-sm font-headline font-semibold text-slate-900 leading-none mb-0.5">
                    {userName}
                  </p>
                  {userUsername && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      @{userUsername}
                    </p>
                  )}
                </div>
              )}
            </Link>
            
            {!isCollapsed && (
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="group flex h-9 w-9 items-center justify-center rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl">Take a break?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-light">
              Are you sure you want to sign out? Your curated collections will be waiting for you when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel className="rounded-2xl border-slate-100 px-6 font-medium">
              Stay here
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout}
              className="rounded-2xl bg-slate-900 px-6 hover:bg-rose-500 transition-colors"
            >
              Sign Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}