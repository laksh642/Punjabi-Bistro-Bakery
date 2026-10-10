import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchCustomerProfileFromCloud, saveCustomerProfileToCloud } from '../lib/supabase';
import { PunjabiBistroLogo } from '../components/PunjabiBistroLogo';

/**
 * Dedicated Customer OAuth Callback Handler for Punjabi Bistro & Bakery.
 * Standard Supabase PKCE / token authorization processor.
 * 
 * - Handles ?code=... via supabase.auth.exchangeCodeForSession(code)
 * - Handles #access_token=... via supabase.auth.setSession(...)
 * - Handles error / error_description query/hash parameters
 * - Ensures Supabase session has been verified and persisted BEFORE navigating to "/"
 * - Never leaves customer stranded and never permits duplicate exchanges
 */
export const AuthCallbackHandler: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function handleAuthCallback() {
      try {
        const rawHash = window.location.hash.replace(/^#/, '');
        const rawSearch = window.location.search.replace(/^\?/, '');
        const hashParams = new URLSearchParams(rawHash);
        const searchParams = new URLSearchParams(rawSearch);

        // Check for error parameters first
        const errorDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error');

        if (errorDesc) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
          }
          return;
        }

        const code = searchParams.get('code') || hashParams.get('code');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

        let authenticatedSession = null;

        // 1. PKCE Flow: exchange code for session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // Check if code was already exchanged by supabase client internal listener
            const { data: currentSessionData } = await supabase.auth.getSession();
            if (currentSessionData?.session?.user) {
              authenticatedSession = currentSessionData.session;
            } else {
              throw error;
            }
          } else if (data?.session) {
            authenticatedSession = data.session;
          }
        }
        // 2. Implicit / direct token flow
        else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data?.session) {
            authenticatedSession = data.session;
          }
        }
        // 3. Fallback: inspect if Supabase client already parsed and established session
        else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session) {
            authenticatedSession = data.session;
          }
        }

        if (authenticatedSession?.user) {
          // Initialize customer profile if not already present
          try {
            const user = authenticatedSession.user;
            const existingProfile = await fetchCustomerProfileFromCloud(user.id);
            if (!existingProfile) {
              const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer';
              await saveCustomerProfileToCloud({
                userId: user.id,
                fullName: metaName,
                email: user.email || '',
                city: 'Dharamkot',
                state: 'Punjab',
                pincode: '142042',
              });
            }
          } catch (profileErr) {
            console.warn('Customer profile initialization notice:', profileErr);
          }

          if (!isCancelled) {
            setStatus('success');
            // Clean up URL parameters/hash before redirecting to clean root
            try {
              window.history.replaceState(null, '', '/');
            } catch {}

            // Smooth transition back to storefront
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 600);
          }
        } else {
          // If no session was established and no code/token was present
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage('No authentication credentials found in the callback request.');
          }
        }
      } catch (err: any) {
        console.error('Customer AuthCallbackHandler error:', err);
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err?.message || 'Failed to complete sign-in with Google. Please try again.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B2E15] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-900/80 border border-emerald-900/60 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="flex justify-center mb-6">
          <PunjabiBistroLogo className="w-16 h-16 rounded-full bg-white p-1.5 shadow-lg" />
        </div>

        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-serif font-bold text-amber-400">Signing In to Punjabi Bistro</h2>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Completing secure authentication and setting up your customer profile...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
              ✓
            </div>
            <h2 className="text-xl font-serif font-bold text-amber-400">Welcome to Punjabi Bistro!</h2>
            <p className="text-xs text-emerald-100 leading-relaxed">
              You are signed in successfully. Redirecting you to the bistro storefront...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-rose-300">Authentication Notice</h2>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                {errorMessage || 'Unable to complete sign-in at this time.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
