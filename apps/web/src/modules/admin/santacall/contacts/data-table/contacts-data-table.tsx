"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { DataTable } from "@turbostarter/ui-web/data-table/data-table";
import { DataTableToolbar } from "@turbostarter/ui-web/data-table/data-table-toolbar";

import { useDataTable } from "~/modules/common/hooks/use-data-table";

import { useColumns } from "./columns";

import type { Contact } from "@turbostarter/api/schema";

interface ContactsDataTableProps {
  readonly promise: Promise<{
    data: Contact[];
    total: number;
  }>;
  readonly perPage: number;
}

export const ContactsDataTable = ({
  promise,
  perPage,
}: ContactsDataTableProps) => {
  const router = useRouter();
  const { data, total } = use(promise);

  const handleUpdate = () => {
    router.refresh();
  };

  const columns = useColumns(handleUpdate);

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
      columnVisibility: {
        q: false,
      },
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
