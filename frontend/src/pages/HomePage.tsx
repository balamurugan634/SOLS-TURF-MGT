import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, ShieldCheck, Users, Zap, MapPin,
  Star, Heart, ArrowRight, Tag, X, ChevronDown,
  Search, Check, Trophy
} from 'lucide-react';
import { Turf } from '../types';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Bangalore');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [sportOpen, setSportOpen] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const sportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getTurfs().then(setTurfs).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (locationRef.current && !locationRef.current.contains(t)) setLocationOpen(false);
      if (dateRef.current && !dateRef.current.contains(t)) setDateOpen(false);
      if (sportRef.current && !sportRef.current.contains(t)) setSportOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLocationOpen(false); setDateOpen(false); setSportOpen(false); setPromoModalOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (selectedLocation && selectedLocation !== 'All') query.set('location', selectedLocation);
    if (selectedDate) query.set('date', selectedDate);
    if (selectedSport && selectedSport !== 'All Sports') query.set('sport', selectedSport);
    navigate(`/turfs?${query.toString()}`);
  };

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const locationOptions = [
    { value: 'Bangalore',      label: 'Bangalore',      area: 'All Regions' },
    { value: 'HSR',            label: 'HSR Layout',     area: 'Sector 1-7' },
    { value: 'Whitefield',     label: 'Whitefield',     area: 'ITPL & Outer Ring Rd' },
    { value: 'Koramangala',    label: 'Koramangala',    area: 'Block 3, 4 & 5' },
    { value: 'Indiranagar',    label: 'Indiranagar',    area: '100ft & 12th Main' },
    { value: 'Electronic City',label: 'Electronic City',area: 'Phase 1 & 2' },
  ];

  const sportOptions = ['All Sports', 'Football', 'Cricket', 'Basketball', 'Badminton', 'Tennis', 'Volleyball'];

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      if (dateStr === todayStr) return `Today, ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      if (dateStr === tom.toISOString().split('T')[0]) return `Tomorrow, ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ================================================================ */}
      {/* HERO — Full-width below navbar, responsive height ~500px          */}
      {/* ================================================================ */}
      <section className="relative w-full bg-[#064E3B] overflow-hidden min-h-[500px] lg:h-[500px] flex flex-col justify-between">

        {/* Background turf image with stadium field */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-turf-field.jpg"
            alt="Football Turf Field Arena"
            className="w-full h-full object-cover object-right md:object-center brightness-95"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80';
            }}
          />
          {/* Dark green overlay on the left for text readability, fading right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B] via-[#064E3B]/85 md:via-[#064E3B]/70 to-[#064E3B]/10 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Hero Content & Integrated Bottom Search Bar */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-8 flex flex-col justify-between flex-1 w-full">

          {/* Heading & Subtitle */}
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-white leading-[1.12] tracking-tight mb-3">
              Book Your<br />
              Perfect{' '}
              <span className="text-[#22c55e]">
                Turf
              </span>
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base font-normal leading-relaxed max-w-md">
              Find and book premium turfs for football, cricket, and more in your city.
            </p>
          </div>

          {/* ── Search Bar: Positioned in bottom portion of hero ── */}
          <div className="mt-8 md:mt-10 w-full max-w-4xl">
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl shadow-xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 w-full border border-gray-100/80"
            >

              {/* 1. Select Location */}
              <div className="relative flex-1 min-w-0" ref={locationRef}>
                <button
                  type="button"
                  onClick={() => { setLocationOpen(!locationOpen); setDateOpen(false); setSportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-[#166534] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider leading-none">Select Location</div>
                    <div className="text-[13px] sm:text-sm font-bold text-[#111827] mt-0.5 truncate flex items-center gap-1">
                      {selectedLocation}
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
                {locationOpen && (
                  <div className="absolute left-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locations</div>
                    {locationOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSelectedLocation(opt.value); setLocationOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${selectedLocation === opt.value ? 'bg-emerald-50 text-[#166534] font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}
                      >
                        <div>
                          <div className="font-bold text-[13px]">{opt.label}</div>
                          <div className="text-[10px] text-slate-400">{opt.area}</div>
                        </div>
                        {selectedLocation === opt.value && <Check className="w-3.5 h-3.5 text-[#166534]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-9 bg-slate-200 shrink-0" />

              {/* 2. Select Date */}
              <div className="relative flex-1 min-w-0" ref={dateRef}>
                <button
                  type="button"
                  onClick={() => { setDateOpen(!dateOpen); setLocationOpen(false); setSportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <Calendar className="w-4 h-4 text-[#166534] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider leading-none">Select Date</div>
                    <div className="text-[13px] sm:text-sm font-bold text-[#111827] mt-0.5 truncate flex items-center gap-1">
                      {formatDisplayDate(selectedDate)}
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dateOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
                {dateOpen && (
                  <div className="absolute left-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 w-68 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-fade-in" style={{ minWidth: '240px' }}>
                    <div className="text-xs font-bold text-slate-600 mb-2">Quick Select</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button type="button" onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setDateOpen(false); }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-[#166534] text-white border-[#166534]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}>⚡ Today</button>
                      <button type="button" onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); setSelectedDate(t.toISOString().split('T')[0]); setDateOpen(false); }}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200">📅 Tomorrow</button>
                    </div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Pick a Date</label>
                    <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setSelectedDate(e.target.value); setDateOpen(false); }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#166534] cursor-pointer" />
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-9 bg-slate-200 shrink-0" />

              {/* 3. Select Sport */}
              <div className="relative flex-1 min-w-0" ref={sportRef}>
                <button
                  type="button"
                  onClick={() => { setSportOpen(!sportOpen); setLocationOpen(false); setDateOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-[#166534] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2C12 2 9 7 9 12s3 10 3 10M12 2c1.5 2.5 3 5.5 3 10s-1.5 7.5-3 10M2 12h20M4.93 6.93l14.14 0M4.93 17.07l14.14 0" strokeWidth="1.5" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider leading-none">Select Sport</div>
                    <div className="text-[13px] sm:text-sm font-bold text-[#111827] mt-0.5 truncate flex items-center gap-1">
                      {selectedSport}
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${sportOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
                {sportOpen && (
                  <div className="absolute left-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-fade-in">
                    {sportOptions.map(sport => (
                      <button key={sport} type="button"
                        onClick={() => { setSelectedSport(sport); setSportOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-[13px] transition-colors ${selectedSport === sport ? 'bg-emerald-50 text-[#166534] font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'}`}>
                        {sport}
                        {selectedSport === sport && <Check className="w-3.5 h-3.5 text-[#166534]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Search Button (Dark Green) */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-[#064E3B] hover:bg-[#166534] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Turfs</span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURES SECTION — Clean horizontal feature strip                */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-4 sm:px-8 py-5 sm:py-6 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            { 
              icon: <Calendar className="w-6 h-6 text-[#166534] stroke-[1.8]" />, 
              title: 'Easy Booking', 
              desc: 'Book in a few clicks' 
            },
            { 
              icon: <ShieldCheck className="w-6 h-6 text-[#166534] stroke-[1.8]" />, 
              title: 'Quality Turfs', 
              desc: 'Well-maintained grounds' 
            },
            { 
              icon: <Users className="w-6 h-6 text-[#166534] stroke-[1.8]" />, 
              title: 'Multiple Sports', 
              desc: 'Football, Cricket & more' 
            },
            { 
              icon: <Zap className="w-6 h-6 text-[#166534] stroke-[1.8]" />, 
              title: 'Instant Confirmation', 
              desc: 'Get confirmed instantly' 
            },
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3.5 px-3 sm:px-5 py-3 md:py-1">
              <div className="shrink-0 flex items-center justify-center">
                {feat.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-[#111827]">{feat.title}</div>
                <div className="text-xs text-[#64748B] font-normal mt-0.5">{feat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* POPULAR TURFS — Professional Turf Listing                        */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Popular Turfs in <span className="text-[#166534]">Bangalore</span>
            </h2>
            <p className="text-sm text-[#64748B] font-normal mt-1">
              Discover great places for your next game.
            </p>
          </div>
          <Link
            to="/turfs"
            className="text-sm font-bold text-[#166534] hover:text-[#064E3B] flex items-center gap-1.5 transition-colors group"
          >
            <span>View All Turfs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {turfs.slice(0, 4).map(turf => {
              const isFav = favorites.includes(turf.id);
              return (
                <div key={turf.id} className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group">

                  {/* Card Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={turf.main_image}
                      alt={turf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1529900245534-47fbf02a4b5b?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {/* Heart Favorite button */}
                    <button
                      onClick={e => toggleFavorite(turf.id, e)}
                      aria-label="Favorite"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm hover:bg-white transition-all active:scale-90"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                    </button>
                    {/* Sports Tags */}
                    <div className="absolute bottom-2.5 left-3 flex gap-1.5">
                      {turf.sports?.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#166534] transition-colors line-clamp-1">{turf.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-[#111827]">{turf.rating}</span>
                        <span className="text-[10px] text-[#64748B]">({turf.review_count})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium mb-3">
                      <MapPin className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                      <span className="truncate">{turf.location}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                      <div>
                        <span className="text-base font-extrabold text-[#111827]">₹{Math.round(turf.hourly_base_price).toLocaleString()}</span>
                        <span className="text-xs text-[#64748B] font-normal"> / hr</span>
                      </div>
                      <Link
                        to={`/turfs/${turf.id}`}
                        className="px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
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

      {/* ================================================================ */}
      {/* PROMO BANNER                                                      */}
      {/* ================================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#064E3B] via-[#085540] to-[#166534] text-white p-7 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg border border-emerald-800/40">
          <div className="flex items-center gap-5 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center p-3 border border-white/20 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="1.5" fill="#042F24"/>
                <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#FFFFFF" />
                <line x1="12" y1="2" x2="12" y2="7" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="15" y1="9.5" x2="19.5" y2="7.5" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="14" y1="13.5" x2="17.5" y2="18" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="10" y1="13.5" x2="6.5" y2="18" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="9" y1="9.5" x2="4.5" y2="7.5" stroke="#FFFFFF" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-1.5 border border-emerald-400/30">
                <Zap className="w-3 h-3 text-[#22c55e]" /> Special Player Offer
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">Play More, Save More!</h3>
              <p className="text-emerald-100/90 text-xs sm:text-sm max-w-lg leading-relaxed">Get up to 20% off on your next booking with TurfHub promo pass. Valid across all verified arenas.</p>
            </div>
          </div>
          <div className="z-10 shrink-0 w-full sm:w-auto">
            <button onClick={() => setPromoModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-emerald-50 text-[#064E3B] font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2">
              View Offers <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PROMO MODAL                                                       */}
      {/* ================================================================ */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Active Promo Offers</h3>
                  <p className="text-xs text-gray-500 font-medium">Use code at checkout to claim discount</p>
                </div>
              </div>
              <button onClick={() => setPromoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {[
                { code: 'FIRSTGOAL20', desc: '20% OFF on your very first booking' },
                { code: 'WEEKEND50', desc: 'Flat ₹150 OFF on Saturday & Sunday slots' },
              ].map(({ code, desc }) => (
                <div key={code} className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-black text-emerald-950 tracking-wider">{code}</span>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => copyPromo(code)}
                    className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#064E3B] text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0">
                    {copiedCode === code ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button onClick={() => { setPromoModalOpen(false); navigate('/turfs'); }}
                className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                Explore Turfs & Apply Code <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
