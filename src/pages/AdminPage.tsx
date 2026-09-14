import React from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AdminPage: React.FC = () => {
  const { setIsAdminView } = useStore();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner with Quick Storefront Switcher */}
      <div className="bg-emerald-950 text-white text-xs py-2 px-4 border-b border-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Staff Portal: Punjabi Bistro & Bakery Dharamkot</span>
        </div>
        <Link
          to="/"
          onClick={() => setIsAdminView(false)}
          className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <Store className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </Link>
      </div>

      <AdminDashboard />
    </div>
  );
};
