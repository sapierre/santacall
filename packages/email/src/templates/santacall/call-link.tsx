import { Heading, Preview, Text } from "@react-email/components";
import * as React from "react";

import { getOrigin } from "@turbostarter/shared/utils";

import { Button } from "../_components/button";
import { Layout } from "../_components/layout/layout";

import type { CommonEmailProps } from "../../types";

interface Props extends CommonEmailProps {
  customerName: string;
  childName: string;
  joinUrl: string;
  scheduledAt: string; // Formatted date/time string
  timezone: string;
}

export const SantaCallCallLink = ({
  customerName,
  childName,
  joinUrl,
  scheduledAt,
  timezone,
  locale,
}: Props) => {
  const origin = getOrigin(joinUrl);

  return (
    <Layout origin={origin} locale={locale}>
      <Preview>
        Your Santa call for {childName} is scheduled! Here&apos;s your join link.
      </Preview>
      <Heading className="leading-tight tracking-tight">
        Your Santa Call is Scheduled!
      </Heading>

      <Text>
        Ho ho ho, {customerName}!
      </Text>

      <Text>
        Great news from the North Pole! Santa has cleared his busy schedule and
        is ready to have a special video call with {childName}!
      </Text>

      <Text className="font-semibold">
        Scheduled Time: {scheduledAt} ({timezone})
      </Text>

      <Text>
        When it&apos;s time for the call, click the button below to join:
      </Text>

      <Button href={joinUrl}>Join Santa Call</Button>

      <Text className="text-muted-foreground text-sm">
        <strong>Tips for a magical experience:</strong>
      </Text>
      <Text className="text-muted-foreground text-sm">
        - Make sure {childName} is nearby when the call starts
        <br />
        - Test your camera and microphone beforehand
        <br />
        - Find a quiet spot with good lighting
        <br />
        - Have fun and enjoy the magic!
      </Text>

      <Text className="text-muted-foreground text-sm">
        The call will last approximately 5 minutes. If you need to reschedule,
        please contact our support team.
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

SantaCallCallLink.subject = "Your Santa Call is Scheduled!";

SantaCallCallLink.PreviewProps = {
  customerName: "Jane",
  childName: "Tommy",
  joinUrl: "http://localhost:3000/order/SC-ABC123?token=xyz",
  scheduledAt: "December 20, 2024 at 5:00 PM",
  timezone: "America/New_York",
  locale: "en",
};

export default SantaCallCallLink;
