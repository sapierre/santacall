import { Heading, Preview, Text } from "@react-email/components";
import * as React from "react";

import { getOrigin } from "@turbostarter/shared/utils";

import { Button } from "../_components/button";
import { Layout } from "../_components/layout/layout";

import type { CommonEmailProps } from "../../types";

interface Props extends CommonEmailProps {
  customerName: string;
  childName: string;
  viewUrl: string;
  orderType: "video" | "call";
}

export const SantaCallLinkRegenerated = ({
  customerName,
  childName,
  viewUrl,
  orderType,
  locale,
}: Props) => {
  const origin = getOrigin(viewUrl);

  return (
    <Layout origin={origin} locale={locale}>
      <Preview>
        Your SantaCall {orderType === "video" ? "video" : "call"} link has been
        regenerated!
      </Preview>
      <Heading className="leading-tight tracking-tight">
        New Access Link for Your SantaCall {orderType === "video" ? "Video" : "Call"}
      </Heading>

      <Text>
        Ho ho ho, {customerName}!
      </Text>

      <Text>
        We&apos;ve generated a new access link for {childName}&apos;s special
        Santa {orderType === "video" ? "video" : "call"}. Your previous link has been
        deactivated for security.
      </Text>

      <Text>
        Click the button below to access your {orderType === "video" ? "video" : "call"}:
      </Text>

      <Button href={viewUrl}>
        {orderType === "video" ? "Watch Santa's Video" : "Join Santa Call"}
      </Button>

      <Text className="text-muted-foreground text-sm">
        This is a new unique link to your order. Please use this link going
        forward. The previous link will no longer work.
      </Text>

      {orderType === "video" ? (
        <Text className="text-muted-foreground text-sm">
          You can share this link with family members who want to see{" "}
          {childName}&apos;s reaction!
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm">
          If you have any questions or need to reschedule, please contact our
          support team.
        </Text>
      )}

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

SantaCallLinkRegenerated.subject = "New Access Link for Your SantaCall";

SantaCallLinkRegenerated.PreviewProps = {
  customerName: "Jane",
  childName: "Tommy",
  viewUrl: "http://localhost:3000/order/SC-ABC123?token=xyz",
  orderType: "video" as const,
  locale: "en",
};

export default SantaCallLinkRegenerated;
