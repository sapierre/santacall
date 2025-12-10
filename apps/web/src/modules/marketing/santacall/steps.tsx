import { Icons } from "@turbostarter/ui-web/icons";

const steps = [
  {
    number: "1",
    title: "Choose Your Experience",
    description: "Live call ($29.99) or video message ($14.99)",
    icon: Icons.Gift,
    emoji: "🎁",
  },
  {
    number: "2",
    title: "Pick Your Time",
    description: "Select a slot between 4–8pm",
    icon: Icons.Calendar,
    emoji: "📅",
  },
  {
    number: "3",
    title: "Pay Securely",
    description: "Quick checkout with Stripe",
    icon: Icons.CreditCard,
    emoji: "💳",
  },
  {
    number: "4",
    title: "Get Your Magic Link",
    description: "Click to connect when ready!",
    icon: Icons.Mail,
    emoji: "✉️",
  },
];

export const SantaSteps = () => {
  return (
    <section className="relative bg-gradient-to-b from-white to-red-50 py-24">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">
            🎄 Simple Process
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            How It{" "}
            <span className="text-green-600">Works</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Four easy steps to Christmas magic!
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line on desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute left-full top-12 hidden h-0.5 w-6 bg-red-200 lg:block" />
                )}

                {/* Step card */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  {/* Number badge */}
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white shadow-lg shadow-red-200">
                    {step.number}
                  </div>

                  {/* Emoji */}
                  <div className="mb-3 text-3xl">{step.emoji}</div>

                  {/* Content */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro tip */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-green-800">
              <span className="font-semibold">💡 Pro tip:</span> Book at least 2
              hours before your desired call time. Santa needs a moment to check
              his list!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
