import { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MerchantSidebar } from "./MerchantSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function MerchantLayout() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    if (role !== "admin" && role !== "employee") {
      navigate({ to: "/" });
    }
  }, [user, role, loading, navigate]);

  if (loading || !user || (role !== "admin" && role !== "employee")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MerchantSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl">
            <SidebarTrigger className="shrink-0" />
            <span className="min-w-0 truncate font-display text-sm font-semibold capitalize text-muted-foreground sm:text-base">
              {role} workspace
            </span>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
