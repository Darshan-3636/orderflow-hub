import { useEffect, useState } from "react";
import { Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { CustomerHeader } from "./CustomerHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type RestaurantSettings = {
  name: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
};

export function CustomerLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: "Verde Kitchen",
    tagline: null,
    logo_url: null,
    banner_url: null,
  });

  useEffect(() => {
    supabase
      .from("restaurant_settings")
      .select("name, tagline, logo_url, banner_url")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({
            name: data.name ?? "Verde Kitchen",
            tagline: data.tagline ?? null,
            logo_url: data.logo_url ?? null,
            banner_url: data.banner_url ?? null,
          });
        }
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
      <CustomerHeader restaurantName={settings.name} logoUrl={settings.logo_url} />
      <main>
        <Outlet context={{ settings }} />
      </main>
      <footer className="mt-16 border-t border-border/60 bg-gradient-warm">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-6 py-12 sm:px-10 md:grid-cols-3">
          <div>
            <h3 className="font-display text-2xl font-bold">{settings.name}</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Honest food, made fresh daily with seasonal ingredients from local growers.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Hours</h4>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex justify-between"><span>Mon – Fri</span><span className="font-medium">11:00 – 22:00</span></li>
              <li className="flex justify-between"><span>Sat – Sun</span><span className="font-medium">10:00 – 23:00</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Visit us</h4>
            <p className="mt-3 text-sm">Pickup orders only.<br />Skip the line — order ahead.</p>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings.name}. Made fresh, daily.
        </div>
      </footer>
    </div>
  );
}
