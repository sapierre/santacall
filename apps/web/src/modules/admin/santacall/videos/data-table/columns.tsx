"use client";

import { useTranslation } from "@turbostarter/i18n";
import { Badge } from "@turbostarter/ui-web/badge";
import { Button } from "@turbostarter/ui-web/button";
import { DataTableColumnHeader } from "@turbostarter/ui-web/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@turbostarter/ui-web/dropdown-menu";
import { Icons } from "@turbostarter/ui-web/icons";

import { pathsConfig } from "~/config/paths";
import { TurboLink } from "~/modules/common/turbo-link";

import type { ColumnDef } from "@tanstack/react-table";
import type { GetVideoJobsResponse } from "@turbostarter/api/schema";

type VideoJob = GetVideoJobsResponse["data"][number];

const VIDEO_STATUS_VARIANTS: Record<
  VideoJob["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  queued: "outline",
  processing: "secondary",
  completed: "default",
  failed: "destructive",
};

export const VideoJobActions = ({ videoJob }: { videoJob: VideoJob }) => {
  const { t } = useTranslation(["common"]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="sr-only">{t("actions")}</span>
          <Icons.Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <TurboLink href={pathsConfig.admin.santacall.orders.order(videoJob.orderId)}>
            View Order
          </TurboLink>
        </DropdownMenuItem>
        {videoJob.videoUrl && (
          <DropdownMenuItem asChild>
            <a href={videoJob.videoUrl} target="_blank" rel="noopener noreferrer">
              Watch Video
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const useColumns = (): ColumnDef<VideoJob>[] => {
  const { t, i18n } = useTranslation(["common"]);

  return [
    {
      id: "order.orderNumber",
      accessorKey: "order.orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order #" />
      ),
      cell: ({ row }) => (
        <TurboLink
          href={pathsConfig.admin.santacall.orders.order(row.original.orderId)}
          className="hover:text-primary font-mono font-medium underline underline-offset-4"
        >
          {row.original.order?.orderNumber ?? "-"}
        </TurboLink>
      ),
      enableHiding: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("status")} />
      ),
      cell: ({ row }) => (
        <Badge variant={VIDEO_STATUS_VARIANTS[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
      meta: {
        label: t("status"),
        variant: "multiSelect",
        options: [
          { label: "Queued", value: "queued" },
          { label: "Processing", value: "processing" },
          { label: "Completed", value: "completed" },
          { label: "Failed", value: "failed" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "order.childName",
      accessorKey: "order.childName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Child" />
      ),
      cell: ({ row }) => (
        <span>{row.original.order?.childName ?? "-"}</span>
      ),
    },
    {
      id: "order.customerEmail",
      accessorKey: "order.customerEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.order?.customerEmail ?? "-"}
        </span>
      ),
    },
    {
      id: "tavusVideoId",
      accessorKey: "tavusVideoId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tavus ID" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.tavusVideoId?.slice(0, 12) ?? "-"}...
        </span>
      ),
    },
    {
      id: "retryCount",
      accessorKey: "retryCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Retries" />
      ),
      cell: ({ row }) => (
        <span>{row.original.retryCount}</span>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("createdAt")} />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.createdAt.toLocaleDateString(i18n.language)}
        </div>
      ),
      meta: {
        label: t("createdAt"),
        variant: "dateRange",
      },
      enableColumnFilter: true,
    },
    {
      id: "completedAt",
      accessorKey: "completedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Completed" />
      ),
      cell: ({ row }) => {
        if (!row.original.completedAt) return <span>-</span>;
        return (
          <div className="text-sm">
            {row.original.completedAt.toLocaleDateString(i18n.language)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="ml-auto w-fit">
          <VideoJobActions videoJob={row.original} />
        </div>
      ),
      enableHiding: false,
    },
  ];
};
