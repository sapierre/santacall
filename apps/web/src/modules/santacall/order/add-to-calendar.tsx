"use client";

import { Button } from "@turbostarter/ui-web/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@turbostarter/ui-web/dropdown-menu";
import { Icons } from "@turbostarter/ui-web/icons";

import {
  getCalendarLinks,
  type CalendarEvent,
} from "../lib/calendar-links";

interface AddToCalendarProps {
  event: CalendarEvent;
}

export function AddToCalendar({ event }: AddToCalendarProps) {
  const links = getCalendarLinks(event);

  const downloadIcs = () => {
    const blob = new Blob([links.ics], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `santa-call-${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icons.Calendar className="size-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={links.google} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={links.outlook} target="_blank" rel="noopener noreferrer">
            Outlook.com
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={links.office365} target="_blank" rel="noopener noreferrer">
            Office 365
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={links.yahoo} target="_blank" rel="noopener noreferrer">
            Yahoo Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadIcs}>
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
