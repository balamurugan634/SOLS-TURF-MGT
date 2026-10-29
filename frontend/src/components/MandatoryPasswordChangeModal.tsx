import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MandatoryPasswordChangeModal: React.FC = () => {
  const { user, mustChangePassword, refreshUser, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (!user || !mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      // Show success screen, then auto-dismiss after 2s
      setSuccess(true);
      setDismissing(false);
      setTimeout(async () => {
        setDismissing(true);
        await refreshUser();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = () => {
    if (!success) logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 text-white text-center transition-all duration-500 ${success ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-[#064E3B] to-[#166534]'}`}>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            {success
              ? <CheckCircle className="w-7 h-7 text-white" />
              : <KeyRound className="w-7 h-7 text-[#22c55e]" />
            }
          </div>
          <h2 className="text-xl font-bold">
            {success ? 'Password Updated!' : 'First Login: Change Password'}
          </h2>
          <p className="text-white/90 text-sm mt-1">
            {success
              ? 'Your account is now fully set up. Redirecting you to your dashboard...'
              : <>Welcome to TurfHub, <span className="font-semibold">{user.name}</span>! For your security, you must update your temporary password before managing your turfs.</>
            }
          </p>
        </div>

        {/* SUCCESS SCREEN */}
        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              {dismissing
                ? <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                : <CheckCircle className="w-8 h-8 text-emerald-500" />
              }
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">You're all set, {user.name}!</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Password updated successfully. You now have full access to your account.
            </p>
            <div className="mt-5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-1 bg-emerald-500 rounded-full animate-[progress_2s_linear_forwards]" style={{ animation: 'width 2s linear forwards' }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Redirecting to dashboard...</p>
          </div>
        ) : (
          /* FORM SCREEN */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Current / Temporary Password
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="e.g. tempPass#2026"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#166534] hover:bg-[#064E3B] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating Password...</>
                  : <>Save Password &amp; Continue <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
