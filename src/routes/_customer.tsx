import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CustomerLayout } from "@/components/customer/CustomerLayout";

export const Route = createFileRoute("/_customer")({
  component: () => <CustomerLayout />,
});
