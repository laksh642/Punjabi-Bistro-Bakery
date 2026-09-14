import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Are all your bakery items and celebration cakes 100% eggless?',
    answer:
      'Yes, absolutely. Our entire bakery lineup — including chocolate truffle cakes, birthday pastries, stuffed patties, cookies, and cupcakes — is 100% pure vegetarian and eggless. We use premium dairy cream, fresh fruit compotes, and Belgian chocolate.',
  },
  {
    question: 'How do your delivery zones and charges work in Dharamkot?',
    answer:
      'We have transparent, fixed delivery zones: Zone 1 (Dharamkot town center) is ₹20 flat and completely FREE on orders above ₹299. Zone 2 (Outskirts & Kot Ise Khan Road) is ₹35. Zone 3 (Nearby villages & rural outskirts) is ₹55. You see your exact fee before ordering with zero surprise charges.',
  },
  {
    question: 'How much advance notice is required for custom designer cakes?',
    answer:
      'For standard birthday cakes, we have fresh cakes available daily for instant 30-minute delivery or pickup. For custom fondant, multi-tier, or themed celebration cakes, we recommend 4 to 24 hours advance notice. You can submit your reference photo through our Custom Cake Studio and we confirm immediately.',
  },
  {
    question: 'How do you handle order preparation and delivery delays?',
    answer:
      'Because every savory dish (pastas, pizzas, wraps) is prepared fresh to order, busy kitchen hours can occasionally add a few minutes. To keep you informed, our live tracker proactively alerts you if a batch is taking extra time, and you can call or WhatsApp our counter directly anytime.',
  },
  {
    question: 'What payment methods can I use?',
    answer:
      'We accept Cash on Delivery / Cash at Counter, as well as instant UPI (Google Pay, PhonePe, Paytm, BHIM) to our official UPI handle punjabibistro@upi. You can also pay by card or cash during dine-in.',
  },
  {
    question: 'Do you offer dine-in and drive-through facilities?',
    answer:
      'Yes! We have comfortable indoor air-conditioned seating for families, friends, and birthday parties. If you are in a vehicle, you can also place a takeaway order in advance and pick it up right in front of our bistro near Udham Singh Chowk without waiting.',
  },
];

export const FAQSection: React.FC = () => {
  const { businessSettings, setIsIssueModalOpen } = useStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-16 bg-white border-t border-emerald-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full mb-2">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>Clear Answers</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F2916] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-emerald-800/80 mt-2">
            Everything you need to know about our ingredients, custom cakes, and Dharamkot delivery.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-emerald-50/35 border border-emerald-100 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-[#0F2916] flex items-center justify-between gap-4 cursor-pointer hover:text-emerald-800 transition-colors"
                >
                  <span>{faq.question}</span>
                  <div className="p-1 rounded-full bg-white text-emerald-750 flex-shrink-0 shadow-2xs">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-emerald-950/80 leading-relaxed border-t border-emerald-100 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Fallback */}
        <div className="mt-10 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-sm text-[#0F2916]">
              Still have a question or special event requirement?
            </div>
            <div className="text-xs text-emerald-800/80 mt-0.5">
              Call us directly at {businessSettings.phone} or chat on WhatsApp.
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${businessSettings.whatsapp}?text=Hi%20Punjabi%20Bistro%2C%20I%20have%20a%20question`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask on WhatsApp</span>
            </a>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-white border border-emerald-200 hover:bg-emerald-50 text-[#0F2916] text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Report Issue
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
