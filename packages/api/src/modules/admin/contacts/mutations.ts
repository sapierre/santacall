import { eq } from "@turbostarter/db";
import { santacallContact } from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";
import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";

import type { UpdateContactInput, ReplyContactInput } from "../../../schema";

export const updateContactStatus = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateContactInput;
}) => {
  const [updated] = await db
    .update(santacallContact)
    .set({
      status: data.status,
    })
    .where(eq(santacallContact.id, id))
    .returning();

  return updated;
};

export const replyToContact = async ({
  id,
  data,
  adminUserId,
}: {
  id: string;
  data: ReplyContactInput;
  adminUserId: string;
}) => {
  // Get the contact first
  const [contact] = await db
    .select()
    .from(santacallContact)
    .where(eq(santacallContact.id, id))
    .limit(1);

  if (!contact) {
    throw new Error("Contact not found");
  }

  // Send reply email
  await sendEmail({
    to: contact.email,
    template: EmailTemplate.CONTACT_REPLY,
    variables: {
      name: contact.name,
      originalMessage: contact.message,
      reply: data.reply,
    },
  });

  // Update the contact record
  const [updated] = await db
    .update(santacallContact)
    .set({
      status: "replied",
      adminReply: data.reply,
      repliedAt: new Date(),
      repliedBy: adminUserId,
    })
    .where(eq(santacallContact.id, id))
    .returning();

  return updated;
};

export const deleteContact = async ({ id }: { id: string }) => {
  const [deleted] = await db
    .delete(santacallContact)
    .where(eq(santacallContact.id, id))
    .returning();

  return deleted;
};
