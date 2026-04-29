import { useEffect, useState } from "react";
import { Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { CustomerHeader } from "./CustomerHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function CustomerLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [restaurantName, setRestaurantName] = useState("Verde Kitchen");

  useEffect(() => {
    supabase
      .from("restaurant_settings")
      .select("name")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setRestaurantName(data.name);
      });
  }, []);

  // Smart routing: staff users on a customer route get redirected to merchant
  useEffect(() => {
    if (loading) return;
    if ((role === "admin" || role === "employee") && !pathname.startsWith("/merchant")) {
      navigate({ to: "/merchant" });
    }
  }, [role, loading, pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader restaurantName={restaurantName} />
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {restaurantName}. Made fresh, daily.</p>
      </footer>
    </div>
  );
}
