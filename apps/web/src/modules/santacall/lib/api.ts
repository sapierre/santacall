import type { CreateBookingInput } from "@turbostarter/api/schema";

const KEY = "santacall";

// Response types for SantaCall API
interface CheckoutResponse {
  checkoutUrl: string;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  orderType: "video" | "call";
  status: string;
  childName: string;
  childAge: number;
  interests: string[];
  specialMessage: string | null;
  deliveryUrl: string | null;
  scheduledAt: string | null;
  timezone: string | null;
  createdAt: string;
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const queries = {
  /**
   * Look up an order by number and token (for delivery page)
   */
  order: (orderNumber: string, token: string) => ({
    queryKey: [KEY, "order", orderNumber, token] as const,
    queryFn: async (): Promise<OrderResponse> => {
      const res = await fetch(
        `${getBaseUrl()}/api/santacall/order?orderNumber=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(token)}`,
        {
          credentials: "include",
          headers: {
            "x-client-platform": "web-client",
          },
        },
      );
      if (!res.ok) {
        throw new Error("Failed to fetch order");
      }
      return res.json() as Promise<OrderResponse>;
    },
  }),
};

const mutations = {
  /**
   * Create a checkout session for booking
   */
  checkout: {
    mutationKey: [KEY, "checkout"],
    mutationFn: async (
      input: CreateBookingInput,
    ): Promise<CheckoutResponse> => {
      const res = await fetch(`${getBaseUrl()}/api/santacall/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-client-platform": "web-client",
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || "Checkout failed",
        );
      }
      return res.json() as Promise<CheckoutResponse>;
    },
  },
};

export const santacall = {
  queries,
  mutations,
};
