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
import type { GetConversationsResponse } from "@turbostarter/api/schema";

type Conversation = GetConversationsResponse["data"][number];

const CONVERSATION_STATUS_VARIANTS: Record<
  Conversation["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "outline",
  active: "secondary",
  completed: "default",
  missed: "destructive",
  cancelled: "outline",
};

export const ConversationActions = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
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
          <TurboLink
            href={pathsConfig.admin.santacall.orders.order(
              conversation.orderId,
            )}
          >
            View Order
          </TurboLink>
        </DropdownMenuItem>
        {conversation.roomUrl && (
          <DropdownMenuItem asChild>
            <a
              href={conversation.roomUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Room
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const useColumns = (): ColumnDef<Conversation>[] => {
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
        <Badge variant={CONVERSATION_STATUS_VARIANTS[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
      meta: {
        label: t("status"),
        variant: "multiSelect",
        options: [
          { label: "Scheduled", value: "scheduled" },
          { label: "Active", value: "active" },
          { label: "Completed", value: "completed" },
          { label: "Missed", value: "missed" },
          { label: "Cancelled", value: "cancelled" },
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
      cell: ({ row }) => <span>{row.original.order?.childName ?? "-"}</span>,
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
      id: "scheduledAt",
      accessorKey: "scheduledAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Scheduled" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.scheduledAt);
        return (
          <div className="flex flex-col">
            <span>{date.toLocaleDateString(i18n.language)}</span>
            <span className="text-muted-foreground text-sm">
              {date.toLocaleTimeString(i18n.language, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {row.original.order?.timezone &&
                ` (${row.original.order.timezone})`}
            </span>
          </div>
        );
      },
      meta: {
        label: "Scheduled",
        variant: "dateRange",
      },
      enableColumnFilter: true,
    },
    {
      id: "durationSeconds",
      accessorKey: "durationSeconds",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => (
        <span>{formatDuration(row.original.durationSeconds)}</span>
      ),
    },
    {
      id: "startedAt",
      accessorKey: "startedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      cell: ({ row }) => {
        if (!row.original.startedAt) return <span>-</span>;
        const date = new Date(row.original.startedAt);
        return (
          <span className="text-sm">
            {date.toLocaleTimeString(i18n.language, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "endedAt",
      accessorKey: "endedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ended" />
      ),
      cell: ({ row }) => {
        if (!row.original.endedAt) return <span>-</span>;
        const date = new Date(row.original.endedAt);
        return (
          <span className="text-sm">
            {date.toLocaleTimeString(i18n.language, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="ml-auto w-fit">
          <ConversationActions conversation={row.original} />
        </div>
      ),
      enableHiding: false,
    },
  ];
};
