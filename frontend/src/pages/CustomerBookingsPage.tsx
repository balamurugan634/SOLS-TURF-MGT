import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Printer, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, RefreshCw, QrCode
} from 'lucide-react';
import { Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CustomerBookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Schedule conflict');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleCancelBooking = async () => {
    if (!cancellingBookingId) return;
    try {
      await api.cancelBooking(cancellingBookingId, cancellationReason);
      setActionSuccess('Booking cancelled successfully. Refund initiated.');
      setCancelModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel booking.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-card border border-gray-200">
          <div className="w-16 h-16 bg-emerald-50 text-[#166534] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your bookings</h2>
          <p className="text-xs text-gray-500 mb-6">
            Log in to manage upcoming slots, download match passes, or reschedule.
          </p>
          <Link
            to="/login?redirect=/my-bookings"
            className="w-full py-3 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-xs rounded-xl block transition-all shadow-md"
          >
            Sign In / Register
          </Link>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' && b.booking_date >= todayStr);
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && b.booking_date < todayStr));
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  const displayedList = activeTab === 'UPCOMING'
    ? upcomingBookings
    : activeTab === 'COMPLETED'
    ? completedBookings
    : cancelledBookings;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              My Turf Bookings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Signed in as <strong className="text-gray-800">{user?.name}</strong> ({user?.email})
            </p>
          </div>

          <Link
            to="/turfs"
            className="px-5 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Book New Turf</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Action messages */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Upcoming Slots ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Past Matches ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CANCELLED'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>

        {/* List of Bookings */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse h-32" />
            ))}
          </div>
        ) : displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 max-w-md mx-auto my-8">
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No {activeTab.toLowerCase()} bookings</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              You don't have any bookings in this section right now.
            </p>
            <Link
              to="/turfs"
              className="px-5 py-2.5 bg-[#166534] text-white text-xs font-bold rounded-xl inline-block"
            >
              Browse Available Turfs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedList.map((booking) => {
              const isConfirmed = booking.status === 'CONFIRMED';
              const isCancelled = booking.status === 'CANCELLED';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-soft hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      <img
                        src={booking.turf_image || '/images/turf-greenfield.jpg'}
                        alt={booking.turf_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {booking.booking_id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'bg-emerald-100 text-[#166534]'
                              : isCancelled
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 bg-emerald-50 px-2 py-0.5 rounded text-emerald-800">
                          {booking.sport}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900">
                        {booking.turf_name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
                        <span className="flex items-center gap-1 font-semibold text-gray-800">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                          {booking.booking_date}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-gray-800">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          {booking.start_time} - {booking.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {booking.turf_location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial snapshot & actions */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Total Paid</span>
                      <span className="text-base font-black text-gray-900">₹{booking.total_amount}</span>
                      <span className="text-[10px] text-emerald-700 block font-medium">✓ Locked Price</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <button
                          onClick={() => {
                            setCancellingBookingId(booking.id);
                            setCancelModalOpen(true);
                          }}
                          className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => window.print()}
                        className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl"
                        title="Print Match Voucher"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Are you sure you want to cancel this booking? The slot will immediately become available for other players, and your refund will be processed within 2-3 business days.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Cancellation</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800"
              >
                <option value="Schedule conflict">Schedule conflict</option>
                <option value="Player unavailable">Player unavailable</option>
                <option value="Weather / Rain">Weather / Rain</option>
                <option value="Booked another slot">Booked another slot</option>
              </select>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
