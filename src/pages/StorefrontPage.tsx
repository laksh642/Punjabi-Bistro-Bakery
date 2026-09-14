import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { TrustStrip } from '../components/TrustStrip';
import { MoodCravingSelector } from '../components/MoodCravingSelector';
import { BestsellersSection } from '../components/BestsellersSection';
import { MenuSection } from '../components/MenuSection';
import { CustomCakeStudio } from '../components/CustomCakeStudio';
import { ReviewsSection } from '../components/ReviewsSection';
import { GallerySection } from '../components/GallerySection';
import { AboutSection } from '../components/AboutSection';
import { LocationHoursSection } from '../components/LocationHoursSection';
import { FAQSection } from '../components/FAQSection';
import { Footer } from '../components/Footer';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { CartDrawer } from '../components/CartDrawer';
import { OrderTrackingModal } from '../components/OrderTrackingModal';
import { OrderIssueModal } from '../components/OrderIssueModal';
import { DigitalQrMenuModal } from '../components/DigitalQrMenuModal';
import { EgglessMovingBar } from '../components/EgglessMovingBar';

export const StorefrontPage: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <Hero />
        {/* Animated 100% Pure Eggless Moving Ticker Bar */}
        <EgglessMovingBar />
        <TrustStrip />
        <MoodCravingSelector
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
        />
        <BestsellersSection />
        <MenuSection
          selectedMood={selectedMood}
          onClearMood={() => setSelectedMood(null)}
        />
        <CustomCakeStudio />
        <ReviewsSection />
        <GallerySection />
        <AboutSection />
        <LocationHoursSection />
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile Bottom Bar */}
      <MobileBottomBar />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <OrderTrackingModal />
      <OrderIssueModal />
      <DigitalQrMenuModal />
    </div>
  );
};
