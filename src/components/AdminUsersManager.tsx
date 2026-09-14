import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { fetchAdminUsers, saveAdminUser, deleteAdminUser } from '../lib/supabase';
import { AdminUser } from '../types';

export const AdminUsersManager: React.FC = () => {
  const { user: currentAuthUser, adminRecord, adminRole } = useAdminAuth();
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'owner' | 'manager'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAdminUsers();
      setAdminList(list);
    } catch (err: unknown) {
      console.warn('Could not load admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newUserId.trim()) {
      setActionError('Both Google account email and Supabase Auth User ID (UUID) are required.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const ok = await saveAdminUser({
        id: newUserId.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        isActive: true,
      });

      if (ok) {
        setActionSuccess(`Admin permissions granted to ${newEmail.trim()}!`);
        setNewEmail('');
        setNewUserId('');
        await loadAdmins();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError('Failed to save administrator to database. Check Supabase RLS permissions.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to authorize user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (id === currentAuthUser?.id) {
      alert('You cannot revoke your own administrator account while logged in.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      return;
    }

    try {
      const ok = await deleteAdminUser(id);
      if (ok) {
        setActionSuccess(`Admin permissions revoked for ${email}.`);
        await loadAdmins();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError('Failed to delete administrator record.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error revoking user');
    }
  };

  return (
    <div className="pt-6 border-t border-emerald-100 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-emerald-950 flex items-center gap-2">
              <span>Admin Access & Google OAuth Management</span>
              <span className="text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                RLS Enforced
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Only verified Google accounts listed below can log into this operations portal. Passwords have been retired.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAdmins}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Team</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Active Admins List */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-600">
          <span>Authorized Google Administrators ({adminList.length})</span>
          <span className="text-[11px] font-normal lowercase text-stone-400">table: public.admin_users</span>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <span>Loading admin allowlist...</span>
          </div>
        ) : adminList.length === 0 ? (
          <div className="p-4 rounded-xl bg-white border border-stone-200 text-center text-xs text-stone-500">
            No administrators found in `public.admin_users`. If you just set up the schema, insert the owner account using the SQL provided in the Setup tab.
          </div>
        ) : (
          <div className="space-y-2">
            {adminList.map((adm) => {
              const isCurrentUser = adm.id === currentAuthUser?.id;
              return (
                <div
                  key={adm.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isCurrentUser ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{adm.email}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {adm.role}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white">
                          You (Current)
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-stone-400">UUID: {adm.id}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Access
                    </span>

                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleDelete(adm.id, adm.email)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Revoke Admin Permissions"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grant Access to New Administrator */}
      <form onSubmit={handleAddAdmin} className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-800" />
          <h4 className="font-serif font-bold text-sm text-emerald-950">
            Authorize New Staff or Owner Google Account
          </h4>
        </div>

        <p className="text-xs text-stone-500">
          Have the team member click "Continue with Google" once on the login screen to generate their Supabase Auth UUID, then enter their details below to grant permanent access.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Google Account Email *
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. staff@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Supabase Auth UUID *
            </label>
            <input
              type="text"
              required
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="e.g. e84c47b5-..."
              className="w-full font-mono px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950 font-semibold"
            >
              <option value="admin">Administrator</option>
              <option value="owner">Bakery Owner</option>
              <option value="manager">Kitchen Manager</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting || !newEmail.trim() || !newUserId.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Authorizing...' : 'Grant Admin Authorization'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
