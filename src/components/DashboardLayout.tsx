import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { roleLabel } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

const titles: Record<string, string> = {
  "/": "Tổng quan",
  "/projects": "Quản lý dự án",
  "/tasks": "Quản lý công việc",
  "/documents": "Tài liệu hệ thống",
  "/users": "Quản lý người dùng",
  "/account": "Tài khoản cá nhân",
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const init = useStore((s) => s.init);
  const initialized = useStore((s) => s.initialized);
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);

  useEffect(() => { void init(); }, [init]);

  // Wait for session check before deciding to redirect
  const [sessionChecked, setSessionChecked] = (require("react") as typeof import("react")).useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(() => setSessionChecked(true));
  }, []);

  if (!sessionChecked || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  const baseTitle = titles[location.pathname] || (location.pathname.startsWith("/projects/") ? "Chi tiết dự án" : "OneBS PMS");
  const initials = currentUser.name.split(" ").slice(-2).map((n) => n[0]).join("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur px-4 md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-semibold leading-none">{baseTitle}</h1>
                <p className="text-xs text-muted-foreground mt-1">Công ty Cổ phần OneBS</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{roleLabel[currentUser.role]}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>Tài khoản cá nhân</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account?tab=password")}>Đổi mật khẩu</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
