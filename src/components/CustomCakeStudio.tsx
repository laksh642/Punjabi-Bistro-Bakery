import React, { useState } from 'react';
import {
  Cake,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CAKE_OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Wedding / Ring Ceremony',
  'Baby Shower / 1st Birthday',
  'Graduation & Success',
  'Kids Theme / Cartoon',
  'Bachelorette / Farewell',
  'Custom Theme / Milestone',
];

export const CAKE_FLAVOURS = [
  'Belgian Chocolate Truffle',
  'Classic Black Forest',
  'Fresh Pineapple & Cream',
  'Red Velvet & Cream Cheese',
  'Butterscotch Crunch',
  'Fresh Fruit Delight',
  'Dark Chocolate Ganache',
  'Blueberry Vanilla Swirl',
];

export const CAKE_SHAPES = [
  'Round (Classic)',
  'Heart Shaped',
  'Square / Rectangle',
  '2-Tier Celebration',
  '3-Tier Grand',
  'Custom 3D / Number Shape',
];

export const CustomCakeStudio: React.FC = () => {
  const { submitCakeEnquiry, businessSettings } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [occasion, setOccasion] = useState(CAKE_OCCASIONS[0]);
  const [eventDate, setEventDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('04:00 PM');
  const [servings, setServings] = useState('10-12 people');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [flavour, setFlavour] = useState(CAKE_FLAVOURS[0]);
  const [shape, setShape] = useState(CAKE_SHAPES[0]);
  const [themeDescription, setThemeDescription] = useState('');
  const [colorPreference, setColorPreference] = useState('');
  const [messageOnCake, setMessageOnCake] = useState('Happy Birthday!');
  const [isEggless, setIsEggless] = useState(true);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [approximateBudget, setApproximateBudget] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submittedEnquiryNumber, setSubmittedEnquiryNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check if date is today or tomorrow (Advance alert)
  const isAdvanceAlertNeeded = React.useMemo(() => {
    if (!eventDate) return false;
    const selected = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffHours = (selected.getTime() - today.getTime()) / (1000 * 3600);
    return diffHours < 24;
  }, [eventDate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Please enter your name and contact phone number');
      return;
    }
    if (!eventDate) {
      setFormError('Please select the celebration date');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const enquiry = submitCakeEnquiry({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerWhatsApp: customerWhatsApp.trim() || customerPhone.trim(),
      occasion,
      eventDate,
      preferredTime,
      servings,
      weightKg,
      flavour,
      shape,
      themeDescription: themeDescription.trim() || 'Classic bakery styling',
      colorPreference: colorPreference.trim() || 'As per bakery design',
      messageOnCake: messageOnCake.trim(),
      isEggless,
      referenceImage: referenceImage || undefined,
      approximateBudget: approximateBudget ? Number(approximateBudget) : undefined,
      additionalNotes: additionalNotes.trim(),
    });

    setIsSubmitting(false);
    setSubmittedEnquiryNumber(enquiry.enquiryNumber);
  };

  return (
    <section id="custom-cake-section" className="py-16 bg-emerald-50/30 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Cake className="w-4 h-4 text-emerald-700" />
            <span>Dedicated Cake Studio • Dharamkot</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2916] tracking-tight">
            Custom Celebration Cakes
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 mt-3 leading-relaxed">
            From 1st birthdays and anniversaries to themed celebration tiers — all 100% eggless with rich dairy cream and Belgian chocolate. Submit your design or reference image for transparent review and quotation.
          </p>
        </div>

        {submittedEnquiryNumber ? (
          /* Confirmation State */
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto text-center shadow-lg space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-950">
              Cake Enquiry Received!
            </h3>

            <div className="bg-emerald-50 rounded-2xl p-4 inline-block border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Enquiry Tracking ID
              </span>
              <span className="font-mono text-2xl font-bold text-emerald-700">
                #{submittedEnquiryNumber}
              </span>
            </div>

            <p className="text-sm text-emerald-900/80 leading-relaxed max-w-lg mx-auto">
              Our master baker at Punjabi Bistro & Bakery will review your occasion, cake size, and design details. You will receive an exact quotation and confirmation on WhatsApp / Call.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/${businessSettings.whatsapp}?text=Hello%20Punjabi%20Bistro%2C%20I%20just%20submitted%20Custom%20Cake%20Enquiry%20%23${submittedEnquiryNumber}%20for%20${encodeURIComponent(
                  customerName
                )}.%20Please%20review%20my%20request.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm on WhatsApp</span>
              </a>

              <button
                onClick={() => setSubmittedEnquiryNumber(null)}
                className="bg-white border border-emerald-200 text-emerald-900 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Custom Cake Builder Form + Live Cake Canvas */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left: Interactive Live Cake Canvas & Transparency Warning */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Live Cake Message Preview
                  </span>
                  <span className="text-[11px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-medium">
                    100% Eggless
                  </span>
                </div>

                {/* Illustrated Cake Canvas */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-b from-[#092612] to-[#04150A] flex flex-col items-center justify-center p-6 text-center border-2 border-emerald-800/40 shadow-inner">
                  {/* Background soft cake image */}
                  <img
                    src="https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=700&q=80"
                    alt="Cake background preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
                  />

                  {/* Cake Plate & Frosting Visual */}
                  <div className="relative z-10 w-full max-w-xs bg-emerald-950/80 border border-emerald-600/50 rounded-2xl p-4 backdrop-blur-xs text-white">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold mb-1">
                      {shape} • {weightKg} Kg
                    </div>
                    <div className="font-serif italic text-lg sm:text-xl font-bold text-emerald-100 min-h-[3.5rem] flex items-center justify-center px-2 py-1 leading-snug drop-shadow-md">
                      "{messageOnCake || 'Your Cake Message'}"
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-800/80 text-[11px] text-emerald-200/90 flex items-center justify-between">
                      <span>{flavour}</span>
                      <span>{occasion}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-emerald-200/70 mt-4 relative z-10">
                    *Approximate preview of text piping on your cake
                  </p>
                </div>

                {/* Prompt Mandated Quality Advisory */}
                <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-950 text-xs space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Our Transparent Custom Cake Promise</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Reference images help us understand your preferred aesthetic. Final decorations may vary slightly depending on seasonal ingredients, natural food colours, and structural feasibility.
                  </p>
                  <p className="leading-relaxed text-[11px] font-medium text-emerald-950">
                    We calculate fair pricing and confirm your exact quotation before baking — never any surprise charges.
                  </p>
                </div>
              </div>

              {/* Reference Image Upload Card */}
              <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm">
                <label className="block font-bold text-sm text-emerald-950 mb-2 flex items-center justify-between">
                  <span>Upload Reference / Inspiration Image</span>
                  <span className="text-xs font-normal text-emerald-700">JPG, PNG, WEBP</span>
                </label>

                {referenceImage ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-200 bg-stone-100">
                    <img
                      src={referenceImage}
                      alt="Uploaded cake reference"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 bg-stone-900/80 hover:bg-stone-900 text-white text-xs px-2.5 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-emerald-50/30 hover:bg-emerald-50">
                    <Upload className="w-7 h-7 text-emerald-700 mb-2" />
                    <span className="text-xs font-semibold text-emerald-950">
                      Click to upload cake design image
                    </span>
                    <span className="text-[11px] text-emerald-700 mt-1">
                      Max file size: 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right: Detailed Structured Enquiry Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Customer Info */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-emerald-950 mb-3 pb-2 border-b border-emerald-100">
                    1. Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Jaspreet Brar"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 98551 12233"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        WhatsApp Number (For instant quotation & photos)
                      </label>
                      <input
                        type="tel"
                        value={customerWhatsApp}
                        onChange={(e) => setCustomerWhatsApp(e.target.value)}
                        placeholder="Leave blank if same as phone"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Occasion & Schedule */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-emerald-950 mb-3 pb-2 border-b border-emerald-100">
                    2. Occasion & Celebration Timing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Occasion
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      >
                        {CAKE_OCCASIONS.map((occ) => (
                          <option key={occ} value={occ}>
                            {occ}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Celebration Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Preferred Delivery Time
                      </label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      >
                        <option value="12:00 PM - 02:00 PM">Noon (12:00 PM - 02:00 PM)</option>
                        <option value="02:00 PM - 04:00 PM">Afternoon (02:00 PM - 04:00 PM)</option>
                        <option value="04:00 PM - 06:00 PM">Evening (04:00 PM - 06:00 PM)</option>
                        <option value="06:00 PM - 08:00 PM">Night (06:00 PM - 08:00 PM)</option>
                        <option value="08:00 PM - 10:00 PM">Late Night (08:00 PM - 10:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Advance Warning Alert if date is today */}
                  {isAdvanceAlertNeeded && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Short notice notice:</strong> Custom multi-tier or complex fondant cakes usually require advance preparation. If needed today, please submit and WhatsApp us immediately at <strong>098562 04951</strong> to confirm quick feasibility.
                      </span>
                    </div>
                  )}
                </div>

                {/* Section 3: Cake Specs */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-emerald-950 mb-3 pb-2 border-b border-emerald-100">
                    3. Cake Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Flavour Preference
                      </label>
                      <select
                        value={flavour}
                        onChange={(e) => setFlavour(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      >
                        {CAKE_FLAVOURS.map((flv) => (
                          <option key={flv} value={flv}>
                            {flv}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Weight / Servings
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0.5, 1, 1.5, 2].map((w) => (
                          <button
                            type="button"
                            key={w}
                            onClick={() => {
                              setWeightKg(w);
                              setServings(`${Math.round(w * 8)}-${Math.round(w * 10)} people`);
                            }}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              weightKg === w
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {w} Kg
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Cake Shape
                      </label>
                      <select
                        value={shape}
                        onChange={(e) => setShape(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      >
                        {CAKE_SHAPES.map((sh) => (
                          <option key={sh} value={sh}>
                            {sh}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Estimated Budget (Optional, ₹)
                      </label>
                      <input
                        type="number"
                        value={approximateBudget}
                        onChange={(e) => setApproximateBudget(e.target.value)}
                        placeholder="e.g. 1000 - 1500"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Message to Write on Cake *
                      </label>
                      <input
                        type="text"
                        value={messageOnCake}
                        onChange={(e) => setMessageOnCake(e.target.value)}
                        placeholder="e.g. Happy 1st Birthday Fateh!"
                        maxLength={40}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                        Theme Description & Special Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g. Pastel blue background with fondant teddy bear topper, deliver to banquet hall near Udham Singh Chowk"
                        className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Cake className="w-5 h-5" />
                    <span>Submit Custom Cake Enquiry</span>
                  </button>
                  <p className="text-[11px] text-center text-emerald-700/80 mt-2">
                    No payment needed now • We provide quotation & confirm availability first
                  </p>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
