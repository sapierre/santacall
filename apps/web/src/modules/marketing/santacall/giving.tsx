import { Icons } from "@turbostarter/ui-web/icons";

export const SantaGiving = () => {
  return (
    <section className="relative bg-gradient-to-b from-green-50 to-white py-20">
      {/* Decorative top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          {/* Main content card */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl ring-1 ring-green-100 md:p-12">
            {/* Decorative background */}
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-red-50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-green-50 blur-3xl" />

            <div className="relative">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                <Icons.Heart className="size-4 text-red-500" />
                <span className="text-sm font-semibold text-green-800">
                  Spreading Christmas Joy
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Your Purchase Gives{" "}
                <span className="text-red-600">Twice</span>
              </h2>

              {/* Main message */}
              <p className="mt-4 text-lg text-gray-600">
                For every SantaCall video or live call purchased, we donate a toy to a child
                in need through our partner toy banks and nonprofit organizations. Your magical
                moment creates another one for a family who needs it most.
              </p>

              {/* Stats/Impact */}
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl bg-red-50 p-5 text-center">
                  <div className="text-3xl font-bold text-red-600">1:1</div>
                  <div className="mt-1 text-sm font-medium text-gray-700">
                    One toy donated per purchase
                  </div>
                </div>
                <div className="rounded-2xl bg-green-50 p-5 text-center">
                  <div className="text-3xl font-bold text-green-600">15+</div>
                  <div className="mt-1 text-sm font-medium text-gray-700">
                    Years in nonprofit work
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-5 text-center">
                  <div className="flex items-center justify-center gap-1 text-3xl font-bold text-amber-600">
                    <Icons.ShieldCheck className="size-7" />
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-700">
                    Trusted partners
                  </div>
                </div>
              </div>

              {/* Trust section */}
              <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icons.Award className="size-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Why Trust Us?
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Our founder has over 15 years of experience in the nonprofit sector,
                      working with established toy banks, children&apos;s charities, and community
                      organizations. We&apos;ve built trusted relationships with partners who ensure
                      every donated toy reaches a child who needs it. This isn&apos;t marketing -
                      it&apos;s our mission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to action text */}
              <p className="mt-6 text-center text-sm text-gray-500">
                By choosing SantaCall, you&apos;re not just creating magic for your child -
                you&apos;re spreading Christmas joy to children everywhere.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
