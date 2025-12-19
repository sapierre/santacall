import { Heading, Preview, Text, Hr } from "@react-email/components";
import * as React from "react";

import { Layout } from "./_components/layout/layout";

import type { EmailTemplate, EmailVariables } from "../types";

type Props = EmailVariables[typeof EmailTemplate.CONTACT_REPLY];

export const ContactReply = async (props: Props) => {
  const { name, originalMessage, reply } = props;

  return (
    <Layout>
      <Preview>Reply from SantaCall Support</Preview>
      <Heading className="leading-tight tracking-tight">
        Hi {name},
      </Heading>

      <Text className="text-base leading-relaxed">
        Thank you for reaching out to SantaCall! Here's our response to your message:
      </Text>

      <div className="rounded-lg bg-green-50 p-4 my-4">
        <Text className="text-base leading-relaxed whitespace-pre-wrap">
          {reply}
        </Text>
      </div>

      <Hr className="my-6" />

      <Text className="text-sm text-gray-500">
        <strong>Your original message:</strong>
      </Text>
      <Text className="text-sm text-gray-500 italic">
        {originalMessage}
      </Text>

      <Hr className="my-6" />

      <Text className="text-base leading-relaxed">
        If you have any more questions, feel free to reply to this email.
      </Text>

      <Text className="text-base leading-relaxed">
        Happy holidays!
        <br />
        The SantaCall Team
      </Text>
    </Layout>
  );
};

ContactReply.subject = "Reply from SantaCall Support";

ContactReply.PreviewProps = {
  name: "John",
  originalMessage: "I have a question about scheduling a Santa call.",
  reply: "Thank you for your question! You can schedule a Santa call up to 7 days in advance between 4-8pm in your timezone. Just visit our website and click 'Book Now' to get started!",
};

export default ContactReply;
