import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { createSearchParamsCache } from "nuqs/server";
import { Suspense } from "react";

import {
  CONTACT_STATUSES,
  getContactsResponseSchema,
} from "@turbostarter/api/schema";
import { handle } from "@turbostarter/api/utils";
import { pickBy } from "@turbostarter/shared/utils";
import { DataTableSkeleton } from "@turbostarter/ui-web/data-table/data-table-skeleton";

import { api } from "~/lib/api/server";
import { getMetadata } from "~/lib/metadata";
import { ContactsDataTable } from "~/modules/admin/santacall/contacts/data-table/contacts-data-table";
import { getSortingStateParser } from "~/modules/common/hooks/use-data-table/common";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";

export const generateMetadata = getMetadata({
  title: "Contact Messages",
  description: "View and respond to contact form submissions",
});

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser().withDefault([{ id: "createdAt", desc: true }]),
  q: parseAsString,
  status: parseAsArrayOf(
    parseAsStringEnum<(typeof CONTACT_STATUSES)[number]>([...CONTACT_STATUSES]),
  ),
  createdAt: parseAsArrayOf(parseAsInteger),
});

export default async function ContactsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { page, perPage, sort, ...rest } =
    searchParamsCache.parse(searchParams);

  const filters = pickBy(rest, Boolean);

  const promise = handle(api.admin.contacts.$get, {
    schema: getContactsResponseSchema,
  })({
    query: {
      ...filters,
      page: page.toString(),
      perPage: perPage.toString(),
      sort: JSON.stringify(sort),
    },
  });

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>Contact Messages</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            View and respond to contact form submissions
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            filterCount={2}
            cellWidths={["12rem", "6rem", "20rem", "8rem", "4rem"]}
            shrinkZero
          />
        }
      >
        <ContactsDataTable promise={promise} perPage={perPage} />
      </Suspense>
    </>
  );
}
