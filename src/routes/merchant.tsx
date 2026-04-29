import { createFileRoute } from "@tanstack/react-router";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";

export const Route = createFileRoute("/merchant")({
  component: MerchantLayout,
});
