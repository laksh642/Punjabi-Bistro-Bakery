import React from 'react';
import { X, ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';

interface PolicyModalProps {
  policyType: 'delivery' | 'refund' | 'eggless' | 'privacy' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-emerald-200 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#0B2E15] text-white border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            <h2 className="font-serif text-lg font-bold text-white">
              {policyType === 'delivery' && 'Delivery Policy & Time Slots'}
              {policyType === 'refund' && 'Cancellation & Refund Policy'}
              {policyType === 'eggless' && '100% Pure Eggless Bakery Guarantee'}
              {policyType === 'privacy' && 'Customer Privacy & Data Protection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-xs sm:text-sm text-emerald-950/90 space-y-4 max-h-[70vh] overflow-y-auto leading-relaxed bg-white">
          {policyType === 'delivery' && (
            <>
              <p>
                <strong className="text-emerald-900">Delivery Timing:</strong> Normal delivery orders are dispatched within 25–40 minutes depending on kitchen queue and distance. During heavy rush hours or festival days, updates will be reflected on your live order tracker.
              </p>
              <p>
                <strong className="text-emerald-900">Delivery Zones & Pricing:</strong>
                <br />• <strong>Zone 1 (Dharamkot Town Center):</strong> ₹20 flat fee. Orders ₹299 and above enjoy 100% FREE delivery.
                <br />• <strong>Zone 2 (Town Outskirts / Kot Ise Khan Rd):</strong> ₹35 flat fee.
                <br />• <strong>Zone 3 (Nearby Villages & Outer Outskirts):</strong> ₹55 flat fee.
              </p>
              <p>
                <strong className="text-emerald-900">Contactless Delivery:</strong> Customers may opt for contactless delivery by ticking the option in checkout. Our rider will drop the order at your doorstep/gate and call your phone.
              </p>
            </>
          )}

          {policyType === 'refund' && (
            <>
              <p>
                <strong className="text-emerald-900">Order Cancellation:</strong> Because all hot food items (pasta, pizzas, burgers) and custom cakes are prepared immediately fresh to order, orders can only be cancelled within <strong>5 minutes</strong> of placement.
              </p>
              <p>
                <strong className="text-emerald-900">Issues & Replacements:</strong> If an item is delivered damaged, incorrect, or with significant quality issues, we will immediately offer a fresh replacement or a full refund via UPI or cash.
              </p>
              <p>
                <strong className="text-emerald-900">Custom Cake Deposits:</strong> Custom cakes requiring special fondant figurines or customized molds may require a token confirmation advance. If cancelled with more than 12 hours notice, advances are fully refundable.
              </p>
            </>
          )}

          {policyType === 'eggless' && (
            <>
              <p>
                <strong className="text-emerald-900">Pure Vegetarian & Eggless Promise:</strong> All celebration cakes, cupcakes, pastries, muffins, and dry bakery snacks prepared by Punjabi Bistro & Bakery are strictly 100% eggless.
              </p>
              <p>
                We maintain dedicated bakery prep surfaces, pure dairy cream, and high-grade cocoa/chocolate ensuring zero egg contamination.
              </p>
            </>
          )}

          {policyType === 'privacy' && (
            <>
              <p>
                <strong className="text-emerald-900">Customer Information:</strong> We only collect customer name, phone number, and address strictly for completing your order fulfillment and sending delivery notifications.
              </p>
              <p>
                We never sell, distribute, or share customer data with any third-party advertisers. All orders are stored securely in local business records.
              </p>
            </>
          )}
        </div>

        <div className="p-4 bg-emerald-50/80 border-t border-emerald-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
