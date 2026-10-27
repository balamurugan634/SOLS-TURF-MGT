import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, ShieldCheck, Users, Zap, MapPin,
  Star, Heart, ArrowRight, Tag, X, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Turf } from '../types';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const data = await api.getTurfs();
        setTurfs(data);
      } catch (err) {
        console.error('Failed to load turfs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (selectedLocation && selectedLocation !== 'All') {
      query.set('location', selectedLocation);
    }
    if (selectedDate) {
      query.set('date', selectedDate);
    }
    navigate(`/turfs?${query.toString()}`);
  };

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* ============================================================== */}
      {/* 1. HERO SECTION (Faithfully matching provided reference image) */}
      {/* ============================================================== */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-12 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-card border border-emerald-950/20 bg-slate-900 min-h-[460px] md:min-h-[500px] flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          
          {/* Background Turf Image with dark atmospheric overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero-turf.jpg"
              alt="Night Football Turf Stadium"
              className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-[1.05]"
              onError={(e) => {
                // Fallback high quality unsplash image if local is loading
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=1600&q=80";
              }}
            />
            {/* Gradient Overlays for optimal text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B]/70 via-transparent to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl text-white mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-3">
              Book Your <br />
              Perfect <span className="text-[#22c55e]">Turf</span>
            </h1>
            <p className="text-base sm:text-lg text-emerald-50/90 font-normal leading-relaxed max-w-xl">
              Find and book premium turfs for football, cricket, and more in your city.
            </p>
          </div>

          {/* Hero Search Bar Box (Matching reference design pill container) */}
          <form
            onSubmit={handleSearch}
            className="relative z-10 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-white/40 flex flex-col sm:flex-row items-center gap-3 w-full max-w-3xl"
          >
            {/* Location selector */}
            <div className="relative w-full sm:flex-1">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/90 border border-gray-200 rounded-xl text-gray-700 text-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-gray-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="All">Select Location (All)</option>
                  <option value="HSR">HSR Layout, Bangalore</option>
                  <option value="Whitefield">Whitefield, Bangalore</option>
                  <option value="Koramangala">Koramangala, Bangalore</option>
                  <option value="Indiranagar">Indiranagar, Bangalore</option>
                </select>
              </div>
            </div>

            {/* Date selector */}
            <div className="relative w-full sm:flex-1">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/90 border border-gray-200 rounded-xl text-gray-700 text-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-gray-800 font-medium focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 bg-[#166534] hover:bg-[#064E3B] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              Search Turfs
            </button>
          </form>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. FEATURE HIGHLIGHTS ROW (Matching 4 icon cards in reference) */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Feature 1: Easy Booking */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Easy Booking</h3>
            <p className="text-xs text-gray-500">Book in a few clicks</p>
          </div>

          {/* Feature 2: Quality Turfs */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Quality Turfs</h3>
            <p className="text-xs text-gray-500">Well-maintained grounds</p>
          </div>

          {/* Feature 3: Multiple Sports */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center mb-3">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Multiple Sports</h3>
            <p className="text-xs text-gray-500">Football, Cricket & more</p>
          </div>

          {/* Feature 4: Instant Confirmation */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Instant Confirmation</h3>
            <p className="text-xs text-gray-500">Get confirmed instantly</p>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. POPULAR TURFS SECTION (Matching cards design in reference) */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
            Popular Turfs
          </h2>
          <Link
            to="/turfs"
            className="text-sm font-bold text-[#166534] hover:text-[#064E3B] flex items-center gap-1.5 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-soft animate-pulse">
                <div className="h-44 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfs.slice(0, 3).map((turf) => {
              const isFav = favorites.includes(turf.id);
              return (
                <div
                  key={turf.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col group"
                >
                  {/* Card Image with heart toggle */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={turf.main_image}
                      alt={turf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <button
                      onClick={(e) => toggleFavorite(turf.id, e)}
                      aria-label="Favorite"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-sm"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
                      />
                    </button>
                    {/* Sports Tags */}
                    <div className="absolute bottom-2.5 left-3 flex flex-wrap gap-1">
                      {turf.sports?.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#166534] transition-colors line-clamp-1">
                        {turf.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{turf.location}</span>
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-gray-700">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{turf.rating}</span>
                        <span className="text-gray-400 font-normal">({turf.review_count})</span>
                      </div>
                    </div>

                    {/* Price and Book CTA matching reference image */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-gray-900">
                          ₹{Math.round(turf.hourly_base_price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 font-normal"> / hour</span>
                      </div>

                      <Link
                        to={`/turfs/${turf.id}`}
                        className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 4. PROMOTIONAL BANNER (Matching bottom card in reference image) */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#064E3B] to-[#166534] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card border border-emerald-800">
          
          <div className="flex items-center gap-5 z-10">
            {/* Football Icon Graphic */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center p-3 border border-white/20 shrink-0 shadow-inner">
              <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="1.5" fill="#064E3B"/>
                <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#FFFFFF" />
                <line x1="12" y1="2" x2="12" y2="7" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="15" y1="9.5" x2="19.5" y2="7.5" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="14" y1="13.5" x2="17.5" y2="18" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="10" y1="13.5" x2="6.5" y2="18" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="9" y1="9.5" x2="4.5" y2="7.5" stroke="#FFFFFF" strokeWidth="1.5"/>
              </svg>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
                Play More, Save More!
              </h3>
              <p className="text-emerald-100/90 text-xs sm:text-sm">
                Get up to 20% off on your next booking with TurfHub promo pass.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0">
            <button
              onClick={() => setPromoModalOpen(true)}
              className="px-6 py-2.5 bg-white text-[#064E3B] hover:bg-emerald-50 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              View Offers
            </button>
          </div>

          {/* Decorative glowing sphere background */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* Promo Offers Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#166534]" />
                <h3 className="text-lg font-bold text-gray-900">Active Promo Offers</h3>
              </div>
              <button
                onClick={() => setPromoModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-900 tracking-wider">FIRSTGOAL20</span>
                  <p className="text-xs text-emerald-700 mt-0.5">20% OFF on your very first booking</p>
                </div>
                <button
                  onClick={() => copyPromo('FIRSTGOAL20')}
                  className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-bold shadow-sm"
                >
                  {copiedCode === 'FIRSTGOAL20' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-900 tracking-wider">WEEKEND50</span>
                  <p className="text-xs text-emerald-700 mt-0.5">Flat ₹150 OFF on Saturday & Sunday slots</p>
                </div>
                <button
                  onClick={() => copyPromo('WEEKEND50')}
                  className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-bold shadow-sm"
                >
                  {copiedCode === 'WEEKEND50' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  setPromoModalOpen(false);
                  navigate('/turfs');
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
              >
                Explore Turfs & Apply Code
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
