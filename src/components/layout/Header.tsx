"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Sparkles, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: "sales_rep" | "manager" | "admin";
  };
}

export function Header({ user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileName, setProfileName] = useState("Dhruv");
  const [profileEmail, setProfileEmail] = useState("aiwithdhruv@gmail.com");

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("profile_name");
    const savedEmail = localStorage.getItem("profile_email");
    if (savedName) setProfileName(savedName);
    if (savedEmail) setProfileEmail(savedEmail);

    // Listen for storage changes (when profile is updated in settings)
    const handleStorageChange = () => {
      const name = localStorage.getItem("profile_name");
      const email = localStorage.getItem("profile_email");
      if (name) setProfileName(name);
      if (email) setProfileEmail(email);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const defaultUser = {
    name: profileName,
    email: profileEmail,
    avatar: undefined as string | undefined,
    role: "sales_rep" as const,
  };

  const currentUser = user || defaultUser;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "manager":
        return <Badge className="bg-warningamber/20 text-warningamber">Manager</Badge>;
      default:
        return <Badge variant="secondary">Sales Rep</Badge>;
    }
  };

  return (
    <header className="fixed top-0 left-[72px] right-0 z-30 h-16 bg-graphite border-b border-gunmetal">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
            <Input
              type="text"
              placeholder="Search deals, calls, playbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue focus:ring-neonblue/20"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* AI Coach Button */}
          <Button className="bg-neonblue hover:bg-electricblue text-white gap-2 glow-blue">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI Coach</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-silver hover:text-platinum hover:bg-white/5"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-errorred rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-graphite border-gunmetal"
            >
              <DropdownMenuLabel className="text-platinum">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gunmetal" />
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">New call analysis ready</span>
                  <span className="text-xs text-mist">
                    Your call with Acme Corp has been analyzed
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Practice streak: 7 days!</span>
                  <span className="text-xs text-mist">Keep up the great work</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Deal update: TechStart</span>
                  <span className="text-xs text-mist">
                    Moved to negotiation stage
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-silver hover:text-platinum hover:bg-white/5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-neonblue text-white text-sm">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium text-platinum">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-graphite border-gunmetal"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-platinum">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-mist">{currentUser.email}</p>
                  <div className="pt-1">{getRoleBadge(currentUser.role)}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gunmetal" />
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                My Performance
              </DropdownMenuItem>
              <DropdownMenuItem className="text-silver hover:text-platinum hover:bg-onyx focus:bg-onyx focus:text-platinum cursor-pointer">
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gunmetal" />
              <DropdownMenuItem className="text-errorred hover:text-errorred hover:bg-errorred/10 focus:bg-errorred/10 focus:text-errorred cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
