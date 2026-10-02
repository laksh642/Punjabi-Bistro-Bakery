import React from 'react';
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  Car,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const LocationHoursSection: React.FC = () => {
  const { businessSettings, isStoreOpen } = useStore();

  const fullAddress = businessSettings.address || 'Near Udham Singh Chowk, Dharamkot, Punjab 142042';
  const landmarkText = businessSettings.landmark || 'Near Udham Singh Chowk';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${businessSettings.name} ${fullAddress}`
  )}`;

  return (
    <section id="location-section" className="py-16 bg-emerald-50/25 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full mb-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Visit Us in Person</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F2916] tracking-tight">
            Location, Hours & Directions
          </h2>
          <p className="text-sm text-emerald-800/80 mt-2">
            Centrally located at {landmarkText}. Easy drive-through, dine-in parking, and prompt takeaway pickup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Essential Contact & Opening Hours */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Live Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold text-sm text-[#0F2916]">
                    {isStoreOpen ? 'Currently Open For Dine-In & Delivery' : 'Currently Closed (Orders Paused)'}
                  </span>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
                  {businessSettings.weeklyOff || 'Open All 7 Days'}
                </span>
              </div>

              {/* Exact Address */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Physical Address</span>
                </div>
                <p className="text-base font-bold text-[#0F2916] leading-snug">
                  {fullAddress}
                </p>
                {businessSettings.landmark && (
                  <p className="text-xs text-emerald-850/80 mt-1 italic">
                    Landmark: {businessSettings.landmark}
                  </p>
                )}
              </div>

              {/* Hours Schedule */}
              <div className="space-y-2 pt-2 border-t border-emerald-100">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Daily Schedule</span>
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm text-emerald-950">
                  <div className="flex justify-between py-1 border-b border-emerald-50">
                    <span className="font-medium">Operating Hours:</span>
                    <span className="font-bold text-[#0F2916]">
                      {businessSettings.openingTime} – {businessSettings.closingTime}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium">Weekly Schedule:</span>
                    <span className="font-semibold text-stone-600">{businessSettings.weeklyOff || 'Open All 7 Days'}</span>
                  </div>
                </div>
              </div>

              {/* Available Facilities Badges */}
              <div className="pt-2 border-t border-emerald-100">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1">
                  <Car className="w-4 h-4 text-emerald-700" />
                  <span>Available Facilities</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-950/80">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Indoor Seated Dine-In</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Drive-Through Takeaway</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Fixed Zone Home Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Advance Party Booking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="pt-4 border-t border-emerald-100 flex flex-wrap gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                className="bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-950 font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>Call Counter</span>
              </a>

              <a
                href={`https://wa.me/${businessSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Simulated Interactive Map / Directions Card */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-emerald-950 mb-2">
                Visiting Dharamkot or Passing Through?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Whether you're travelling through Dharamkot or visiting from nearby areas, {businessSettings.name} at {landmarkText} is the easiest stop for freshly brewed coffee, hot cheesy pizza, and fresh cakes.
              </p>
            </div>

            {/* Visual Location Mockup Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-stone-800 border border-emerald-100">
              {/* Static visual representation of local street map */}
              <img
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
                alt="Map overview of location road"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-bold self-start mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{businessSettings.name}</span>
                </div>
                <div className="font-bold text-sm">
                  {fullAddress}
                </div>
                <div className="text-xs text-stone-300 mt-0.5">
                  Drive-through pick up spot available in front of bistro.
                </div>
              </div>

              {/* Pin indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="bg-white/95 text-emerald-950 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 shadow-xs">
                  Udham Singh Chowk
                </span>
              </div>
            </div>

            {/* Travel Guide Tip */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1.5">
              <div className="font-bold text-emerald-900">
                🚗 Delivery Coverage & Areas Served
              </div>
              <p className="text-stone-700 leading-relaxed">
                We provide fast delivery across Dharamkot town, Kot Ise Khan Road, Jalalabad Road outskirts, and surrounding villages. You can choose your exact zone during checkout for fixed pricing.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
