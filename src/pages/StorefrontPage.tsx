import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { FoodAnimationHero } from '../components/FoodAnimationHero';
import { CategoryCircleNav } from '../components/CategoryCircleNav';
import { TopOffersStrip } from '../components/TopOffersStrip';
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
        {/* Playful, Modern Food-Related Animations & Showcase (Pizza, Burger, Cakes) */}
        <FoodAnimationHero />

        {/* Animated 100% Pure Eggless Moving Ticker Bar */}
        <EgglessMovingBar />

        {/* Top Promotional Offers & Discount Code Ticker */}
        <TopOffersStrip />

        {/* Circular Visual Category Discovery */}
        <CategoryCircleNav />

        {/* Trust & Quality Highlights */}
        <TrustStrip />

        {/* Mood & Craving Discovery */}
        <MoodCravingSelector
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
        />

        {/* Trending & Bestselling Dishes */}
        <BestsellersSection />

        {/* Interactive Menu Section */}
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
