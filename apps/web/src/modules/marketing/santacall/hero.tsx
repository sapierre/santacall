import Link from "next/link";

import { cn } from "@turbostarter/ui";
import { buttonVariants } from "@turbostarter/ui-web/button";
import { Icons } from "@turbostarter/ui-web/icons";

export const SantaHero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-green-50 pb-12 pt-24">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Snowflakes pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Cpath d='M30 30l-4-4 4-4 4 4-4 4zm0 0l4 4-4 4-4-4 4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Decorative circles */}
        <div className="absolute -left-20 top-20 size-96 rounded-full bg-red-100/50 blur-3xl" />
        <div className="absolute -right-20 top-40 size-96 rounded-full bg-green-100/50 blur-3xl" />
      </div>

      <div className="container relative mx-auto flex flex-col items-center justify-center px-6">
        {/* Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-gray-700">
              🎄 Create magical Christmas memories!
            </span>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="max-w-4xl text-center text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          Talk to{" "}
          <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            Santa
          </span>{" "}
          <span className="inline-block">🎅</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-center text-lg text-gray-600 sm:text-xl">
          Book a magical live video call or get a personalized video message from AI Santa.
          <br className="hidden sm:block" />
          Create unforgettable Christmas memories for your child!
        </p>

        {/* Quick action */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="#book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-red-600 px-8 py-6 text-lg font-semibold text-white shadow-lg shadow-red-200 transition-all hover:scale-105 hover:bg-red-700 hover:shadow-xl hover:shadow-red-200",
            )}
          >
            <Icons.Gift className="mr-2 size-5" />
            Book Now
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.ShieldCheck className="size-4 text-green-600" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.Clock className="size-4 text-red-600" />
            <span>Calls 4-8pm</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Icons.Video className="size-4 text-blue-600" />
            <span>Videos in 24hrs</span>
          </div>
        </div>

        {/* Pricing preview */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <Icons.Phone className="size-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Live Call</p>
                <p className="text-sm text-gray-500">3 min · $6.99</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                <Icons.Video className="size-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Video Message</p>
                <p className="text-sm text-gray-500">Personalized · $4.99</p>
              </div>
            </div>
          </div>
        </div>

        {/* Giving back callout */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-50 to-green-50 border border-red-100 px-5 py-2.5 shadow-sm">
          <Icons.Heart className="size-4 text-red-500" />
          <span className="text-sm font-medium text-gray-700">
            Every purchase donates a toy to a child in need
          </span>
          <Icons.Gift className="size-4 text-green-600" />
        </div>

        {/* Scroll indicator */}
        <div className="mt-12">
          <a href="#book" className="flex flex-col items-center gap-2 text-gray-400 transition-colors hover:text-gray-600">
            <span className="text-sm">Book below</span>
            <div className="animate-bounce">
              <Icons.ChevronDown className="size-6" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};
