import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";
import { createSearchParamsCache } from "nuqs/server";
import { Suspense } from "react";

import { getConversationsResponseSchema } from "@turbostarter/api/schema";
import { handle } from "@turbostarter/api/utils";
import { pickBy } from "@turbostarter/shared/utils";
import { DataTableSkeleton } from "@turbostarter/ui-web/data-table/data-table-skeleton";

import { api } from "~/lib/api/server";
import { getMetadata } from "~/lib/metadata";
import { ConversationsDataTable } from "~/modules/admin/santacall/calls/data-table/conversations-data-table";
import { getSortingStateParser } from "~/modules/common/hooks/use-data-table/common";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";

// Conversation statuses (mirrored from db/schema)
const CONVERSATION_STATUSES = [
  "scheduled",
  "active",
  "completed",
  "missed",
  "cancelled",
] as const;

export const generateMetadata = getMetadata({
  title: "SantaCall Live Calls",
  description: "Monitor scheduled and completed Santa calls",
});

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser().withDefault([{ id: "scheduledAt", desc: false }]),
  status: parseAsArrayOf(
    parseAsStringEnum<(typeof CONVERSATION_STATUSES)[number]>([...CONVERSATION_STATUSES]),
  ),
  scheduledAt: parseAsArrayOf(parseAsInteger),
});

export default async function SantaCallCallsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { page, perPage, sort, ...rest } =
    searchParamsCache.parse(searchParams);

  const filters = pickBy(rest, Boolean);

  const promise = handle(api.santacall.admin.conversations.$get, {
    schema: getConversationsResponseSchema,
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
          <DashboardHeaderTitle>Live Calls</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            Monitor scheduled and completed Santa video calls
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={9}
            filterCount={2}
            cellWidths={["8rem", "6rem", "8rem", "12rem", "10rem", "5rem", "5rem", "5rem", "3rem"]}
            shrinkZero
          />
        }
      >
        <ConversationsDataTable promise={promise} perPage={perPage} />
      </Suspense>
    </>
  );
}
