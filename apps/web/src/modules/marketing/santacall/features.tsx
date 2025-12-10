import { Icons } from "@turbostarter/ui-web/icons";

const features = [
  {
    icon: Icons.Calendar,
    title: "You Pick the Time",
    description:
      "Schedule between 4–8pm, up to 7 days in advance. Just 2 hours lead time needed.",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    icon: Icons.Video,
    title: "Hyper-Realistic AI",
    description:
      "Powered by Tavus CVI. Santa sees, hears, and responds naturally in real-time.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Icons.ShieldCheck,
    title: "Safe & Secure",
    description:
      "Family-friendly conversations. Secure Stripe payments. Your data stays private.",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: Icons.Smartphone,
    title: "Works Everywhere",
    description:
      "Phone, tablet, or computer. Just click your magic link — no app needed.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

export const SantaFeatures = () => {
  return (
    <section className="relative bg-white py-24">
      {/* Decorative top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
            ✨ Why Choose SantaCall?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Magic Made{" "}
            <span className="text-red-600">Simple</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need for the perfect Santa experience.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`mb-4 inline-flex size-14 items-center justify-center rounded-xl ${feature.bgColor}`}>
                <feature.icon className={`size-7 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
