"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@turbostarter/ui";
import { Button } from "@turbostarter/ui-web/button";
import { Card, CardContent } from "@turbostarter/ui-web/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@turbostarter/ui-web/form";
import { Icons } from "@turbostarter/ui-web/icons";
import { Input } from "@turbostarter/ui-web/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbostarter/ui-web/select";
import { Textarea } from "@turbostarter/ui-web/textarea";

import { santacall } from "../lib/api";

// Interests options
const INTERESTS = [
  { value: "dinosaurs", label: "Dinosaurs" },
  { value: "unicorns", label: "Unicorns" },
  { value: "sports", label: "Sports" },
  { value: "video_games", label: "Video Games" },
  { value: "animals", label: "Animals" },
  { value: "space", label: "Space" },
  { value: "music", label: "Music" },
  { value: "art", label: "Art & Drawing" },
  { value: "reading", label: "Reading" },
  { value: "legos", label: "LEGO" },
  { value: "dolls", label: "Dolls" },
  { value: "cars", label: "Cars & Trucks" },
  { value: "superheroes", label: "Superheroes" },
  { value: "princesses", label: "Princesses" },
  { value: "science", label: "Science" },
  { value: "cooking", label: "Cooking" },
] as const;

// Call scheduling constraints (must match backend)
const CALL_WINDOW_START_HOUR = 16; // 4 PM
const CALL_WINDOW_END_HOUR = 20; // 8 PM
const MIN_LEAD_TIME_HOURS = 2;
const MAX_ADVANCE_DAYS = 7;

// Generate available time slots (4pm-8pm in 30min increments)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = CALL_WINDOW_START_HOUR; hour < CALL_WINDOW_END_HOUR; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Testing mode - add "now" option for immediate testing
const TEST_MODE_NOW = "now";

/**
 * Validate scheduled call time (mirrors backend validation)
 * Returns error message or null if valid
 */
const validateSchedule = (scheduledAt: Date, timezone: string, isTestMode: boolean): string | null => {
  // Skip validation for test mode
  if (isTestMode) return null;

  const now = new Date();
  const minLeadMs = MIN_LEAD_TIME_HOURS * 60 * 60 * 1000;
  const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;

  // 2-hour minimum lead time
  if (scheduledAt.getTime() - now.getTime() < minLeadMs) {
    return `Call must be scheduled at least ${MIN_LEAD_TIME_HOURS} hours in advance`;
  }

  // 7-day maximum advance booking
  if (scheduledAt.getTime() - now.getTime() > maxAdvanceMs) {
    return `Call must be scheduled within ${MAX_ADVANCE_DAYS} days`;
  }

  // 4pm-8pm in customer's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(formatter.format(scheduledAt), 10);
  if (hour < CALL_WINDOW_START_HOUR || hour >= CALL_WINDOW_END_HOUR) {
    return `Call must be between ${CALL_WINDOW_START_HOUR % 12 || 12}pm and ${CALL_WINDOW_END_HOUR % 12 || 12}pm in your timezone`;
  }

  return null;
};

// Get next 7 days
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Base form schema - keep childAge as string for form, validate as number
const bookingSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email"),
  customerName: z.string().min(1, "Your name is required"),
  childName: z.string().min(1, "Child's name is required"),
  childAge: z
    .string()
    .min(1, "Age is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 17, {
      message: "Age must be between 1-17",
    }),
  interests: z.array(z.string()).min(1, "Select at least one interest").max(5),
  excitedGift: z.string().max(80).optional(),
  specialMessage: z.string().max(500).optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  orderType: "video" | "call";
}

export function BookingForm({ orderType }: BookingFormProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const form = useForm({
    resolver: standardSchemaResolver(bookingSchema),
    defaultValues: {
      customerEmail: "",
      customerName: "",
      childName: "",
      childAge: "",
      interests: [] as string[],
      excitedGift: "",
      specialMessage: "",
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  const checkout = useMutation({
    mutationKey: santacall.mutations.checkout.mutationKey,
    mutationFn: santacall.mutations.checkout.mutationFn,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    const childAge = Number(data.childAge);

    // Validate call-specific fields
    if (orderType === "call") {
      if (!data.scheduledDate) {
        form.setError("scheduledDate", { message: "Please select a date" });
        return;
      }

      // Check if test mode (now)
      const isTestMode = data.scheduledDate === TEST_MODE_NOW;

      // For test mode, use current time + 1 minute
      let scheduledAt: Date;
      if (isTestMode) {
        scheduledAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
      } else {
        if (!data.scheduledTime) {
          form.setError("scheduledTime", { message: "Please select a time" });
          return;
        }

        // Combine date and time into scheduledAt
        const dateParts = data.scheduledDate.split("-").map(Number);
        const timeParts = data.scheduledTime.split(":").map(Number);
        scheduledAt = new Date(
          dateParts[0]!,
          dateParts[1]! - 1,
          dateParts[2]!,
          timeParts[0]!,
          timeParts[1]!
        );
      }

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Validate schedule before submitting (mirrors backend validation)
      const scheduleError = validateSchedule(scheduledAt, timezone, isTestMode);
      if (scheduleError) {
        form.setError("scheduledDate", { message: scheduleError });
        return;
      }

      checkout.mutate({
        orderType: "call",
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        childName: data.childName,
        childAge,
        interests: data.interests as (typeof INTERESTS)[number]["value"][],
        excitedGift: data.excitedGift || undefined,
        specialMessage: data.specialMessage || undefined,
        scheduledAt,
        timezone,
        testMode: isTestMode, // Skip backend validation for testing
      });
    } else {
      checkout.mutate({
        orderType: "video",
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        childName: data.childName,
        childAge,
        interests: data.interests as (typeof INTERESTS)[number]["value"][],
        excitedGift: data.excitedGift || undefined,
        specialMessage: data.specialMessage || undefined,
      });
    }
  };

  const toggleInterest = (interest: string) => {
    const current = form.getValues("interests");
    if (current.includes(interest)) {
      const updated = current.filter((i) => i !== interest);
      form.setValue("interests", updated);
      setSelectedInterests(updated);
    } else if (current.length < 5) {
      const updated = [...current, interest];
      form.setValue("interests", updated);
      setSelectedInterests(updated);
    }
  };

  const availableDates = getAvailableDates();

  return (
    <Card className="w-full max-w-2xl border-none shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {/* Parent/Guardian Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        We&apos;ll send the {orderType === "video" ? "video" : "call link"} here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Child Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Child&apos;s Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="childName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child&apos;s Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tommy"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Santa will use this name in the {orderType}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="childAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child&apos;s Age</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="7"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Interests */}
              <FormField
                control={form.control}
                name="interests"
                render={() => (
                  <FormItem>
                    <FormLabel>Interests (select up to 5)</FormLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.value);
                        const isDisabled =
                          !isSelected && selectedInterests.length >= 5;

                        return (
                          <button
                            key={interest.value}
                            type="button"
                            onClick={() => toggleInterest(interest.value)}
                            disabled={isDisabled || form.formState.isSubmitting}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input hover:bg-accent hover:text-accent-foreground",
                              isDisabled && "cursor-not-allowed opacity-50",
                            )}
                          >
                            {interest.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Excited Gift - main wish */}
              <FormField
                control={form.control}
                name="excitedGift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Most Excited About (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., a new bike, a puppy, a piano"
                        maxLength={80}
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      What gift is your child hoping for most? Santa will mention it naturally.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Special Message */}
              <FormField
                control={form.control}
                name="specialMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Message for Santa (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special things Santa should mention? Recent achievements, upcoming events, or encouraging messages..."
                        className="min-h-[100px]"
                        maxLength={500}
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      {(field.value?.length || 0)}/500 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scheduling (for calls only) */}
            {orderType === "call" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schedule Your Call</h3>
                <p className="text-muted-foreground text-sm">
                  Calls are available between 4:00 PM - 8:00 PM in your local timezone.
                  Each call lasts approximately 3 minutes.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={form.formState.isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a date" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Testing option - schedule for now */}
                              <SelectItem
                                value={TEST_MODE_NOW}
                                className="text-amber-600 font-medium"
                              >
                                🧪 Now (Testing)
                              </SelectItem>
                              {availableDates.map((date) => (
                                <SelectItem
                                  key={date.toISOString()}
                                  value={date.toISOString().split("T")[0]!}
                                >
                                  {date.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hide time selector when "Now (Testing)" is selected */}
                  {form.watch("scheduledDate") !== TEST_MODE_NOW && (
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={form.formState.isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((time) => {
                                  const [hour, minute] = time.split(":").map(Number);
                                  const d = new Date();
                                  d.setHours(hour!, minute!, 0, 0);
                                  return (
                                    <SelectItem key={time} value={time}>
                                      {d.toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting || checkout.isPending}
              >
                {form.formState.isSubmitting || checkout.isPending ? (
                  <>
                    <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                    {checkout.isPending ? "Redirecting to payment..." : "Processing..."}
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <Icons.ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                You&apos;ll be redirected to our secure payment page
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
