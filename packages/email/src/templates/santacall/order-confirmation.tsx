import { Heading, Preview, Text } from "@react-email/components";
import * as React from "react";

import { getOrigin } from "@turbostarter/shared/utils";

import { Button } from "../_components/button";
import { Layout } from "../_components/layout/layout";

import type { CommonEmailProps } from "../../types";

interface Props extends CommonEmailProps {
  customerName: string;
  childName: string;
  orderNumber: string;
  orderType: "video" | "call";
  amountPaid: string; // Formatted amount (e.g., "$14.99")
  scheduledAt?: string; // For calls only - formatted date/time
  timezone?: string; // For calls only
  orderUrl: string;
}

export const SantaCallOrderConfirmation = ({
  customerName,
  childName,
  orderNumber,
  orderType,
  amountPaid,
  scheduledAt,
  timezone,
  orderUrl,
  locale,
}: Props) => {
  const origin = getOrigin(orderUrl);
  const isCall = orderType === "call";

  return (
    <Layout origin={origin} locale={locale}>
      <Preview>
        Thank you for your order! {isCall ? "Santa call" : "Santa video"} for {childName} is being prepared.
      </Preview>
      <Heading className="leading-tight tracking-tight">
        Order Confirmed!
      </Heading>

      <Text>
        Ho ho ho, {customerName}!
      </Text>

      <Text>
        Thank you for your order! We&apos;ve received your payment and the elves
        at the North Pole are getting everything ready.
      </Text>

      <Text className="bg-muted rounded-lg p-4">
        <strong>Order Details:</strong>
        <br />
        Order Number: {orderNumber}
        <br />
        Product: {isCall ? "Live Santa Call" : "Personalized Santa Video"} for {childName}
        <br />
        Amount Paid: {amountPaid}
        {isCall && scheduledAt && (
          <>
            <br />
            Scheduled: {scheduledAt} ({timezone})
          </>
        )}
      </Text>

      <Text>
        {isCall
          ? "We'll send you another email with your call link once everything is set up. Make sure to join on time!"
          : "We'll send you another email as soon as your personalized Santa video is ready. This usually takes 10-30 minutes."}
      </Text>

      <Text>
        You can check your order status anytime:
      </Text>

      <Button href={orderUrl}>View Order Status</Button>

      <Text className="text-muted-foreground text-sm">
        If you have any questions, please reply to this email or contact our
        support team.
      </Text>

      <Text className="text-muted-foreground text-sm">
        Thank you for choosing SantaCall! We hope this brings joy and magic to
        your holiday season.
      </Text>

      <Text className="text-muted-foreground text-sm">
        Merry Christmas!
        <br />
        - The SantaCall Team
      </Text>
    </Layout>
  );
};

SantaCallOrderConfirmation.subject = "Your SantaCall Order is Confirmed!";

SantaCallOrderConfirmation.PreviewProps = {
  customerName: "Jane",
  childName: "Tommy",
  orderNumber: "SC-ABC12345",
  orderType: "video" as const,
  amountPaid: "$14.99",
  orderUrl: "http://localhost:3000/order/SC-ABC12345?token=xyz",
  locale: "en",
};

export default SantaCallOrderConfirmation;
