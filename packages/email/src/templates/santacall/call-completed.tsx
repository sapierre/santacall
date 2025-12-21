import { Heading, Preview, Text } from "@react-email/components";
import * as React from "react";

import { Layout } from "../_components/layout/layout";

import type { CommonEmailProps } from "../../types";

interface Props extends CommonEmailProps {
  customerName: string;
  childName: string;
  orderNumber: string;
  durationMinutes: number;
}

export const SantaCallCallCompleted = ({
  customerName,
  childName,
  orderNumber,
  durationMinutes,
  locale,
}: Props) => {
  const origin = "https://santacall.co";

  return (
    <Layout origin={origin} locale={locale}>
      <Preview>
        {childName}&apos;s Santa call was magical! Thank you for using
        SantaCall.
      </Preview>
      <Heading className="leading-tight tracking-tight">
        What a Magical Call!
      </Heading>

      <Text>Ho ho ho, {customerName}!</Text>

      <Text>
        We hope {childName} had an absolutely magical time talking with Santa!
        The call lasted {durationMinutes}{" "}
        {durationMinutes === 1 ? "minute" : "minutes"} of pure Christmas magic.
      </Text>

      <Text className="bg-muted rounded-lg p-4">
        <strong>Call Summary:</strong>
        <br />
        Order Number: {orderNumber}
        <br />
        Child: {childName}
        <br />
        Duration: {durationMinutes}{" "}
        {durationMinutes === 1 ? "minute" : "minutes"}
      </Text>

      <Text>
        We&apos;d love to hear how it went! If you have a moment, consider
        sharing your experience with friends and family who might also want to
        bring some Christmas magic to their little ones.
      </Text>

      <Text className="text-muted-foreground text-sm">
        Thank you for choosing SantaCall! We hope we helped make this holiday
        season extra special.
      </Text>

      <Text className="text-muted-foreground text-sm">
        Merry Christmas and Happy Holidays!
        <br />- The SantaCall Team
      </Text>
    </Layout>
  );
};

SantaCallCallCompleted.subject = "What a Magical Santa Call!";

SantaCallCallCompleted.PreviewProps = {
  customerName: "Jane",
  childName: "Tommy",
  orderNumber: "SC-ABC12345",
  durationMinutes: 5,
  locale: "en",
};

export default SantaCallCallCompleted;
