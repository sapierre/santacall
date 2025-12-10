"use client";

import { use } from "react";

import { DataTable } from "@turbostarter/ui-web/data-table/data-table";
import { DataTableToolbar } from "@turbostarter/ui-web/data-table/data-table-toolbar";

import { useDataTable } from "~/modules/common/hooks/use-data-table";

import { useColumns } from "./columns";

import type { GetVideoJobsResponse } from "@turbostarter/api/schema";

interface VideoJobsDataTableProps {
  readonly promise: Promise<Awaited<GetVideoJobsResponse>>;
  readonly perPage: number;
}

export const VideoJobsDataTable = ({
  promise,
  perPage,
}: VideoJobsDataTableProps) => {
  const columns = useColumns();
  const { data, total } = use(promise);

  const { table } = useDataTable({
    persistance: "searchParams",
    data,
    columns,
    pageCount: Math.ceil(total / perPage),
    initialState: {
      sorting: [
        {
          id: "createdAt",
          desc: true,
        },
      ],
    },
    shallow: false,
    clearOnDefault: true,
    enableRowSelection: false,
  });

  return (
    <div className="flex w-full flex-col gap-2">
      <DataTableToolbar table={table} />
      <DataTable table={table} />
    </div>
  );
};
