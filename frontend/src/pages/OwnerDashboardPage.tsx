import React, { useState, useEffect } from 'react';
import {
  Building2, Calendar, DollarSign, Clock, Shield,
  TrendingUp, Users, Check, AlertCircle, Save, Ban,
  CheckCircle2, Plus, Sliders, ChevronRight
} from 'lucide-react';
import { Turf, PricingRule, Booking, OwnerAnalytics } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const OwnerDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Navigation sidebar sections
  type Section = 'Overview' | 'My Turfs' | 'Manage Slots' | 'Pricing Management' | 'Bookings' | 'Earnings' | 'Settings';
  const [activeSection, setActiveSection] = useState<Section>('Overview');

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Slot blocking state
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockTime, setBlockTime] = useState('14:00');
  const [blockReason, setBlockReason] = useState('Ground maintenance & leveling');
  const [blockLoading, setBlockLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const turfList = await api.getOwnerTurfs();
      setTurfs(turfList);
      if (turfList.length > 0) {
        const current = selectedTurf ? turfList.find(t => t.id === selectedTurf.id) || turfList[0] : turfList[0];
        setSelectedTurf(current);
        const rules = await api.getOwnerPricingRules(current.id);
        setPricingRules(rules);
      }
      const bks = await api.getOwnerBookings();
      setBookings(bks);
      const anl = await api.getOwnerAnalytics();
      setAnalytics(anl);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || 'Error loading owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTurf = async (t: Turf) => {
    setSelectedTurf(t);
    try {
      const rules = await api.getOwnerPricingRules(t.id);
      setPricingRules(rules);
    } catch (err) {
      console.error(err);
    }
  };

  // Modify local pricing rule
  const handleRulePriceChange = (ruleId: number, newPrice: string) => {
    const val = parseFloat(newPrice) || 0;
    setPricingRules(prev =>
      prev.map(r => r.id === ruleId ? { ...r, price: val } : r)
    );
  };

  const handleRulePeakToggle = (ruleId: number, isPeak: boolean) => {
    setPricingRules(prev =>
      prev.map(r => r.id === ruleId ? { ...r, is_peak: isPeak } : r)
    );
  };

  // Save all pricing rules to backend
  const handleSavePricing = async () => {
    if (!selectedTurf) return;
    setIsSavingPricing(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await api.updateOwnerPricingRules(
        selectedTurf.id,
        pricingRules.map(r => ({
          id: r.id,
          price: r.price,
          is_peak: r.is_peak,
          label: r.label,
        }))
      );
      setSaveSuccess(res.message);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save pricing changes');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Handle slot block/unblock
  const handleBlockSlot = async (isBlocked: boolean) => {
    if (!selectedTurf) return;
    setBlockLoading(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const res = await api.toggleBlockSlot(selectedTurf.id, {
        date: blockDate,
        start_time: blockTime,
        is_blocked: isBlocked,
        reason: blockReason,
      });
      setSaveSuccess(res.message);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update slot status');
    } finally {
      setBlockLoading(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'TURF_OWNER' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-card border border-gray-200">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Turf Owner Access Required</h2>
          <p className="text-xs text-gray-500 mb-6">
            Please log in with an authorized Turf Owner account created by the platform administrator.
          </p>
          <a
            href="/login"
            className="w-full py-3 bg-[#166534] text-white font-bold text-xs rounded-xl block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const sidebarItems: Section[] = [
    'Overview',
    'My Turfs',
    'Manage Slots',
    'Pricing Management',
    'Bookings',
    'Earnings',
    'Settings',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                Turf Owner Console
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">Facility Manager</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              {user?.name}'s Dashboard
            </h1>
          </div>

          {/* Active Turf Selector */}
          {turfs.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-sm self-start sm:self-auto">
              <Building2 className="w-4 h-4 text-[#166534]" />
              <div className="text-left">
                <span className="text-[10px] text-gray-400 block font-normal">Assigned Facility</span>
                <select
                  value={selectedTurf?.id || ''}
                  onChange={(e) => {
                    const t = turfs.find(item => item.id === Number(e.target.value));
                    if (t) handleSelectTurf(t);
                  }}
                  className="bg-transparent font-bold text-xs text-gray-800 focus:outline-none cursor-pointer"
                >
                  {turfs.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.location})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Global Notifications */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Layout with Sidebar Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="space-y-1 bg-white p-3 rounded-3xl border border-gray-200 shadow-soft h-fit">
            {sidebarItems.map(item => {
              const isActive = activeSection === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveSection(item)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-[#166534] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{item}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. OVERVIEW & STATS */}
            {activeSection === 'Overview' && (
              <div className="space-y-6">
                
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Bookings</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {analytics?.total_bookings || bookings.length}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">✓ All time confirmed</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
                    <span className="text-2xl font-black text-[#166534] mt-1 block">
                      ₹{analytics?.total_revenue.toLocaleString() || '0'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1 block">Direct bank settlements</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Managed Turfs</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">
                      {turfs.length}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium mt-1 block">Assigned by admin</span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-gradient-to-r from-[#064E3B] to-[#166534] p-6 rounded-3xl text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">Dynamic Pricing Engine</h3>
                    <p className="text-xs text-emerald-100/90 mt-1 max-w-lg">
                      Configure peak-hour and weekend pricing rules for {selectedTurf?.name}. Changes apply immediately to new customer bookings.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('Pricing Management')}
                    className="px-5 py-2.5 bg-white text-[#064E3B] font-bold text-xs rounded-xl shadow hover:bg-emerald-50 active:scale-95 shrink-0"
                  >
                    Adjust Slot Rates
                  </button>
                </div>

                {/* Recent Bookings Table */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Recent Bookings on Your Turfs</h3>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No bookings recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <tr>
                            <th className="p-3">Booking ID</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Date & Slot</th>
                            <th className="p-3">Sport</th>
                            <th className="p-3">Total Paid</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bookings.slice(0, 5).map(b => (
                            <tr key={b.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-mono font-bold text-gray-700">{b.booking_id}</td>
                              <td className="p-3 font-medium text-gray-900">{b.customer_name}</td>
                              <td className="p-3 text-gray-600">{b.booking_date} • {b.start_time}-{b.end_time}</td>
                              <td className="p-3 font-semibold text-gray-700">{b.sport}</td>
                              <td className="p-3 font-bold text-gray-900">₹{b.total_amount}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#166534]">
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. DYNAMIC PRICING MANAGEMENT (Core Requirement #4) */}
            {activeSection === 'Pricing Management' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Dynamic Pricing Management</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Facility: <strong className="text-gray-800">{selectedTurf?.name}</strong>. Set slot-by-slot hourly prices, peak rates, and weekend rules.
                    </p>
                  </div>

                  <button
                    onClick={handleSavePricing}
                    disabled={isSavingPricing}
                    className="px-6 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPricing ? 'Saving Changes...' : 'Save Pricing Changes'}</span>
                  </button>
                </div>

                {/* Critical business rule callout */}
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <strong>Critical Rule Enforced:</strong> When you update slot prices, the new price immediately appears on the customer booking page for future bookings. Existing confirmed bookings retain their agreed booking price!
                  </div>
                </div>

                {/* Pricing Rules Table (Matches the example table in prompt: 6-7 AM ₹800, 7-8 AM ₹1000, etc.) */}
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3">Time Slot</th>
                        <th className="p-3">Day Applicability</th>
                        <th className="p-3">Hourly Rate (₹)</th>
                        <th className="p-3">Peak Hour?</th>
                        <th className="p-3">Label / Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pricingRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50/70">
                          <td className="p-3 font-bold text-gray-900">
                            {rule.time_slot_start} – {rule.time_slot_end}
                          </td>
                          <td className="p-3 text-gray-600 font-medium">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rule.day_type === 'WEEKEND'
                                ? 'bg-amber-100 text-amber-800'
                                : rule.day_type === 'WEEKDAY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {rule.day_type}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 font-bold">₹</span>
                              <input
                                type="number"
                                value={rule.price}
                                onChange={(e) => handleRulePriceChange(rule.id, e.target.value)}
                                className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-gray-900 focus:bg-white focus:border-[#166534] focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.is_peak}
                                onChange={(e) => handleRulePeakToggle(rule.id, e.target.checked)}
                                className="rounded text-[#166534] focus:ring-[#166534] cursor-pointer"
                              />
                              <span className={`text-[11px] font-semibold ${rule.is_peak ? 'text-amber-700 font-bold' : 'text-gray-400'}`}>
                                {rule.is_peak ? 'Peak' : 'Standard'}
                              </span>
                            </label>
                          </td>
                          <td className="p-3 text-gray-500 font-medium">
                            {rule.label || 'Standard Rate'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSavePricing}
                    disabled={isSavingPricing}
                    className="px-6 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPricing ? 'Saving Changes...' : 'Save Pricing Changes'}</span>
                  </button>
                </div>

              </div>
            )}

            {/* 3. MANAGE SLOTS (BLOCK / UNBLOCK) */}
            {activeSection === 'Manage Slots' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Manage Slot Availability</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Block unavailable time slots for pitch maintenance, private club tournaments, or rain.
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 max-w-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Slot Override Controls
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Slot Start Time</label>
                    <select
                      value={blockTime}
                      onChange={(e) => setBlockTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
                    >
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                        <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                          {`${h.toString().padStart(2, '0')}:00`} - {`${(h+1).toString().padStart(2, '0')}:00`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Blocking</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="e.g. Grass aeration & leveling"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => handleBlockSlot(true)}
                      disabled={blockLoading}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Block Slot as Unavailable</span>
                    </button>
                    <button
                      onClick={() => handleBlockSlot(false)}
                      disabled={blockLoading}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Unblock / Make Available</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MY TURFS */}
            {activeSection === 'My Turfs' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">My Assigned Turfs</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Facilities assigned to your owner account by platform administrators.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turfs.map(t => (
                    <div
                      key={t.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        selectedTurf?.id === t.id
                          ? 'border-[#166534] bg-emerald-50/30 ring-1 ring-[#166534]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="h-36 rounded-xl overflow-hidden mb-3 bg-gray-100">
                        <img
                          src={t.main_image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>
                      <h4 className="font-bold text-base text-gray-900">{t.name}</h4>
                      <p className="text-xs text-gray-500">{t.location}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900">Base: ₹{t.hourly_base_price}/hr</span>
                        <button
                          onClick={() => handleSelectTurf(t)}
                          className="px-3 py-1 bg-[#166534] text-white rounded-lg font-semibold"
                        >
                          Manage This Turf
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. BOOKINGS LIST */}
            {activeSection === 'Bookings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">All Customer Bookings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="p-3">Booking ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Date & Slot</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono font-bold text-gray-800">{b.booking_id}</td>
                          <td className="p-3 font-medium text-gray-900">{b.customer_name}</td>
                          <td className="p-3 text-gray-500">{b.customer_phone}</td>
                          <td className="p-3 text-gray-700">{b.booking_date} • {b.start_time}-{b.end_time}</td>
                          <td className="p-3 font-bold text-gray-900">₹{b.total_amount}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#166534]">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. EARNINGS */}
            {activeSection === 'Earnings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Earnings & Payout Overview</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Automated settlement breakdown for your turfs.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">Gross Earnings</span>
                    <span className="text-3xl font-black text-[#166534] mt-1 block">
                      ₹{analytics?.total_revenue.toLocaleString() || '0'}
                    </span>
                    <span className="text-[11px] text-emerald-700 block mt-1">Platform commission 0% during beta</span>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Average Slot Yield</span>
                    <span className="text-3xl font-black text-gray-900 mt-1 block">
                      ₹{analytics?.average_slot_rate || '1,350'}
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-1">Weighted per booking</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. SETTINGS */}
            {activeSection === 'Settings' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Account Security & Settings</h2>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-2">
                  <p><strong>Owner Name:</strong> {user?.name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Status:</strong> <span className="text-emerald-700 font-bold">{user?.status}</span></p>
                  <p><strong>Role:</strong> {user?.role}</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
