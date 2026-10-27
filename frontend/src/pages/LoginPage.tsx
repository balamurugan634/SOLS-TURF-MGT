import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Shield, Building2, User as UserIcon, Lock, Mail,
  Phone, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login, register, quickLogin } = useAuth();

  // Role Tab: 'CUSTOMER' | 'TURF_OWNER' | 'ADMIN'
  const [activeRole, setActiveRole] = useState<'CUSTOMER' | 'TURF_OWNER' | 'ADMIN'>('CUSTOMER');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode && activeRole === 'CUSTOMER') {
        const user = await register({ name, email, phone, password });
        navigate(redirectUrl || '/turfs');
      } else {
        const user = await login({ email, password, role: activeRole });
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'TURF_OWNER') {
          navigate('/owner');
        } else {
          navigate(redirectUrl || '/turfs');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (roleKey: 'admin' | 'owner' | 'new_owner' | 'customer') => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLogin(roleKey);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'TURF_OWNER') {
        navigate('/owner');
      } else {
        navigate(redirectUrl || '/turfs');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card border border-gray-200 overflow-hidden animate-fade-in">
        
        {/* Top Header */}
        <div className="bg-[#064E3B] text-white p-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-500/40">
              <svg className="w-5 h-5 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.5" fill="#064E3B"/>
                <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#22c55e" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Turf<span className="text-[#22c55e]">Hub</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight">Portal Authentication</h2>
          <p className="text-xs text-emerald-200 mt-1">Select your account role to continue</p>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => {
              setActiveRole('CUSTOMER');
              setError('');
            }}
            className={`py-3.5 flex flex-col items-center gap-1 transition-all ${
              activeRole === 'CUSTOMER'
                ? 'bg-white text-[#166534] border-b-2 border-[#166534] shadow-sm'
                : 'hover:bg-gray-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('TURF_OWNER');
              setIsRegisterMode(false);
              setError('');
            }}
            className={`py-3.5 flex flex-col items-center gap-1 transition-all ${
              activeRole === 'TURF_OWNER'
                ? 'bg-white text-[#166534] border-b-2 border-[#166534] shadow-sm'
                : 'hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Turf Owner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('ADMIN');
              setIsRegisterMode(false);
              setError('');
            }}
            className={`py-3.5 flex flex-col items-center gap-1 transition-all ${
              activeRole === 'ADMIN'
                ? 'bg-white text-[#166534] border-b-2 border-[#166534] shadow-sm'
                : 'hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
              1-Click Demo Login
            </span>
            <span className="text-[10px] text-emerald-700">Test all 3 roles</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
            {activeRole === 'CUSTOMER' && (
              <button
                type="button"
                onClick={() => handleDemoFill('customer')}
                className="col-span-2 py-1.5 px-3 bg-white text-emerald-800 rounded-lg border border-emerald-300 hover:bg-emerald-100/60 shadow-sm transition-all text-center"
              >
                ⚽ Log in as Customer (John Doe)
              </button>
            )}

            {activeRole === 'TURF_OWNER' && (
              <>
                <button
                  type="button"
                  onClick={() => handleDemoFill('owner')}
                  className="py-1.5 px-2 bg-white text-blue-800 rounded-lg border border-blue-200 hover:bg-blue-50 shadow-sm transition-all text-center truncate"
                >
                  🏟️ Active Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('new_owner')}
                  className="py-1.5 px-2 bg-white text-amber-800 rounded-lg border border-amber-300 hover:bg-amber-50 shadow-sm transition-all text-center truncate"
                  title="Tests required first-login password reset"
                >
                  🔑 New Owner (Reset Demo)
                </button>
              </>
            )}

            {activeRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="col-span-2 py-1.5 px-3 bg-white text-purple-900 rounded-lg border border-purple-300 hover:bg-purple-50 shadow-sm transition-all text-center"
              >
                👑 Log in as Administrator
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Notice for Turf Owners (Critical Business Rule) */}
          {activeRole === 'TURF_OWNER' && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl leading-relaxed">
              <strong>Owner Security Policy:</strong> Turf owner accounts are created exclusively by the platform administrator. Use the credentials provided in your activation invite.
            </div>
          )}

          {/* Register vs Login Toggle for Customers */}
          {activeRole === 'CUSTOMER' && (
            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-[#166534] font-bold hover:underline"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : 'New to TurfHub? Register here'}
              </button>
            </div>
          )}

          {isRegisterMode && activeRole === 'CUSTOMER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 99000 88776"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegisterMode ? (
              <>
                <span>Create Customer Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In as {activeRole.replace('_', ' ').toLowerCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
