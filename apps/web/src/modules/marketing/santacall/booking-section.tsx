"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  { value: "dinosaurs", label: "Dinosaurs", emoji: "🦖" },
  { value: "unicorns", label: "Unicorns", emoji: "🦄" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "video_games", label: "Video Games", emoji: "🎮" },
  { value: "animals", label: "Animals", emoji: "🐶" },
  { value: "space", label: "Space", emoji: "🚀" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "reading", label: "Reading", emoji: "📚" },
  { value: "legos", label: "LEGO", emoji: "🧱" },
  { value: "dolls", label: "Dolls", emoji: "👧" },
  { value: "cars", label: "Cars", emoji: "🚗" },
  { value: "superheroes", label: "Superheroes", emoji: "🦸" },
  { value: "princesses", label: "Princesses", emoji: "👸" },
  { value: "science", label: "Science", emoji: "🔬" },
  { value: "cooking", label: "Cooking", emoji: "👨‍🍳" },
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

// Special values for today scheduling
const TODAY_NOW = "today-now";
const TODAY_DATE = "today";

const validateSchedule = (
  scheduledAt: Date,
  timezone: string,
  isNowMode: boolean,
): string | null => {
  if (isNowMode) return null;

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
  for (let i = 1; i <= MAX_ADVANCE_DAYS; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getTodayTimeSlots = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return TIME_SLOTS.filter((time) => {
    const [hour, minute] = time.split(":").map(Number);
    if (hour! > currentHour) return true;
    if (hour! === currentHour && minute! > currentMinute + 5) return true;
    return false;
  });
};

const childSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  age: z
    .string()
    .min(1, "Age is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 17,
      {
        message: "Age must be between 1-17",
      },
    ),
});

const bookingSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email"),
  customerName: z.string().min(1, "Your name is required"),
  children: z
    .array(childSchema)
    .min(1, "At least one child is required")
    .max(4, "Maximum 4 children allowed"),
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
      children: [{ name: "", age: "" }],
      interests: [] as string[],
      excitedGift: "",
      specialMessage: "",
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
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
    // Convert children ages from strings to numbers
    const children = data.children.map((child) => ({
      name: child.name,
      age: Number(child.age),
    }));

    if (orderType === "call") {
      if (!data.scheduledDate) {
        form.setError("scheduledDate", { message: "Please select a date" });
        return;
      }

      const isNowMode = data.scheduledDate === TODAY_NOW;

      let scheduledAt: Date;
      if (isNowMode) {
        scheduledAt = new Date(Date.now() + 60 * 1000);
      } else if (data.scheduledDate === TODAY_DATE) {
        if (!data.scheduledTime) {
          form.setError("scheduledTime", { message: "Please select a time" });
          return;
        }
        const timeParts = data.scheduledTime.split(":").map(Number);
        const today = new Date();
        scheduledAt = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          timeParts[0]!,
          timeParts[1]!,
        );
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
          timeParts[1]!,
        );
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const scheduleError = validateSchedule(scheduledAt, timezone, isNowMode);
      if (scheduleError) {
        form.setError("scheduledDate", { message: scheduleError });
        return;
      }

      checkout.mutate({
        orderType: "call",
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        children,
        interests: data.interests as (typeof INTERESTS)[number]["value"][],
        excitedGift: data.excitedGift || undefined,
        specialMessage: data.specialMessage || undefined,
        scheduledAt,
        timezone,
        testMode: isNowMode,
      });
    } else {
      checkout.mutate({
        orderType: "video",
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        children,
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
    <section id="book" className="relative overflow-hidden py-16 sm:py-24">
      {/* Festive background */}
      <div className="dark:via-background absolute inset-0 bg-gradient-to-b from-red-50 via-white to-green-50/50 dark:from-red-950/20 dark:to-green-950/20" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 size-72 rounded-full bg-red-200/30 blur-3xl dark:bg-red-900/20" />
        <div className="absolute -right-20 bottom-20 size-72 rounded-full bg-green-200/30 blur-3xl dark:bg-green-900/20" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 dark:bg-red-900/30">
            <span className="text-xl">🎅</span>
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              Book Your Experience
            </span>
          </div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Create{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-300">
              Christmas Magic
            </span>
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            Fill out the form below to create a magical moment!
          </p>
        </div>

        {/* Main booking card */}
        <div className="mx-auto max-w-4xl">
          <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xl shadow-red-500/5 sm:rounded-3xl dark:shadow-red-500/10">
            {/* Type selector */}
            <div className="border-border bg-muted/50 border-b p-4 sm:p-6">
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <p className="text-muted-foreground text-sm font-medium">
                  Choose your experience:
                </p>
                <div className="sm:bg-background flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2 sm:rounded-full sm:p-1.5 sm:shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOrderType("call")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all sm:rounded-full sm:py-2.5",
                      orderType === "call"
                        ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                        : "bg-background text-muted-foreground hover:bg-muted sm:bg-transparent",
                    )}
                  >
                    <Icons.Phone className="size-4" />
                    <span>Live Call</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      $6.99
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("video")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all sm:rounded-full sm:py-2.5",
                      orderType === "video"
                        ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                        : "bg-background text-muted-foreground hover:bg-muted sm:bg-transparent",
                    )}
                  >
                    <Icons.Video className="size-4" />
                    <span>Video Message</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      $4.99
                    </span>
                  </button>
                </div>
              </div>

              {/* Type description */}
              <div className="mt-4 text-center">
                {orderType === "call" ? (
                  <p className="text-muted-foreground text-sm">
                    📞 A live 3-minute video call with Santa
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    🎬 A personalized video message, delivered within 24 hours
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8 sm:space-y-10"
                >
                  {/* Parent Info */}
                  <div className="space-y-4">
                    <h3 className="text-foreground flex items-center gap-2 text-base font-semibold sm:text-lg">
                      <span className="flex size-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 sm:size-7 sm:text-sm dark:bg-red-900/50 dark:text-red-300">
                        1
                      </span>
                      Your Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">
                              Your Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jane Doe"
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground h-11 rounded-xl sm:h-12"
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
                            <FormLabel className="text-foreground">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="jane@example.com"
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground h-11 rounded-xl sm:h-12"
                                {...field}
                                disabled={form.formState.isSubmitting}
                              />
                            </FormControl>
                            <FormDescription className="text-muted-foreground text-xs sm:text-sm">
                              We&apos;ll send the{" "}
                              {orderType === "video" ? "video" : "call link"}{" "}
                              here
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Children Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-foreground flex items-center gap-2 text-base font-semibold sm:text-lg">
                        <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 sm:size-7 sm:text-sm dark:bg-green-900/50 dark:text-green-300">
                          2
                        </span>
                        Children&apos;s Information
                      </h3>
                      {fields.length < 4 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ name: "", age: "" })}
                          disabled={form.formState.isSubmitting}
                          className="rounded-full"
                        >
                          <Icons.Plus className="mr-1 size-4" />
                          Add Child
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="border-border bg-muted/30 rounded-xl border p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-foreground text-sm font-medium">
                              Child {index + 1}
                            </span>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={form.formState.isSubmitting}
                                className="text-muted-foreground hover:text-destructive h-8 rounded-full"
                              >
                                <Icons.X className="size-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`children.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-foreground">
                                    Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Tommy"
                                      className="border-input bg-background text-foreground placeholder:text-muted-foreground h-11 rounded-xl sm:h-12"
                                      {...field}
                                      disabled={form.formState.isSubmitting}
                                    />
                                  </FormControl>
                                  {index === 0 && (
                                    <FormDescription className="text-muted-foreground text-xs sm:text-sm">
                                      Santa will use this name! 🎅
                                    </FormDescription>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`children.${index}.age`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-foreground">
                                    Age
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder="7"
                                      className="border-input bg-background text-foreground placeholder:text-muted-foreground h-11 rounded-xl sm:h-12"
                                      {...field}
                                      disabled={form.formState.isSubmitting}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Interests */}
                    <FormField
                      control={form.control}
                      name="interests"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            What do your{" "}
                            {fields.length > 1 ? "children" : "child"} love?
                            (pick up to 5)
                          </FormLabel>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                            {INTERESTS.map((interest) => {
                              const isSelected = selectedInterests.includes(
                                interest.value,
                              );
                              const isDisabled =
                                !isSelected && selectedInterests.length >= 5;

                              return (
                                <button
                                  key={interest.value}
                                  type="button"
                                  onClick={() => toggleInterest(interest.value)}
                                  disabled={
                                    isDisabled || form.formState.isSubmitting
                                  }
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:py-3 sm:text-sm",
                                    isSelected
                                      ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/50 dark:text-green-300"
                                      : "border-border bg-background text-foreground hover:border-muted-foreground/50 hover:bg-muted",
                                    isDisabled &&
                                      "cursor-not-allowed opacity-50",
                                  )}
                                >
                                  <span className="text-base sm:text-lg">
                                    {interest.emoji}
                                  </span>
                                  <span className="truncate">
                                    {interest.label}
                                  </span>
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
                          <FormLabel className="text-foreground">
                            Most Excited About (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., a red bicycle, a puppy, a trip to see grandma"
                              className="border-input bg-background text-foreground placeholder:text-muted-foreground h-11 rounded-xl sm:h-12"
                              maxLength={80}
                              {...field}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs sm:text-sm">
                            What&apos;s the one thing they&apos;re hoping for
                            most? Santa will mention it naturally!
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
                          <FormLabel className="text-foreground">
                            Wishlist or special notes for Santa (optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What do your children want for Christmas? Any achievements to celebrate? Let Santa know..."
                              className="border-input bg-background text-foreground placeholder:text-muted-foreground min-h-[100px] rounded-xl"
                              maxLength={500}
                              {...field}
                              disabled={form.formState.isSubmitting}
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs sm:text-sm">
                            {field.value?.length || 0}/500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Scheduling (calls only) */}
                  {orderType === "call" && (
                    <div className="space-y-4">
                      <h3 className="text-foreground flex items-center gap-2 text-base font-semibold sm:text-lg">
                        <span className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 sm:size-7 sm:text-sm dark:bg-amber-900/50 dark:text-amber-300">
                          3
                        </span>
                        Schedule Your Call
                      </h3>
                      <div className="rounded-xl bg-amber-50 p-3 sm:p-4 dark:bg-amber-950/30">
                        <p className="text-xs text-amber-700 sm:text-sm dark:text-amber-300">
                          📅 Call <strong>Now</strong> or schedule for{" "}
                          <strong>4:00 PM - 8:00 PM</strong> in your timezone,
                          up to 7 days in advance.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="scheduledDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">
                                Date
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={form.formState.isSubmitting}
                                >
                                  <SelectTrigger className="border-input bg-background text-foreground h-11 rounded-xl sm:h-12">
                                    <SelectValue placeholder="Select a date" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value={TODAY_NOW}
                                      className="font-medium text-green-600 dark:text-green-400"
                                    >
                                      🎅 Today: Now
                                    </SelectItem>
                                    {getTodayTimeSlots().length > 0 && (
                                      <SelectItem
                                        value={TODAY_DATE}
                                        className="font-medium"
                                      >
                                        📅 Today: Pick a time
                                      </SelectItem>
                                    )}
                                    {availableDates.map((date) => (
                                      <SelectItem
                                        key={date.toISOString()}
                                        value={
                                          date.toISOString().split("T")[0]!
                                        }
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

                        {form.watch("scheduledDate") !== TODAY_NOW &&
                          form.watch("scheduledDate") && (
                            <FormField
                              control={form.control}
                              name="scheduledTime"
                              render={({ field }) => {
                                const selectedDate =
                                  form.watch("scheduledDate");
                                const isToday = selectedDate === TODAY_DATE;
                                const timeSlots = isToday
                                  ? getTodayTimeSlots()
                                  : TIME_SLOTS;

                                return (
                                  <FormItem>
                                    <FormLabel className="text-foreground">
                                      Time
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={form.formState.isSubmitting}
                                      >
                                        <SelectTrigger className="border-input bg-background text-foreground h-11 rounded-xl sm:h-12">
                                          <SelectValue placeholder="Select a time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeSlots.map((time) => {
                                            const [hour, minute] = time
                                              .split(":")
                                              .map(Number);
                                            const d = new Date();
                                            d.setHours(hour!, minute!, 0, 0);
                                            return (
                                              <SelectItem
                                                key={time}
                                                value={time}
                                              >
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
                                );
                              }}
                            />
                          )}
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="border-border space-y-4 border-t pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className={cn(
                        "w-full rounded-xl py-6 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] sm:rounded-full sm:text-lg",
                        orderType === "call"
                          ? "bg-red-600 text-white shadow-red-500/25 hover:bg-red-700 dark:shadow-red-500/20"
                          : "bg-green-600 text-white shadow-green-500/25 hover:bg-green-700 dark:shadow-green-500/20",
                      )}
                      disabled={
                        form.formState.isSubmitting || checkout.isPending
                      }
                    >
                      {form.formState.isSubmitting || checkout.isPending ? (
                        <>
                          <Icons.Loader2 className="mr-2 size-5 animate-spin" />
                          {checkout.isPending
                            ? "Redirecting to payment..."
                            : "Processing..."}
                        </>
                      ) : (
                        <>
                          🎅{" "}
                          {orderType === "call"
                            ? "Book Santa Call"
                            : "Order Santa Video"}{" "}
                          — {orderType === "call" ? "$6.99" : "$4.99"}
                          <Icons.ArrowRight className="ml-2 size-5" />
                        </>
                      )}
                    </Button>
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 text-xs sm:flex-row sm:gap-4 sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Icons.Lock className="size-3.5 text-green-600 sm:size-4 dark:text-green-400" />
                        <span>Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.ShieldCheck className="size-3.5 text-green-600 sm:size-4 dark:text-green-400" />
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
