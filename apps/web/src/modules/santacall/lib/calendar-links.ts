import { google, outlook, office365, yahoo, ics } from "calendar-link";

export interface CalendarEvent {
  title: string;
  description?: string;
  start: string; // ISO string
  end?: string; // ISO string
  location?: string;
}

export const getCalendarLinks = (event: CalendarEvent) => ({
  google: google(event),
  outlook: outlook(event),
  office365: office365(event),
  yahoo: yahoo(event),
  ics: ics(event),
});
