import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, Calendar, Clock, ShieldCheck, Check,
  ChevronRight, ChevronDown, ArrowLeft, ArrowRight, AlertCircle, Sparkles, CreditCard,
  QrCode, Printer, CheckCircle2, ChevronLeft, Phone, Mail, User as UserIcon,
  Users, Sun, Car, Info, X
} from 'lucide-react';
import { Turf, DaySlotsData, Slot, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [loadingTurf, setLoadingTurf] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Date Selection (Next 14 days)
  const generateDates = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      list.push({ date: iso, dayName, monthName, dayNum, isWeekend });
    }
    return list;
  };

  const datesList = generateDates();
  const [selectedDate, setSelectedDate] = useState(datesList[0].date);

  // Slots state
  const [slotsData, setSlotsData] = useState<DaySlotsData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('All');
  const [slotDuration, setSlotDuration] = useState<'60' | '30'>('60');

  // Booking Flow Steps: 1 = Slot Selected, 2 = Player Details, 3 = Payment Review, 4 = Confirmation
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(2);

  // Form details
  const [playerName, setPlayerName] = useState(user?.name || '');
  const [playerEmail, setPlayerEmail] = useState(user?.email || '');
  const [playerPhone, setPlayerPhone] = useState(user?.phone || '');
  const [selectedSport, setSelectedSport] = useState('Football');

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('player@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Fetch Turf info
  useEffect(() => {
    const fetchTurf = async () => {
      if (!id) return;
      try {
        const data = await api.getTurfDetails(id);
        setTurf(data);
        if (data.sports && data.sports.length > 0) {
          setSelectedSport(data.sports[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTurf(false);
      }
    };
    fetchTurf();
  }, [id]);

  // Sync user info if logged in
  useEffect(() => {
    if (user) {
      if (!playerName) setPlayerName(user.name);
      if (!playerEmail) setPlayerEmail(user.email);
      if (!playerPhone && user.phone) setPlayerPhone(user.phone);
    }
  }, [user]);

  // Fetch Slots for Selected Date
  const fetchSlots = async () => {
    if (!id) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const data = await api.getTurfSlots(id, selectedDate);
      setSlotsData(data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [id, selectedDate]);

  if (loadingTurf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#166534] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading turf details...</p>
        </div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-8 rounded-2xl text-center max-w-md shadow-card">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Turf Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The requested turf facility does not exist or has been deactivated.</p>
          <Link to="/turfs" className="px-5 py-2.5 bg-[#166534] text-white text-xs font-bold rounded-xl">
            Browse All Turfs
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [turf.main_image, ...(turf.gallery_images || [])];

  // Filter slots by period
  const filteredSlots = slotsData?.slots.filter(s => {
    if (periodFilter === 'All') return true;
    return s.period === periodFilter;
  }) || [];

  // Price calculations
  const slotBasePrice = selectedSlot ? selectedSlot.price : turf.hourly_base_price;
  const taxes = Math.round(slotBasePrice * 0.05); // 5% GST
  const totalAmount = slotBasePrice + taxes;

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === 'booked' || slot.status === 'unavailable') return;
    setSelectedSlot(slot);
  };

  const handleStartBooking = () => {
    if (!selectedSlot) return;
    setCurrentStep(2);
    setCheckoutModalOpen(true);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !playerEmail || !playerPhone) {
      setBookingError('Please enter all contact details.');
      return;
    }
    setBookingError('');
    setCurrentStep(3);
  };

  const handleExecutePayment = async () => {
    if (!selectedSlot || !turf) return;
    setIsProcessingPayment(true);
    setBookingError('');

    try {
      const bookingRes = await api.createBooking({
        turf_id: turf.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        sport: selectedSport,
        payment_method: paymentMethod,
        customer_name: playerName,
        customer_email: playerEmail,
        customer_phone: playerPhone,
      });

      setConfirmedBooking(bookingRes);
      setCurrentStep(4);
      // Refresh slots in background to mark slot as booked
      fetchSlots();
    } catch (err: any) {
      setBookingError(err.message || 'Payment or booking failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">

      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-gray-900">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/turfs" className="hover:text-gray-900">Turfs</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-800">{turf.name}</span>
          </div>
          <Link to="/turfs" className="text-[#166534] font-semibold flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to listings
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ========================================================= */}
        {/* TURF TITLE & GALLERY HEADER */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#166534]">
                  FIFA Certified Facility
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{turf.rating}</span>
                  <span className="text-gray-400 font-normal">({turf.review_count} reviews)</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {turf.name}
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{turf.location} • {turf.address}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 text-right">
              <span className="text-xs text-gray-500 font-medium">Starts from</span>
              <span className="text-3xl font-black text-gray-900 ml-1">
                ₹{Math.round(turf.hourly_base_price).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-normal">/hr</span>
            </div>
          </div>

          {/* Image Gallery Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={allImages[activeImageIndex] || turf.main_image}
                alt={turf.name}
                className="w-full h-full object-cover transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>
            <div className="flex md:flex-col gap-3 h-24 md:h-96 overflow-x-auto md:overflow-y-auto">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-1 md:h-1/3 rounded-xl overflow-hidden border-2 transition-all shrink-0 w-28 md:w-full ${activeImageIndex === idx ? 'border-[#166534] shadow-md scale-[1.02]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                >
                  <img
                    src={img}
                    alt={`${turf.name} preview ${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Sports & Amenities tags */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Available Sports</h3>
              <div className="flex flex-wrap gap-2">
                {turf.sports?.map((s, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-50 text-[#166534] rounded-lg text-xs font-semibold border border-emerald-200">
                    ⚽ {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Venue Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {turf.amenities?.map((a, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2-COLUMN LAYOUT: SLOTS SELECTION & BOOKING SUMMARY */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT 2 COLS: SLOT BOOKING SECTION */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Date & Time Slot</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real-time dynamic slot pricing automatically adjusts for peak hours and weekends.
                  </p>
                </div>

                {/* Duration Toggle (Hourly / 30 mins) */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => setSlotDuration('60')}
                    className={`px-3 py-1 rounded-lg transition-all ${slotDuration === '60' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    60 Mins
                  </button>
                  <button
                    onClick={() => setSlotDuration('30')}
                    className={`px-3 py-1 rounded-lg transition-all ${slotDuration === '30' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    30 Mins
                  </button>
                </div>
              </div>

              {/* 1. HORIZONTAL DATE SELECTOR (Next 14 Days) */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Match Date
                  </span>
                  <span className="text-xs font-medium text-emerald-700">
                    {slotsData?.is_weekend ? '🌟 Weekend Special Pricing Active' : '⚡ Weekday Rates Active'}
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {datesList.map((item) => {
                    const isSelected = selectedDate === item.date;
                    return (
                      <button
                        key={item.date}
                        onClick={() => setSelectedDate(item.date)}
                        className={`flex flex-col items-center justify-center min-w-[76px] py-3 px-2 rounded-2xl border transition-all shrink-0 ${isSelected
                            ? 'bg-[#166534] text-white border-[#166534] shadow-md scale-105'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                          }`}
                      >
                        <span className={`text-[11px] font-medium ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {item.dayName}
                        </span>
                        <span className="text-xl font-black my-0.5 leading-none">
                          {item.dayNum}
                        </span>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                          {item.monthName}
                        </span>
                        {item.isWeekend && (
                          <span className={`text-[9px] mt-1 px-1 rounded ${isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-100 text-amber-800'
                            }`}>
                            Weekend
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. TIME PERIOD FILTERS (Morning, Afternoon, Evening, Night) */}
              <div className="py-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-500 mr-1">Time of Day:</span>
                {(['All', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setPeriodFilter(period)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${periodFilter === period
                        ? 'bg-[#064E3B] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {period} {period === 'Morning' ? '(6AM-12PM)' : period === 'Afternoon' ? '(12PM-4PM)' : period === 'Evening' ? '(4PM-8PM)' : period === 'Night' ? '(8PM-12AM)' : ''}
                  </button>
                ))}
              </div>

              {/* Legend for Visual Slot States */}
              <div className="flex flex-wrap items-center gap-4 py-3 text-[11px] text-gray-500 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-gray-300 bg-white" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#166534]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-gray-200" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300" />
                  <span>Unavailable</span>
                </div>
              </div>

              {/* 3. TIME SLOTS GRID */}
              {loadingSlots ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No slots found for this time period. Please select "All" or another period.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isBooked = slot.status === 'booked';
                    const isUnavailable = slot.status === 'unavailable';
                    const isAvailable = slot.status === 'available';

                    // Exact Visual States as specified:
                    // Available: White card with subtle border
                    // Selected: Dark green card
                    // Booked: Disabled gray card
                    // Unavailable: Disabled card with clear label
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked || isUnavailable}
                        onClick={() => handleSlotClick(slot)}
                        className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[82px] ${isSelected
                            ? 'bg-[#166534] text-white border-[#166534] shadow-md ring-2 ring-[#22c55e] scale-[1.02]'
                            : isBooked
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                              : isUnavailable
                                ? 'bg-red-50 text-red-500 border-red-200 cursor-not-allowed opacity-80'
                                : 'bg-white text-gray-900 border-gray-200 hover:border-emerald-600 hover:shadow-md cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : isBooked ? 'text-gray-400' : 'text-gray-800'}`}>
                            {slot.start_time} - {slot.end_time}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#22c55e]" />}
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          {isBooked ? (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Booked
                            </span>
                          ) : isUnavailable ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                              {slot.block_reason || 'Blocked'}
                            </span>
                          ) : (
                            <>
                              <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                ₹{slot.price}
                              </span>
                              {slot.is_peak && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  Peak
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Description & Rules */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-soft">
              <h3 className="text-lg font-bold text-gray-900 mb-3">About {turf.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {turf.description}
              </p>

              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-[#166534]" />
                  TurfHub Booking Guarantee:
                </div>
                <p>• Lock in your slot price instantly. Even if owner prices change later, confirmed bookings retain their booked price.</p>
                <p>• Double booking prevention guaranteed through database locks.</p>
                <p>• Free cancellation up to 4 hours before slot start time.</p>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COL: BOOKING SUMMARY SIDEBAR */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-card">

              <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 mb-4">
                Booking Summary
              </h3>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block font-normal">Turf Name</span>
                  <span className="font-bold text-gray-900">{turf.name}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block font-normal">Selected Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block font-normal">Selected Time</span>
                  {selectedSlot ? (
                    <span className="font-bold text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-md inline-block mt-0.5">
                      {selectedSlot.start_time} – {selectedSlot.end_time} ({selectedSlot.period})
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium italic">
                      Please select an available slot from the grid
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-gray-400 block font-normal">Duration</span>
                  <span className="font-semibold text-gray-800">
                    {slotDuration === '60' ? '1 Hour (60 mins)' : '30 Minutes'}
                  </span>
                </div>

                {/* Pricing Breakdown */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Slot Base Price:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{selectedSlot ? selectedSlot.price : turf.hourly_base_price}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes & Fees (5% GST):</span>
                    <span className="font-semibold text-gray-900">₹{selectedSlot ? taxes : Math.round(turf.hourly_base_price * 0.05)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                  <span className="text-base font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-black text-[#166534]">
                    ₹{selectedSlot ? totalAmount.toLocaleString() : (turf.hourly_base_price * 1.05).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={handleStartBooking}
                  className="w-full py-3.5 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Continue to Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-center text-gray-400 mt-3">
                Instant confirmation • No booking fee
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 4-STEP CHECKOUT & PAYMENT MODAL (SPLIT 2-COLUMN SHOWCASE) */}
      {/* ========================================================= */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-fade-in my-8 relative">

            {/* LEFT COLUMN: TURF SHOWCASE & VENUE HIGHLIGHTS */}
            <div className="w-full md:w-[42%] lg:w-[380px] shrink-0 relative flex flex-col justify-between p-7 text-white overflow-hidden min-h-[340px] md:min-h-[530px]">
              {/* Stadium Photo Background */}
              <img
                src={turf.main_image || '/images/turf-greenfield.jpg'}
                alt={turf.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark Gradient Overlay for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/60" />

              {/* Brand Logo */}
              <div className="relative z-10 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm shadow-md font-bold">
                  ⚽
                </div>
                <span className="text-xl font-black tracking-tight text-white drop-shadow">TurfHub</span>
              </div>

              {/* Bottom Turf Details & 4 Amenities */}
              <div className="relative z-10 space-y-3 pt-12">
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                  {turf.name}
                </h2>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{turf.location}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{turf.rating || '4.8'} ({turf.review_count || 236} reviews)</span>
                  </div>
                </div>

                {/* 4 Amenities row */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/15 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-5 h-5 text-white/90 mb-1" />
                    <span className="text-[11px] font-medium text-white/90">5-a-side</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Sun className="w-5 h-5 text-white/90 mb-1" />
                    <span className="text-[11px] font-medium text-white/90">Floodlights</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-white/90 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="7" r="3" />
                      <rect x="5" y="13" width="6" height="8" rx="1" />
                      <rect x="13" y="13" width="6" height="8" rx="1" />
                    </svg>
                    <span className="text-[11px] font-medium text-white/90">Changing Room</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-white/90 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 21V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v14" />
                      <path d="M9 12h6" />
                    </svg>
                    <span className="text-[11px] font-medium text-white/90">Parking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE FORM & STEP PROGRESS */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-white relative min-w-0">
              {/* Close Button */}
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-20"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div>
                {/* Step Header */}
                <div className="pr-8">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {currentStep === 2 && 'Step 2 of 4: Player Details'}
                    {currentStep === 3 && 'Step 3 of 4: Review & Payment'}
                    {currentStep === 4 && 'Step 4 of 4: Booking Confirmation'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {currentStep === 2 && 'Tell us about the player and team'}
                    {currentStep === 3 && 'Review your booking details and complete payment'}
                    {currentStep === 4 && 'Your turf slot is confirmed and reserved'}
                  </p>
                </div>

                {/* Stepper Progress Bar */}
                <div className="py-4 my-1">
                  <div className="flex items-center justify-between relative">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center shrink-0 z-10 w-20">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep >= 2 ? 'bg-[#16a34a] text-white shadow-sm' : 'bg-[#166534] text-white'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-[#16a34a] mt-1.5 text-center">
                        Select Slot
                      </span>
                    </div>

                    {/* Connector Line 1 to 2 */}
                    <div className={`flex-1 h-[2.5px] -mt-5 mx-1 transition-colors ${
                      currentStep >= 2 ? 'bg-[#16a34a]' : 'bg-gray-200'
                    }`} />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center shrink-0 z-10 w-24">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep > 2
                          ? 'bg-[#16a34a] text-white shadow-sm'
                          : currentStep === 2
                          ? 'bg-[#166534] text-white ring-2 ring-emerald-600/30 shadow-sm'
                          : 'border border-gray-300 bg-white text-gray-400'
                      }`}>
                        {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                      </div>
                      <span className={`text-[11px] sm:text-xs mt-1.5 text-center ${
                        currentStep === 2 ? 'font-bold text-[#166534]' : currentStep > 2 ? 'font-semibold text-[#16a34a]' : 'font-medium text-gray-400'
                      }`}>
                        Player Details
                      </span>
                    </div>

                    {/* Connector Line 2 to 3 */}
                    <div className={`flex-1 h-[2.5px] -mt-5 mx-1 transition-colors ${
                      currentStep >= 3 ? 'bg-[#16a34a]' : 'bg-gray-200'
                    }`} />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center shrink-0 z-10 w-20">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep > 3
                          ? 'bg-[#16a34a] text-white shadow-sm'
                          : currentStep === 3
                          ? 'bg-[#166534] text-white ring-2 ring-emerald-600/30 shadow-sm'
                          : 'border border-gray-300 bg-white text-gray-400'
                      }`}>
                        {currentStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                      </div>
                      <span className={`text-[11px] sm:text-xs mt-1.5 text-center ${
                        currentStep === 3 ? 'font-bold text-[#166534]' : currentStep > 3 ? 'font-semibold text-[#16a34a]' : 'font-medium text-gray-400'
                      }`}>
                        Review
                      </span>
                    </div>

                    {/* Connector Line 3 to 4 */}
                    <div className={`flex-1 h-[2.5px] -mt-5 mx-1 transition-colors ${
                      currentStep >= 4 ? 'bg-[#16a34a]' : 'bg-gray-200'
                    }`} />

                    {/* Step 4 */}
                    <div className="flex flex-col items-center shrink-0 z-10 w-24">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === 4
                          ? 'bg-[#166534] text-white ring-2 ring-emerald-600/30 shadow-sm'
                          : 'border border-gray-300 bg-white text-gray-400'
                      }`}>
                        {currentStep === 4 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '4'}
                      </div>
                      <span className={`text-[11px] sm:text-xs mt-1.5 text-center ${
                        currentStep === 4 ? 'font-bold text-[#166534]' : 'font-medium text-gray-400'
                      }`}>
                        Confirmation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error banner */}
                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* STEP 2: ENTER BOOKING DETAILS */}
                {currentStep === 2 && (
                  <form onSubmit={handleProceedToPayment} className="space-y-4">
                    <div className="flex items-center gap-2.5 pb-1">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-base font-bold text-gray-900">
                        Player & Team Information
                      </h4>
                    </div>

                    {/* 2x2 Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Lead Player Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                          Lead Player Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl border border-gray-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all">
                          <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl border border-gray-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            placeholder="john.doe@example.com"
                            value={playerEmail}
                            onChange={(e) => setPlayerEmail(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl border border-gray-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            placeholder="+91 99000 88776"
                            value={playerPhone}
                            onChange={(e) => setPlayerPhone(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Sport */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                          Sport <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl border border-gray-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all">
                          <span className="text-sm absolute left-3.5 top-1/2 -translate-y-1/2 select-none">
                            ⚽
                          </span>
                          <select
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 text-sm text-gray-900 font-medium outline-none bg-transparent appearance-none cursor-pointer rounded-xl"
                          >
                            {turf.sports && turf.sports.length > 0 ? (
                              turf.sports.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))
                            ) : (
                              <>
                                <option value="Football">Football</option>
                                <option value="Cricket">Cricket</option>
                                <option value="Badminton">Badminton</option>
                              </>
                            )}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Information Banner */}
                    <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>The lead player will receive the booking confirmation and updates.</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutModalOpen(false)}
                        className="px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                      >
                        <span>Continue to Review (₹{(selectedSlot ? selectedSlot.price : turf.hourly_base_price).toLocaleString()})</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: REVIEW & PAYMENT (Razorpay Styled Simulation) */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-gray-900 text-sm pb-1 border-b border-gray-200">
                        <span>{turf.name}</span>
                        <span className="text-[#166534]">₹{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Slot:</span>
                        <span className="font-semibold text-gray-800">{selectedDate} • {selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Customer:</span>
                        <span className="font-semibold text-gray-800">{playerName} ({playerPhone})</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Sport:</span>
                        <span className="font-semibold text-gray-800">{selectedSport}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                        Select Payment Gateway Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('UPI')}
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${paymentMethod === 'UPI'
                              ? 'border-[#166534] bg-emerald-50 text-[#166534] ring-1 ring-[#166534]'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          UPI (GPay/Paytm)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CARD')}
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${paymentMethod === 'CARD'
                              ? 'border-[#166534] bg-emerald-50 text-[#166534] ring-1 ring-[#166534]'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          Credit/Debit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('NETBANKING')}
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${paymentMethod === 'NETBANKING'
                              ? 'border-[#166534] bg-emerald-50 text-[#166534] ring-1 ring-[#166534]'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          Net Banking
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'UPI' && (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                        <label className="block text-[11px] font-bold text-emerald-950">Enter Virtual Payment Address (UPI ID)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-gray-800"
                        />
                        <p className="text-[10px] text-emerald-800">You will receive an approval notification on GPay / PhonePe.</p>
                      </div>
                    )}

                    {paymentMethod === 'CARD' && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                        <label className="block text-[11px] font-bold text-gray-700">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800"
                        />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <input type="text" placeholder="MM/YY" defaultValue="09/28" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs" />
                          <input type="password" placeholder="CVV" defaultValue="982" className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs" />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'NETBANKING' && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
                        <select className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs">
                          <option>HDFC Bank</option>
                          <option>State Bank of India</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                        </select>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handleExecutePayment}
                        className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043d2e] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Securing Slot...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm & Pay ₹{totalAmount.toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: BOOKING CONFIRMATION & RECEIPT */}
                {currentStep === 4 && confirmedBooking && (
                  <div id="printable-receipt" className="space-y-4 text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#166534]">
                      <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        Booking Confirmed!
                      </span>
                      <h4 className="text-xl font-black text-gray-900 mt-2">
                        You're All Set to Play!
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Booking ID: <strong className="text-gray-900 font-mono">{confirmedBooking.booking_id}</strong>
                      </p>
                    </div>

                    {/* Match Ticket Voucher */}
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border-2 border-dashed border-emerald-300 text-left space-y-2.5 relative shadow-inner">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900">{confirmedBooking.turf_name}</h4>
                          <p className="text-xs text-gray-500">{confirmedBooking.turf_location}</p>
                        </div>
                        <div className="w-12 h-12 bg-white p-1 rounded-lg border border-emerald-200 flex items-center justify-center shadow-sm">
                          <QrCode className="w-10 h-10 text-[#064E3B]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/80">
                        <div>
                          <span className="text-gray-400 block text-[10px]">MATCH DATE</span>
                          <strong className="text-gray-900">{confirmedBooking.booking_date}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">TIME SLOT</span>
                          <strong className="text-gray-900">{confirmedBooking.start_time} - {confirmedBooking.end_time}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">SPORT</span>
                          <strong className="text-gray-900">{confirmedBooking.sport}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">TOTAL PAID</span>
                          <strong className="text-[#166534]">₹{confirmedBooking.total_amount} (Verified)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2 no-print">
                      <button
                        onClick={printReceipt}
                        className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer className="w-4 h-4" />
                        Print Ticket
                      </button>

                      <Link
                        to="/my-bookings"
                        onClick={() => setCheckoutModalOpen(false)}
                        className="flex-1 py-2.5 bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        My Bookings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
