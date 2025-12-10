import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";
import { createSearchParamsCache } from "nuqs/server";
import { Suspense } from "react";

import { getVideoJobsResponseSchema } from "@turbostarter/api/schema";
import { handle } from "@turbostarter/api/utils";
import { pickBy } from "@turbostarter/shared/utils";
import { DataTableSkeleton } from "@turbostarter/ui-web/data-table/data-table-skeleton";

import { api } from "~/lib/api/server";
import { getMetadata } from "~/lib/metadata";
import { VideoJobsDataTable } from "~/modules/admin/santacall/videos/data-table/video-jobs-data-table";
import { getSortingStateParser } from "~/modules/common/hooks/use-data-table/common";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";

// Video job statuses (mirrored from db/schema)
const VIDEO_JOB_STATUSES = ["queued", "processing", "completed", "failed"] as const;

export const generateMetadata = getMetadata({
  title: "SantaCall Video Jobs",
  description: "Monitor video generation jobs",
});

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser().withDefault([{ id: "createdAt", desc: true }]),
  status: parseAsArrayOf(
    parseAsStringEnum<(typeof VIDEO_JOB_STATUSES)[number]>([...VIDEO_JOB_STATUSES]),
  ),
  createdAt: parseAsArrayOf(parseAsInteger),
});

export default async function SantaCallVideosPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { page, perPage, sort, ...rest } =
    searchParamsCache.parse(searchParams);

  const filters = pickBy(rest, Boolean);

  const promise = handle(api.santacall.admin["video-jobs"].$get, {
    schema: getVideoJobsResponseSchema,
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
          <DashboardHeaderTitle>Video Jobs</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            Monitor video generation status and progress
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            filterCount={2}
            cellWidths={["8rem", "6rem", "8rem", "12rem", "8rem", "4rem", "8rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <VideoJobsDataTable promise={promise} perPage={perPage} />
      </Suspense>
    </>
  );
}
