"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";

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

import { CVIProvider } from "~/components/cvi/components/cvi-provider";

import { SantaCallEmbed } from "../delivery/santa-call-embed";
import { SantaVideoPlayer } from "../delivery/santa-video-player";
import { santacall } from "../lib/api";

import { AddToCalendar } from "./add-to-calendar";

const MAX_CALL_SECONDS = 180; // 3 minutes

interface OrderPageContentProps {
  orderNumber: string;
  token?: string;
  status?: string;
}

type StatusConfigType = {
  icon: typeof Icons.Clock;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  animate?: boolean;
};

// Separate component to manage call state
function CallSection({
  orderType,
  deliveryUrl,
  status,
  scheduledAt,
}: {
  orderType: string;
  deliveryUrl: string | null;
  status: string;
  scheduledAt: string | null;
}) {
  const [callStarted, setCallStarted] = useState(false);
  const [callJoined, setCallJoined] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(MAX_CALL_SECONDS);

  // Timer logic - only runs when callJoined is true
  useEffect(() => {
    if (!callJoined) return;

    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [callJoined]);

  // Trigger end when time expires
  useEffect(() => {
    if (remainingSeconds === 0 && callJoined) {
      setCallEnded(true);
    }
  }, [remainingSeconds, callJoined]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (callStarted && !callEnded) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [callStarted, callEnded]);

  const handleJoined = () => {
    setCallJoined(true);
  };

  const handleEndCall = () => {
    setCallEnded(true);
  };

  if (orderType !== "call" || !deliveryUrl || status !== "ready") {
    return null;
  }

  // Check if we're within the call window (15 min before to 30 min after scheduled time)
  // For testing: also allow if scheduled within 5 minutes from now
  const now = new Date();
  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  const windowStartMs = 15 * 60 * 1000; // 15 minutes before
  const windowEndMs = 30 * 60 * 1000; // 30 minutes after

  // Check if this is a test/immediate call (scheduled within 5 minutes)
  const isTestCall = scheduled && Math.abs(scheduled.getTime() - now.getTime()) < 5 * 60 * 1000;

  const isWithinCallWindow =
    isTestCall ||
    (scheduled &&
      now >= new Date(scheduled.getTime() - windowStartMs) &&
      now <= new Date(scheduled.getTime() + windowEndMs));

  // If not within call window, show "not yet" message
  if (!isWithinCallWindow && scheduled) {
    const timeUntilCall = scheduled.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntilCall / (1000 * 60 * 60));
    const minutesUntil = Math.floor(
      (timeUntilCall % (1000 * 60 * 60)) / (1000 * 60),
    );

    return (
      <div className="mt-6">
        <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
            <Icons.Clock className="size-8 text-amber-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-amber-800">
              Your call is scheduled
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {timeUntilCall > 0 ? (
                <>
                  Come back in{" "}
                  {hoursUntil > 0 && `${hoursUntil} hour${hoursUntil > 1 ? "s" : ""} and `}
                  {minutesUntil} minute{minutesUntil !== 1 ? "s" : ""} to start
                  your call with Santa
                </>
              ) : (
                "The call window has passed. Please contact support."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="mt-6">
        <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
            <Icons.Clock className="size-8 text-amber-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-amber-800">
              Call Time Ended
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Your 3-minute call with Santa has ended. We hope it was magical!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!callStarted) {
    return (
      <div className="mt-6">
        <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
            <Icons.Phone className="size-8 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800">
              Santa is ready to talk!
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Click below when you&apos;re ready to start your 3-minute call
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => setCallStarted(true)}
          >
            <Icons.Phone className="size-5" />
            Start Call Now
          </Button>
        </div>
      </div>
    );
  }

  // Timer display formatting
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isLowTime = remainingSeconds <= 60;
  const isCriticalTime = remainingSeconds <= 30;

  // FULLSCREEN CALL EXPERIENCE - FaceTime style
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <CVIProvider>
        {/* Fullscreen call container */}
        <div className="relative h-full w-full">
          {/* Header bar - minimal top info */}
          <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2 text-white/70">
              <Icons.Lock className="size-3" />
              <span className="text-xs font-medium">SantaCall</span>
            </div>
            {/* Connection indicator */}
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-400" />
              <span className="size-1.5 rounded-full bg-green-400" />
              <span className="size-1.5 rounded-full bg-green-400" />
            </div>
          </div>

          {/* Timer chip - positioned just below header */}
          <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: 'calc(max(3.5rem, calc(2.5rem + env(safe-area-inset-top))))' }}>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-md transition-colors ${
                isCriticalTime
                  ? "animate-pulse bg-red-500/90 text-white"
                  : isLowTime
                    ? "bg-amber-500/80 text-white"
                    : "bg-black/40 text-white/90"
              }`}
            >
              {formattedTime}
            </span>
          </div>

          {/* Call embed fills entire screen - controls are built into Conversation component */}
          <SantaCallEmbed
            joinUrl={deliveryUrl}
            onJoined={handleJoined}
            onLeave={handleEndCall}
          />

          {/* Screenshot prompt - shows above the controls when time is low */}
          {isLowTime && !isCriticalTime && (
            <div className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 sm:bottom-32">
              <div className="rounded-full bg-green-500/90 px-4 py-2 text-center backdrop-blur-md">
                <p className="text-sm font-medium text-white">
                  📸 Santa will smile — take a screenshot!
                </p>
              </div>
            </div>
          )}
        </div>
      </CVIProvider>
    </div>
  );
}

const STATUS_CONFIG: Record<string, StatusConfigType> = {
  pending: {
    icon: Icons.Clock,
    label: "Payment Pending",
    description: "Your payment is being processed.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  paid: {
    icon: Icons.CreditCard,
    label: "Payment Received",
    description: "We've received your payment and are preparing your order.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  processing: {
    icon: Icons.Loader2,
    label: "Creating Your Experience",
    description: "Santa is working on your personalized experience!",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    animate: true,
  },
  ready: {
    icon: Icons.Check,
    label: "Ready",
    description: "Your experience is ready!",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  delivered: {
    icon: Icons.Check,
    label: "Delivered",
    description: "Your Santa experience has been completed.",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  failed: {
    icon: Icons.AlertTriangle,
    label: "Something Went Wrong",
    description:
      "There was an issue with your order. Please contact support.",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  refunded: {
    icon: Icons.RotateCcw,
    label: "Refunded",
    description: "Your order has been refunded.",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

export function OrderPageContent({
  orderNumber,
  token,
  status: urlStatus,
}: OrderPageContentProps) {
  const isSuccess = urlStatus === "success";

  // Fetch order if token is provided
  const orderQuery = santacall.queries.order(orderNumber, token || "");
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...orderQuery,
    enabled: !!token,
    refetchInterval: (query) => {
      // Refetch every 5 seconds if order is processing
      const data = query.state.data;
      if (
        data &&
        ["pending", "paid", "processing"].includes(data.status)
      ) {
        return 5000;
      }
      return false;
    },
  });

  // Show success message if just completed payment
  if (isSuccess && !order) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
          <Icons.Check className="size-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We&apos;re creating something magical!
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Order #{orderNumber}</CardTitle>
            <CardDescription>
              Check your email for updates on your order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              You can return to this page anytime using the link in your email
              to check your order status or view your Santa experience.
            </p>
          </CardContent>
        </Card>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Icons.Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground">Loading your order...</p>
      </div>
    );
  }

  // Error or not found
  if (error || !order) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-red-100">
          <Icons.AlertTriangle className="size-10 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground mt-2">
            We couldn&apos;t find this order. Please check the link in your
            email.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  // Get status config - always defaults to pending which is guaranteed to exist
  const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConfig!.icon;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8">
      {/* Status Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`flex size-20 items-center justify-center rounded-full ${statusConfig!.bgColor}`}
        >
          <StatusIcon
            className={`size-10 ${statusConfig!.color} ${
              statusConfig!.animate ? "animate-spin" : ""
            }`}
          />
        </div>
        <div>
          <Badge className={statusConfig!.color}>{statusConfig!.label}</Badge>
          <h1 className="mt-2 text-3xl font-bold">
            {order.orderType === "video"
              ? "Santa Video for "
              : "Santa Call for "}
            {order.childName}
          </h1>
          <p className="text-muted-foreground mt-2">
            {statusConfig!.description}
          </p>
        </div>
      </div>

      {/* Order Details */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order #{orderNumber}</span>
            <Badge variant="outline">
              {order.orderType === "video" ? "Video" : "Call"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* For scheduled calls, show scheduled time with Add to Calendar */}
          {order.orderType === "call" &&
            order.scheduledAt &&
            (() => {
              const start = new Date(order.scheduledAt);
              const end = new Date(start.getTime() + 5 * 60 * 1000);
              return (
                <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Icons.Calendar className="text-muted-foreground size-5" />
                    <div>
                      <p className="font-medium">Scheduled Call</p>
                      <p className="text-muted-foreground text-sm">
                        {start.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {start.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                        {order.timezone && ` (${order.timezone})`}
                      </p>
                    </div>
                  </div>
                  <AddToCalendar
                    event={{
                      title: `Santa Call for ${order.childName}`,
                      description: `Your magical video call with Santa!\n\nJoin your call here: ${window.location.href.split("?")[0]}?token=${token}`,
                      start: start.toISOString(),
                      end: end.toISOString(),
                    }}
                  />
                </div>
              );
            })()}

          {/* Delivery content - Video orders */}
          {order.orderType === "video" &&
            order.deliveryUrl &&
            (order.status === "ready" || order.status === "delivered") && (
              <div className="mt-6">
                <SantaVideoPlayer
                  videoUrl={order.deliveryUrl}
                  childName={order.childName}
                />
              </div>
            )}

          {/* Delivery content - Call orders */}
          <CallSection
            orderType={order.orderType}
            deliveryUrl={order.deliveryUrl}
            status={order.status}
            scheduledAt={order.scheduledAt}
          />

          {/* Processing message */}
          {order.status === "processing" && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">
                {order.orderType === "video"
                  ? "Santa is recording your personalized video message. This usually takes 10-30 minutes."
                  : "We're setting up your call room with Santa. You'll receive an email when it's ready."}
              </p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Questions about your order?{" "}
          <Link href="/contact" className="text-primary underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
