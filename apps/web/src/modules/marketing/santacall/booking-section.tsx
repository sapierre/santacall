"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@turbostarter/ui";
import { Button } from "@turbostarter/ui-web/button";
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

import { santacall } from "~/modules/santacall/lib/api";

// Interests options
const INTERESTS = [
  { value: "dinosaurs", label: "Dinosaurs 🦖" },
  { value: "unicorns", label: "Unicorns 🦄" },
  { value: "sports", label: "Sports ⚽" },
  { value: "video_games", label: "Video Games 🎮" },
  { value: "animals", label: "Animals 🐶" },
  { value: "space", label: "Space 🚀" },
  { value: "music", label: "Music 🎵" },
  { value: "art", label: "Art 🎨" },
  { value: "reading", label: "Reading 📚" },
  { value: "legos", label: "LEGO 🧱" },
  { value: "dolls", label: "Dolls 👧" },
  { value: "cars", label: "Cars 🚗" },
  { value: "superheroes", label: "Superheroes 🦸" },
  { value: "princesses", label: "Princesses 👸" },
  { value: "science", label: "Science 🔬" },
  { value: "cooking", label: "Cooking 👨‍🍳" },
] as const;

// Call scheduling constraints
const CALL_WINDOW_START_HOUR = 16;
const CALL_WINDOW_END_HOUR = 20;
const MIN_LEAD_TIME_HOURS = 2;
const MAX_ADVANCE_DAYS = 7;

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

const validateSchedule = (scheduledAt: Date, timezone: string, isTestMode: boolean): string | null => {
  // Skip validation for test mode
  if (isTestMode) return null;

  const now = new Date();
  const minLeadMs = MIN_LEAD_TIME_HOURS * 60 * 60 * 1000;
  const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;

  if (scheduledAt.getTime() - now.getTime() < minLeadMs) {
    return `Call must be scheduled at least ${MIN_LEAD_TIME_HOURS} hours in advance`;
  }

  if (scheduledAt.getTime() - now.getTime() > maxAdvanceMs) {
    return `Call must be scheduled within ${MAX_ADVANCE_DAYS} days`;
  }

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

export function SantaBookingSection() {
  const [orderType, setOrderType] = useState<"call" | "video">("call");
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
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong. Please try again.");
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    const childAge = Number(data.childAge);

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

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    <section id="book" className="relative bg-gradient-to-b from-green-50 via-white to-red-50/30 py-24">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">
            🎅 Book Your Experience
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Create{" "}
            <span className="text-green-600">Christmas Magic</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Fill out the form below and Santa will be ready for your child!
          </p>
        </div>

        {/* Main booking card */}
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border-2 border-red-100 bg-white shadow-xl shadow-red-100/20">
            {/* Type selector */}
            <div className="border-b border-gray-100 bg-gray-50 p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <p className="text-sm font-medium text-gray-600">Choose your experience:</p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2 sm:rounded-full sm:bg-white sm:p-1 sm:shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOrderType("call")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition-all sm:py-3",
                      orderType === "call"
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-white text-gray-600 shadow-sm hover:bg-gray-100 sm:bg-transparent sm:shadow-none"
                    )}
                  >
                    <Icons.Phone className="size-4" />
                    Live Call — $12.99
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("video")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition-all sm:py-3",
                      orderType === "video"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-600 shadow-sm hover:bg-gray-100 sm:bg-transparent sm:shadow-none"
                    )}
                  >
                    <Icons.Video className="size-4" />
                    Video — $7.99
                  </button>
                </div>
              </div>

              {/* Type description */}
              <div className="mt-4 text-center">
                {orderType === "call" ? (
                  <p className="text-sm text-gray-500">
                    📞 A live 3-minute video call with Santa. Schedule between 4-8pm, up to 7 days ahead.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    🎬 A personalized video message from Santa, delivered within 24 hours.
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  {/* Parent Info */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="flex size-7 items-center justify-center rounded-full bg-red-100 text-sm">1</span>
                      Your Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jane Doe"
                                className="h-12 rounded-xl text-base"
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
                                className="h-12 rounded-xl text-base"
                                {...field}
                                disabled={form.formState.isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              We'll send the {orderType === "video" ? "video" : "call link"} here
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Child Info */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="flex size-7 items-center justify-center rounded-full bg-green-100 text-sm">2</span>
                      Child's Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="childName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Child's Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Tommy"
                                className="h-12 rounded-xl text-base"
                                {...field}
                                disabled={form.formState.isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Santa will use this name! 🎅
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
                            <FormLabel>Child's Age</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="7"
                                className="h-12 rounded-xl text-base"
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
                          <FormLabel>What does your child love? (pick up to 5)</FormLabel>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {INTERESTS.map((interest) => {
                              const isSelected = selectedInterests.includes(interest.value);
                              const isDisabled = !isSelected && selectedInterests.length >= 5;

                              return (
                                <button
                                  key={interest.value}
                                  type="button"
                                  onClick={() => toggleInterest(interest.value)}
                                  disabled={isDisabled || form.formState.isSubmitting}
                                  className={cn(
                                    "rounded-xl border-2 px-3 py-3 text-sm transition-all",
                                    isSelected
                                      ? "border-green-500 bg-green-50 text-green-700"
                                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                                    isDisabled && "cursor-not-allowed opacity-50"
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

                    {/* Most Excited About */}
                    <FormField
                      control={form.control}
                      name="excitedGift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Most Excited About (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., a red bicycle, a puppy, a trip to see grandma"
                              className="h-12 rounded-xl text-base"
                              maxLength={80}
                              {...field}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            What's the one thing they're hoping for most? Santa will mention it naturally!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Wishlist / Special Notes */}
                    <FormField
                      control={form.control}
                      name="specialMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wishlist or special notes for Santa (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What does your child want for Christmas? Any achievements to celebrate? Let Santa know..."
                              className="min-h-[100px] rounded-xl"
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

                  {/* Scheduling (calls only) */}
                  {orderType === "call" && (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-sm">3</span>
                        Schedule Your Call
                      </h3>
                      <div className="rounded-xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-700">
                          📅 Calls available <strong>4:00 PM - 8:00 PM</strong> in your timezone.
                          Book at least 2 hours ahead, up to 7 days in advance.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                                  <SelectTrigger className="h-12 rounded-xl text-base">
                                    <SelectValue placeholder="Select a date" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Testing option - schedule for now */}
                                    <SelectItem
                                      value={TEST_MODE_NOW}
                                      className="font-medium text-amber-600"
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
                                    <SelectTrigger className="h-12 rounded-xl text-base">
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
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className={cn(
                        "w-full rounded-full py-6 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02]",
                        orderType === "call"
                          ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                          : "bg-green-600 hover:bg-green-700 shadow-green-200"
                      )}
                      disabled={form.formState.isSubmitting || checkout.isPending}
                    >
                      {form.formState.isSubmitting || checkout.isPending ? (
                        <>
                          <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                          {checkout.isPending ? "Redirecting to payment..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          🎅 {orderType === "call" ? "Book Santa Call" : "Order Santa Video"} — {orderType === "call" ? "$12.99" : "$7.99"}
                          <Icons.ArrowRight className="ml-2 size-5" />
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Icons.Lock className="size-4 text-green-600" />
                        <span>Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.ShieldCheck className="size-4 text-green-600" />
                        <span>Money-back guarantee</span>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
