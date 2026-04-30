import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Info, ShoppingBag, User as UserIcon, LogOut, History, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { AuthDialog } from "@/components/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CustomerHeader({ restaurantName, logoUrl }: { restaurantName: string; logoUrl?: string | null }) {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4 rounded-full border border-border/60 bg-background/70 px-4 shadow-soft backdrop-blur-xl sm:px-6">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary shadow-soft transition-smooth group-hover:rotate-12">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${restaurantName} logo`} className="h-full w-full object-cover" />
                ) : (
                  <Leaf className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-extrabold tracking-tight">{restaurantName}</span>
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:inline">Fresh kitchen</span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                    pathname === n.to ? "bg-charcoal text-charcoal-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">

              <Button variant="soft" size="sm" onClick={() => navigate({ to: "/cart" })} className="relative">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shadow-soft">
                    {itemCount}
                  </span>
                )}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                      <UserIcon className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                      <History className="mr-2 h-4 w-4" /> Order history
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="charcoal" size="sm" onClick={() => setAuthOpen(true)}>
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
