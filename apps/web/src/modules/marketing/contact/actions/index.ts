"use server";

import env from "env.config";

import { santacallContact } from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";
import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";
import { getTranslation } from "@turbostarter/i18n/server";

import type { ContactFormPayload } from "../utils/schema";

export const sendContactForm = async (data: ContactFormPayload) => {
  try {
    // Save to database
    await db.insert(santacallContact).values({
      name: data.name,
      email: data.email,
      message: data.message,
      status: "new",
    });

    // Also send email notification to admin
    await sendEmail({
      to: env.CONTACT_EMAIL,
      template: EmailTemplate.CONTACT_FORM,
      variables: data,
    });
    return { error: null };
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message };
    }

    const { t } = await getTranslation({ ns: "common" });
    return { error: t("error.general") };
  }
};
