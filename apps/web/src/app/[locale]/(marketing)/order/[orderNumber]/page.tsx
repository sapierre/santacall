import { Suspense } from "react";

import { Icons } from "@turbostarter/ui-web/icons";

import { getMetadata } from "~/lib/metadata";
import { OrderPageContent } from "~/modules/santacall/order/order-page";
import {
  Section,
  SectionHeader,
  SectionTitle,
} from "~/modules/marketing/layout/section";

export const generateMetadata = getMetadata({
  title: "Your Santa Order",
  description: "View your personalized Santa experience.",
});

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string; status?: string }>;
}

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { orderNumber } = await params;
  const { token, status } = await searchParams;

  return (
    <Section>
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Icons.Loader2 className="text-primary size-8 animate-spin" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        }
      >
        <OrderPageContent
          orderNumber={orderNumber}
          token={token}
          status={status}
        />
      </Suspense>
    </Section>
  );
}
