import { Hono } from "hono";

import type { User } from "@turbostarter/auth";

import { validate } from "../../../middleware";
import {
  getContactsInputSchema,
  updateContactInputSchema,
  replyContactInputSchema,
} from "../../../schema";

import { deleteContact, updateContactStatus, replyToContact } from "./mutations";
import { getContacts, getContactById } from "./queries";

export const contactsRouter = new Hono<{ Variables: { user: User } }>()
  .get("/", validate("query", getContactsInputSchema), async (c) =>
    c.json(await getContacts(c.req.valid("query"))),
  )
  .get("/:id", async (c) => c.json(await getContactById(c.req.param("id"))))
  .patch("/:id", validate("json", updateContactInputSchema), async (c) =>
    c.json(
      await updateContactStatus({
        id: c.req.param("id"),
        data: c.req.valid("json"),
      }),
    ),
  )
  .post("/:id/reply", validate("json", replyContactInputSchema), async (c) => {
    return c.json(
      await replyToContact({
        id: c.req.param("id"),
        data: c.req.valid("json"),
        adminUserId: c.var.user.id,
      }),
    );
  })
  .delete("/:id", async (c) =>
    c.json(await deleteContact({ id: c.req.param("id") })),
  );
