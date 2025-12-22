"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@turbostarter/i18n";
import { Badge } from "@turbostarter/ui-web/badge";
import { Button } from "@turbostarter/ui-web/button";
import { DataTableColumnHeader } from "@turbostarter/ui-web/data-table/data-table-column-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@turbostarter/ui-web/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@turbostarter/ui-web/dropdown-menu";
import { Icons } from "@turbostarter/ui-web/icons";
import { Input } from "@turbostarter/ui-web/input";

import { pathsConfig } from "~/config/paths";
import { api } from "~/lib/api/client";
import { TurboLink } from "~/modules/common/turbo-link";

import type { ColumnDef } from "@tanstack/react-table";
import type { GetOrdersResponse } from "@turbostarter/api/schema";

type Order = GetOrdersResponse["data"][number];

const ORDER_STATUS_VARIANTS: Record<
  Order["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  paid: "secondary",
  processing: "secondary",
  ready: "default",
  delivered: "default",
  failed: "destructive",
  refunded: "outline",
};

const ORDER_TYPE_VARIANTS: Record<
  Order["orderType"],
  "default" | "secondary" | "outline"
> = {
  video: "secondary",
  call: "default",
};

interface RegenerateResult {
  success: boolean;
  orderNumber: string;
  customerEmail: string;
  viewUrl: string;
  emailSent: boolean;
}

export const OrderActions = ({ order }: { order: Order }) => {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [regenerateResult, setRegenerateResult] =
    useState<RegenerateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const regenerateLink = useMutation({
    mutationFn: async () => {
      const response = await api.santacall.admin.orders[":id"][
        "regenerate-link"
      ].$post({
        param: { id: order.id },
      });
      return response.json() as Promise<RegenerateResult>;
    },
    onSuccess: (data) => {
      setRegenerateResult(data);
      setDialogOpen(true);
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to regenerate link:", error);
      toast.error("Failed to regenerate link");
    },
  });

  const copyToClipboard = async () => {
    if (regenerateResult?.viewUrl) {
      await navigator.clipboard.writeText(regenerateResult.viewUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canRegenerateLink =
    (order.status === "ready" || order.status === "delivered") &&
    order.deliveryUrl;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">{t("actions")}</span>
            <Icons.Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <TurboLink
              href={pathsConfig.admin.santacall.orders.order(order.id)}
            >
              View Details
            </TurboLink>
          </DropdownMenuItem>
          {order.deliveryUrl && (
            <DropdownMenuItem asChild>
              <a
                href={order.deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {order.orderType === "video" ? "View Video" : "View Call"}
              </a>
            </DropdownMenuItem>
          )}
          {canRegenerateLink && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => regenerateLink.mutate()}
                disabled={regenerateLink.isPending}
              >
                {regenerateLink.isPending ? (
                  <>
                    <Icons.Loader className="mr-2 size-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Icons.RotateCcw className="mr-2 size-4" />
                    Regenerate Link
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.CheckCircle2 className="size-5 text-green-500" />
              Link Regenerated Successfully
            </DialogTitle>
            <DialogDescription>
              A new link has been generated for order {regenerateResult?.orderNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Link</label>
              <div className="mt-1 flex gap-2">
                <Input
                  readOnly
                  value={regenerateResult?.viewUrl ?? ""}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Icons.Check className="size-4 text-green-500" />
                  ) : (
                    <Icons.Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {regenerateResult?.emailSent ? (
                <p className="flex items-center gap-2 text-green-600">
                  <Icons.Mail className="size-4" />
                  Email sent to {regenerateResult.customerEmail}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-amber-600">
                  <Icons.AlertTriangle className="size-4" />
                  Email could not be sent. Please send the link manually.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const useColumns = (): ColumnDef<Order>[] => {
  const { t, i18n } = useTranslation(["common"]);

  return [
    {
      id: "q",
      accessorKey: "q",
      meta: {
        placeholder: `${t("search")}...`,
        variant: "text",
      },
      enableHiding: false,
      enableColumnFilter: true,
    },
    {
      id: "orderNumber",
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order #" />
      ),
      cell: ({ row }) => (
        <TurboLink
          href={pathsConfig.admin.santacall.orders.order(row.original.id)}
          className="hover:text-primary font-mono font-medium underline underline-offset-4"
        >
          {row.original.orderNumber}
        </TurboLink>
      ),
      enableHiding: false,
    },
    {
      id: "orderType",
      accessorKey: "orderType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant={ORDER_TYPE_VARIANTS[row.original.orderType]}>
          {row.original.orderType === "video" ? "Video" : "Call"}
        </Badge>
      ),
      meta: {
        label: "Type",
        variant: "multiSelect",
        options: [
          { label: "Video", value: "video" },
          { label: "Call", value: "call" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("status")} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={ORDER_STATUS_VARIANTS[row.original.status]}>
            {row.original.status}
          </Badge>
          {row.original.regenerationCount > 0 && (
            <Badge variant="outline" className="text-xs">
              <Icons.RotateCcw className="mr-1 size-3" />
              x{row.original.regenerationCount}
            </Badge>
          )}
        </div>
      ),
      meta: {
        label: t("status"),
        variant: "multiSelect",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Paid", value: "paid" },
          { label: "Processing", value: "processing" },
          { label: "Ready", value: "ready" },
          { label: "Delivered", value: "delivered" },
          { label: "Failed", value: "failed" },
          { label: "Refunded", value: "refunded" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "customerName",
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customerName}</span>
          <span className="text-muted-foreground text-sm">
            {row.original.customerEmail}
          </span>
        </div>
      ),
    },
    {
      id: "childName",
      accessorKey: "childName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Child" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.childName}</span>
          <span className="text-muted-foreground text-sm">
            Age {row.original.childAge}
          </span>
        </div>
      ),
    },
    {
      id: "amountPaid",
      accessorKey: "amountPaid",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        if (!row.original.amountPaid) return <span>-</span>;
        const amount = (row.original.amountPaid / 100).toFixed(2);
        const currency = row.original.currency?.toUpperCase() ?? "USD";
        return (
          <span>
            ${amount} {currency}
          </span>
        );
      },
    },
    {
      id: "scheduledAt",
      accessorKey: "scheduledAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Scheduled" />
      ),
      cell: ({ row }) => {
        if (!row.original.scheduledAt) return <span>-</span>;
        const date = new Date(row.original.scheduledAt);
        return (
          <div className="flex flex-col">
            <span>{date.toLocaleDateString(i18n.language)}</span>
            <span className="text-muted-foreground text-sm">
              {date.toLocaleTimeString(i18n.language, {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {row.original.timezone && ` (${row.original.timezone})`}
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
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <div className="ml-auto w-fit">
          <DataTableColumnHeader column={column} title={t("createdAt")} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="ml-auto text-right">
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
      id: "actions",
      cell: ({ row }) => (
        <div className="ml-auto w-fit">
          <OrderActions order={row.original} />
        </div>
      ),
      enableHiding: false,
    },
  ];
};
