import dayjs from "dayjs";

import {
  and,
  count,
  desc,
  between,
  ilike,
  inArray,
  getOrderByFromSort,
} from "@turbostarter/db";
import { santacallContact } from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";

import type { GetContactsInput } from "../../../schema";

export const getContactsCount = async () =>
  db
    .select({ count: count() })
    .from(santacallContact)
    .then((res) => res[0]?.count ?? 0);

export const getNewContactsCount = async () =>
  db
    .select({ count: count() })
    .from(santacallContact)
    .where(inArray(santacallContact.status, ["new"]))
    .then((res) => res[0]?.count ?? 0);

export const getContacts = async (input: GetContactsInput) => {
  const offset = (input.page - 1) * input.perPage;

  const where = and(
    input.q ? ilike(santacallContact.email, `%${input.q}%`) : undefined,
    input.status ? inArray(santacallContact.status, input.status) : undefined,
    input.createdAt
      ? between(
          santacallContact.createdAt,
          dayjs(input.createdAt[0]).startOf("day").toDate(),
          dayjs(input.createdAt[1]).endOf("day").toDate(),
        )
      : undefined,
  );

  const orderBy = input.sort
    ? getOrderByFromSort({ sort: input.sort, defaultSchema: santacallContact })
    : [desc(santacallContact.createdAt)];

  return db.transaction(async (tx) => {
    const data = await db
      .select()
      .from(santacallContact)
      .where(where)
      .limit(input.perPage)
      .offset(offset)
      .orderBy(...orderBy);

    const total = await tx
      .select({ count: count() })
      .from(santacallContact)
      .where(where)
      .execute()
      .then((res) => res[0]?.count ?? 0);

    return {
      data,
      total,
    };
  });
};

export const getContactById = async (id: string) => {
  const result = await db
    .select()
    .from(santacallContact)
    .where(and(inArray(santacallContact.id, [id])))
    .limit(1);

  return result[0] ?? null;
};
