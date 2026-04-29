import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  Users,
  Star,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const adminItems = [
  { to: "/merchant", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/merchant/kds", label: "Cook Mode", icon: ChefHat },
  { to: "/merchant/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/merchant/orders", label: "Orders", icon: ClipboardList },
  { to: "/merchant/reviews", label: "Reviews", icon: Star },
  { to: "/merchant/employees", label: "Employees", icon: Users },
  { to: "/merchant/settings", label: "Settings", icon: Settings },
];

const employeeItems = [
  { to: "/merchant/kds", label: "Cook Mode", icon: ChefHat },
];

export function MerchantSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, signOut } = useAuth();
  const navigate = useNavigate();

  const items = role === "admin" ? adminItems : employeeItems;
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname === to || pathname.startsWith(to + "/"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/merchant" className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero shadow-soft">
            <span className="font-display text-base font-bold text-primary-foreground">V</span>
          </div>
          <span className="font-display text-base font-semibold">Merchant</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to, item.exact)}>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
