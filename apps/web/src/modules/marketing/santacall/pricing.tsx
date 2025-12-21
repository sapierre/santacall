import Link from "next/link";

import { cn } from "@turbostarter/ui";
import { buttonVariants } from "@turbostarter/ui-web/button";
import { Icons } from "@turbostarter/ui-web/icons";

const plans = [
  {
    name: "Santa Video",
    price: "$4.99",
    description: "A personalized video message from Santa",
    features: [
      "Personalized with child's name",
      "Mentions their interests & wishes",
      "Download & share forever",
      "Delivered within 24 hours",
    ],
    cta: "Order Video",
    href: "/book?type=video",
    popular: false,
    icon: Icons.Video,
    emoji: "🎬",
  },
  {
    name: "Santa Call",
    price: "$6.99",
    description: "Live 3-minute video call with AI Santa",
    features: [
      "Real-time interactive conversation",
      "Santa sees & responds to your child",
      "Schedule between 4–8pm",
      "Works on any device",
      "Magical memories guaranteed",
    ],
    cta: "Schedule Call",
    href: "/book?type=call",
    popular: true,
    icon: Icons.Phone,
    emoji: "📞",
  },
];

export const SantaPricing = () => {
  return (
    <section className="relative bg-white py-24">
      {/* Decorative elements */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
            💰 Simple Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Choose Your <span className="text-red-600">Experience</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No subscriptions. No hidden fees. Just Christmas magic!
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative overflow-hidden rounded-3xl border-2 p-8 transition-all duration-300 hover:-translate-y-1",
                plan.popular
                  ? "border-red-300 bg-gradient-to-b from-red-50 to-white shadow-xl shadow-red-100"
                  : "border-gray-200 bg-white shadow-lg hover:shadow-xl",
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-6 -right-12 rotate-45 bg-red-600 px-12 py-1 text-xs font-semibold text-white shadow-lg">
                  POPULAR
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl">{plan.emoji}</span>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="ml-2 text-gray-500">one-time</span>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Icons.Check
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        plan.popular ? "text-green-600" : "text-green-500",
                      )}
                    />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full rounded-full text-center text-lg",
                  plan.popular
                    ? "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700"
                    : "border-2 border-green-600 bg-white text-green-700 hover:bg-green-50",
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mx-auto mt-12 flex w-fit items-center justify-center gap-2 rounded-full bg-green-50 px-6 py-3 text-sm text-green-700">
          <Icons.ShieldCheck className="size-5" />
          <span className="font-medium">
            100% satisfaction guaranteed or your money back
          </span>
        </div>
      </div>
    </section>
  );
};
