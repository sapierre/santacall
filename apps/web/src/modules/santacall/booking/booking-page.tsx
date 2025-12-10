"use client";

import Link from "next/link";

import { cn } from "@turbostarter/ui";
import { Badge } from "@turbostarter/ui-web/badge";
import { Button } from "@turbostarter/ui-web/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@turbostarter/ui-web/card";
import { Icons } from "@turbostarter/ui-web/icons";

import { BookingForm } from "./booking-form";

interface BookingPageContentProps {
  orderType: "video" | "call";
}

const PRICING = {
  video: {
    price: "$14.99",
    features: [
      "Personalized video from Santa",
      "Uses your child's name",
      "Mentions their interests",
      "Delivered within 24 hours",
      "Download and share forever",
    ],
  },
  call: {
    price: "$29.99",
    features: [
      "Live 5-minute video call",
      "Real-time conversation with Santa",
      "Personalized to your child",
      "Schedule at your convenience",
      "Perfect for the whole family",
    ],
  },
};

export function BookingPageContent({ orderType }: BookingPageContentProps) {
  const pricing = PRICING[orderType];
  const otherType = orderType === "video" ? "call" : "video";

  return (
    <div className="flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Left: Pricing Card */}
      <div className="w-full lg:w-1/3">
        <Card className="sticky top-24">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {orderType === "video" ? "Video Message" : "Live Call"}
              </Badge>
              <span className="text-2xl font-bold">{pricing.price}</span>
            </div>
            <CardTitle className="mt-2">
              {orderType === "video"
                ? "Santa Video Message"
                : "Live Santa Call"}
            </CardTitle>
            <CardDescription>
              {orderType === "video"
                ? "A magical personalized video"
                : "A live video call with Santa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {pricing.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Icons.Check className="text-primary mt-0.5 size-4 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="border-t pt-4 mt-6">
              <p className="text-muted-foreground text-xs">
                Looking for a{" "}
                {otherType === "video" ? "video message" : "live call"} instead?
              </p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href={`/book?type=${otherType}`}>
                  Switch to {otherType === "video" ? "Video" : "Call"} →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Booking Form */}
      <div className="flex-1">
        <BookingForm orderType={orderType} />
      </div>
    </div>
  );
}
