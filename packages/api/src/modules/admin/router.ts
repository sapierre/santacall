import { Hono } from "hono";

import { enforceAdmin, enforceAuth } from "../../middleware";

import { contactsRouter } from "./contacts/router";
import { getContactsCount, getNewContactsCount } from "./contacts/queries";
import { getCustomersCount } from "./customers/queries";
import { customersRouter } from "./customers/router";
import { getOrganizationsCount } from "./organizations/queries";
import { organizationsRouter } from "./organizations/router";
import { getUsersCount } from "./users/queries";
import { usersRouter } from "./users/router";

export const adminRouter = new Hono()
  .use(enforceAuth)
  .use(enforceAdmin)
  .route("/users", usersRouter)
  .route("/organizations", organizationsRouter)
  .route("/customers", customersRouter)
  .route("/contacts", contactsRouter)
  .get("/summary", async (c) => {
    const [users, organizations, customers, contacts, newContacts] =
      await Promise.all([
        getUsersCount(),
        getOrganizationsCount(),
        getCustomersCount(),
        getContactsCount(),
        getNewContactsCount(),
      ]);

    return c.json({ users, organizations, customers, contacts, newContacts });
  });
