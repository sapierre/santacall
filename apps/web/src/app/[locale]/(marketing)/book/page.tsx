import { Suspense } from "react";

import { getMetadata } from "~/lib/metadata";
import { BookingPageContent } from "~/modules/santacall/booking/booking-page";
import {
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "~/modules/marketing/layout/section";

export const generateMetadata = getMetadata({
  title: "Book Your Santa Experience",
  description:
    "Create magical Christmas memories with a personalized Santa video or live video call from the North Pole.",
});

interface BookPageProps {
  searchParams: Promise<{ type?: string; canceled?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const orderType = params.type === "call" ? "call" : "video";
  const wasCanceled = params.canceled === "true";

  return (
    <Section>
      <SectionHeader>
        <SectionTitle as="h1">
          {orderType === "video"
            ? "Personalized Santa Video"
            : "Live Santa Video Call"}
        </SectionTitle>
        <SectionDescription>
          {orderType === "video"
            ? "Create a magical personalized video message from Santa Claus that your child will treasure forever."
            : "Schedule a live 3-minute video call with Santa Claus. Watch your child's face light up as they talk to the real Santa!"}
        </SectionDescription>
      </SectionHeader>

      {wasCanceled && (
        <div className="bg-destructive/10 text-destructive w-full max-w-2xl rounded-lg border border-destructive/20 p-4 text-center">
          Your payment was canceled. You can try again below.
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <BookingPageContent orderType={orderType} />
      </Suspense>
    </Section>
  );
}
