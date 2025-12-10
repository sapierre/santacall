import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { createSearchParamsCache } from "nuqs/server";
import { Suspense } from "react";

import { getOrdersResponseSchema } from "@turbostarter/api/schema";
import { handle } from "@turbostarter/api/utils";
import { pickBy } from "@turbostarter/shared/utils";
import { DataTableSkeleton } from "@turbostarter/ui-web/data-table/data-table-skeleton";

import { api } from "~/lib/api/server";
import { getMetadata } from "~/lib/metadata";
import { OrdersDataTable } from "~/modules/admin/santacall/orders/data-table/orders-data-table";
import { getSortingStateParser } from "~/modules/common/hooks/use-data-table/common";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";

// Order types and statuses (mirrored from db/schema)
const ORDER_TYPES = ["video", "call"] as const;
const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "ready",
  "delivered",
  "failed",
  "refunded",
] as const;

export const generateMetadata = getMetadata({
  title: "SantaCall Orders",
  description: "Manage SantaCall video and call orders",
});

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser().withDefault([{ id: "createdAt", desc: true }]),
  q: parseAsString,
  orderType: parseAsArrayOf(
    parseAsStringEnum<(typeof ORDER_TYPES)[number]>([...ORDER_TYPES]),
  ),
  status: parseAsArrayOf(
    parseAsStringEnum<(typeof ORDER_STATUSES)[number]>([...ORDER_STATUSES]),
  ),
  createdAt: parseAsArrayOf(parseAsInteger),
  scheduledAt: parseAsArrayOf(parseAsInteger),
});

export default async function SantaCallOrdersPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { page, perPage, sort, ...rest } =
    searchParamsCache.parse(searchParams);

  const filters = pickBy(rest, Boolean);

  const promise = handle(api.santacall.admin.orders.$get, {
    schema: getOrdersResponseSchema,
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
          <DashboardHeaderTitle>SantaCall Orders</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            Manage all video and call orders
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            filterCount={4}
            cellWidths={["8rem", "5rem", "6rem", "12rem", "8rem", "6rem", "8rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <OrdersDataTable promise={promise} perPage={perPage} />
      </Suspense>
    </>
  );
}
