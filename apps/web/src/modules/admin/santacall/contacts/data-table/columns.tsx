"use client";

import { useMutation } from "@tanstack/react-query";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@turbostarter/ui-web/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@turbostarter/ui-web/dropdown-menu";
import { Icons } from "@turbostarter/ui-web/icons";
import { Textarea } from "@turbostarter/ui-web/textarea";

import { api } from "~/lib/api/client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Contact } from "@turbostarter/api/schema";

const CONTACT_STATUS_VARIANTS: Record<
  Contact["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  read: "secondary",
  replied: "outline",
  archived: "outline",
};

const CONTACT_STATUS_LABELS: Record<Contact["status"], string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export const ContactActions = ({
  contact,
  onUpdate,
}: {
  contact: Contact;
  onUpdate?: () => void;
}) => {
  const { t } = useTranslation(["common"]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [viewOpen, setViewOpen] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (status: Contact["status"]) => {
      const response = await api.admin.contacts[":id"].$patch({
        param: { id: contact.id },
        json: { status },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Contact status updated");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to update contact status");
    },
  });

  const sendReply = useMutation({
    mutationFn: async (reply: string) => {
      const response = await api.admin.contacts[":id"].reply.$post({
        param: { id: contact.id },
        json: { reply },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Reply sent successfully");
      setReplyOpen(false);
      setReplyMessage("");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to send reply");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async () => {
      const response = await api.admin.contacts[":id"].$delete({
        param: { id: contact.id },
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Contact deleted");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to delete contact");
    },
  });

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
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Icons.Eye className="mr-2 size-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReplyOpen(true)}>
            <Icons.Mail className="mr-2 size-4" />
            Reply
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {contact.status === "new" && (
            <DropdownMenuItem onClick={() => updateStatus.mutate("read")}>
              <Icons.Check className="mr-2 size-4" />
              Mark as Read
            </DropdownMenuItem>
          )}
          {contact.status !== "archived" && (
            <DropdownMenuItem onClick={() => updateStatus.mutate("archived")}>
              <Icons.Archive className="mr-2 size-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => deleteContact.mutate()}
            className="text-destructive"
          >
            <Icons.Trash className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact from {contact.name}</DialogTitle>
            <DialogDescription>{contact.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                Message
              </p>
              <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
            </div>
            {contact.adminReply && (
              <div className="bg-muted/50 rounded-lg border p-3">
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  Your Reply
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {contact.adminReply}
                </p>
              </div>
            )}
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Icons.Calendar className="size-4" />
              Submitted {new Date(contact.createdAt).toLocaleDateString()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewOpen(false);
                setReplyOpen(true);
              }}
            >
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {contact.name}</DialogTitle>
            <DialogDescription>
              Send a reply email to {contact.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                Original Message
              </p>
              <p className="text-muted-foreground text-sm italic">
                {contact.message.length > 200
                  ? `${contact.message.slice(0, 200)}...`
                  : contact.message}
              </p>
            </div>
            <Textarea
              placeholder="Type your reply here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendReply.mutate(replyMessage)}
              disabled={!replyMessage.trim() || sendReply.isPending}
            >
              {sendReply.isPending ? (
                <>
                  <Icons.Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icons.Send className="mr-2 size-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const useColumns = (onUpdate?: () => void): ColumnDef<Contact>[] => {
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
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-muted-foreground text-sm">
            {row.original.email}
          </span>
        </div>
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
        <Badge variant={CONTACT_STATUS_VARIANTS[row.original.status]}>
          {CONTACT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: {
        label: t("status"),
        variant: "multiSelect",
        options: [
          { label: "New", value: "new" },
          { label: "Read", value: "read" },
          { label: "Replied", value: "replied" },
          { label: "Archived", value: "archived" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "message",
      accessorKey: "message",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Message" />
      ),
      cell: ({ row }) => (
        <p className="text-muted-foreground max-w-xs truncate text-sm">
          {row.original.message}
        </p>
      ),
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
        <div className="ml-auto text-right text-sm">
          {new Date(row.original.createdAt).toLocaleDateString(i18n.language)}
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
          <ContactActions contact={row.original} onUpdate={onUpdate} />
        </div>
      ),
      enableHiding: false,
    },
  ];
};
