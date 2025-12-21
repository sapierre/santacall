import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@turbostarter/ui-web/accordion";
import { buttonVariants } from "@turbostarter/ui-web/button";
import { Icons } from "@turbostarter/ui-web/icons";

const faqs = [
  {
    question: "When can I book a Santa call?",
    answer:
      "Santa calls are available between 4–8pm in your timezone. You need at least 2 hours lead time, and you can schedule up to 7 days in advance.",
  },
  {
    question: "How long is the call?",
    answer:
      "Each Santa call is approximately 3 minutes — perfect for a magical conversation without overwhelming little ones.",
  },
  {
    question: "What if I need to reschedule?",
    answer:
      "Contact our support team at least 1 hour before your scheduled call. We'll help you find a new time.",
  },
  {
    question: "How do I join the call?",
    answer:
      "After booking, you'll get an email with a magic link. Just click it on any device when it's time — no app needed!",
  },
  {
    question: "What's the difference between video and call?",
    answer:
      "A Video ($4.99) is a pre-recorded personalized message delivered within 24 hours. A Call ($6.99) is a live, interactive 3-minute conversation where your child talks to Santa in real-time.",
  },
  {
    question: "Is it safe for my child?",
    answer:
      "Absolutely! Our AI Santa is family-friendly and designed for all ages. Parents should be present during calls.",
  },
  {
    question: "How does the toy donation work?",
    answer:
      "For every SantaCall video or live call purchased, we donate a toy to a child in need through our partner toy banks and nonprofit organizations. Our founder has over 15 years of experience in the nonprofit sector with trusted partners who ensure every toy reaches a child who needs it.",
  },
];

export const SantaFaq = () => {
  return (
    <section className="relative bg-gradient-to-b from-white to-green-50 py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          {/* Section header */}
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              ❓ Got Questions?
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Frequently Asked <span className="text-green-600">Questions</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about SantaCall.
            </p>
          </div>

          {/* FAQ accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 shadow-sm data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-gray-900 hover:no-underline [&>svg]:text-gray-400">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact CTA */}
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="mb-2 text-xl font-semibold text-gray-900">
              Still have questions? 🤔
            </p>
            <p className="mb-6 text-gray-600">
              Our friendly support team is here to help!
            </p>
            <Link
              href="/contact"
              className={buttonVariants({
                className:
                  "rounded-full bg-red-600 text-white hover:bg-red-700",
              })}
            >
              <Icons.Mail className="mr-2 size-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
