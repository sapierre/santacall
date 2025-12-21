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
}

export const SantaCallVideoReady = ({
  customerName,
  childName,
  viewUrl,
  locale,
}: Props) => {
  const origin = getOrigin(viewUrl);

  return (
    <Layout origin={origin} locale={locale}>
      <Preview>Ho ho ho! Your Santa video for {childName} is ready!</Preview>
      <Heading className="leading-tight tracking-tight">
        Your Santa Video is Ready!
      </Heading>

      <Text>Ho ho ho, {customerName}!</Text>

      <Text>
        Great news from the North Pole! Santa has finished recording a special
        personalized video message just for {childName}!
      </Text>

      <Text>Click the button below to watch the magical video:</Text>

      <Button href={viewUrl}>Watch Santa&apos;s Video</Button>

      <Text className="text-muted-foreground text-sm">
        This link is unique to your order. You can share it with family members
        who want to see {childName}&apos;s reaction!
      </Text>

      <Text className="text-muted-foreground text-sm">
        Thank you for choosing SantaCall! We hope this brings joy and magic to
        your holiday season.
      </Text>

      <Text className="text-muted-foreground text-sm">
        Merry Christmas!
        <br />- The SantaCall Team
      </Text>
    </Layout>
  );
};

SantaCallVideoReady.subject = "Your Santa Video is Ready!";

SantaCallVideoReady.PreviewProps = {
  customerName: "Jane",
  childName: "Tommy",
  viewUrl: "http://localhost:3000/order/SC-ABC123?token=xyz",
  locale: "en",
};

export default SantaCallVideoReady;
