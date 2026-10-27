import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Shield, Building2, Calendar, LogOut,
  ChevronDown, Sparkles, Key, MapPin, User as UserIcon,
  Check, ExternalLink, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & Dropdown states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs for click-outside detection
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Handle dynamic elevation shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click-outside to dismiss open menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setRoleDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(target)) {
        setCityDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRoleDropdownOpen(false);
        setUserMenuOpen(false);
        setCityDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setRoleDropdownOpen(false);
    setUserMenuOpen(false);
    setCityDropdownOpen(false);
  }, [location.pathname]);

  const handleQuickSwitch = async (roleKey: 'admin' | 'owner' | 'new_owner' | 'customer') => {
    try {
      const loggedUser = await quickLogin(roleKey);
      setRoleDropdownOpen(false);
      setMobileMenuOpen(false);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'TURF_OWNER') {
        navigate('/owner');
      } else {
        navigate('/turfs');
      }
    } catch (e) {
      console.error('Quick switch failed:', e);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const cities = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad'];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#064E3B]/95 backdrop-blur-md shadow-lg shadow-black/10 border-b border-emerald-900/80 py-3'
          : 'bg-[#064E3B] border-b border-emerald-900/60 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* ======================================================== */}
          {/* LEFT: BRAND LOGO & CITY SELECTOR */}
          {/* ======================================================== */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] rounded-xl"
              aria-label="TurfHub Homepage"
            >
              {/* Refined Soccer Ball Logo matching reference mockup */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-500/50 shadow-inner group-hover:scale-105 group-hover:border-[#22c55e] transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#22c55e] drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.6" fill="#064E3B"/>
                  <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#22c55e" />
                  <line x1="12" y1="2" x2="12" y2="7" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="15" y1="9.5" x2="19.5" y2="7.5" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="14" y1="13.5" x2="17.5" y2="18" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="10" y1="13.5" x2="6.5" y2="18" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="9" y1="9.5" x2="4.5" y2="7.5" stroke="#22c55e" strokeWidth="1.6"/>
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Turf<span className="text-[#22c55e] font-extrabold ml-0.5">Hub</span>
              </span>
            </Link>

            {/* City Selector Pill (SaaS Feature) */}
            <div className="relative hidden xl:block" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 text-xs font-semibold text-emerald-200 transition-colors"
                aria-expanded={cityDropdownOpen}
              >
                <MapPin className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-emerald-400" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Select Your City
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-xs font-medium text-gray-800 transition-colors"
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER: DESKTOP NAVIGATION (Matching Reference Design)  */}
          {/* ======================================================== */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-8 text-sm font-semibold">
            <Link
              to="/"
              className={`relative py-1 transition-colors duration-200 ${
                isActive('/')
                  ? 'text-white'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]" />
              )}
            </Link>

            <Link
              to="/turfs"
              className={`relative py-1 transition-colors duration-200 ${
                isActive('/turfs')
                  ? 'text-white'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              Turfs
              {isActive('/turfs') && (
                <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]" />
              )}
            </Link>

            <Link
              to={isAuthenticated ? "/my-bookings" : "/login?redirect=/my-bookings"}
              className={`relative py-1 transition-colors duration-200 ${
                isActive('/my-bookings')
                  ? 'text-white'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              Bookings
              {isActive('/my-bookings') && (
                <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]" />
              )}
            </Link>

            <a
              href="#about"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/#about');
                }
              }}
              className="py-1 text-emerald-100/80 hover:text-white transition-colors duration-200"
            >
              About
            </a>

            <a
              href="#contact"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/#contact');
                }
              }}
              className="py-1 text-emerald-100/80 hover:text-white transition-colors duration-200"
            >
              Contact
            </a>

            {/* Quick Contextual Dashboard Shortcut for Logged-in Staff */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-700/60 transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-purple-300" />
                <span>Admin Console</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'TURF_OWNER' && (
              <Link
                to="/owner"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold border border-blue-700/60 transition-all shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Owner Portal</span>
              </Link>
            )}
          </nav>

          {/* ======================================================== */}
          {/* RIGHT: DEMO SWITCHER, USER MENU & "BOOK NOW" CTA        */}
          {/* ======================================================== */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* 1. Fast Role Evaluator Switcher */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/90 transition-all shadow-sm hover:border-emerald-400"
                aria-label="Switch Test Role"
                aria-expanded={roleDropdownOpen}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Role Switcher</span>
                <ChevronDown className={`w-3 h-3 text-emerald-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-fade-in text-xs">
                  <div className="px-3.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Switch Role (1-Click Test)
                    </span>
                    <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      Instant Session
                    </span>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('admin')}
                      className="w-full text-left p-2.5 hover:bg-purple-50/80 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                        👑
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 flex items-center justify-between">
                          <span>Administrator</span>
                          {user?.role === 'ADMIN' && <span className="text-[10px] text-purple-600 font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">Create turf owners, view all revenue</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('owner')}
                      className="w-full text-left p-2.5 hover:bg-blue-50/80 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                        🏟️
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 flex items-center justify-between">
                          <span>Active Turf Owner</span>
                          {user?.role === 'TURF_OWNER' && !user.must_change_password && <span className="text-[10px] text-blue-600 font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">GreenField & Pace Arena dynamic pricing</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('new_owner')}
                      className="w-full text-left p-2.5 hover:bg-amber-50/80 rounded-xl flex items-center gap-3 transition-colors border border-dashed border-amber-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
                        <Key className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-amber-900 flex items-center justify-between">
                          <span>New Owner (First Login)</span>
                          <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-bold">Demo Reset</span>
                        </div>
                        <p className="text-[11px] text-amber-700 truncate">Tests mandatory password reset modal</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('customer')}
                      className="w-full text-left p-2.5 hover:bg-emerald-50/80 rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                        ⚽
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 flex items-center justify-between">
                          <span>Customer (John Doe)</span>
                          {user?.role === 'CUSTOMER' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">Book matches & download vouchers</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. User Account Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 transition-all text-xs font-medium"
                  aria-label="User Profile Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-[#22c55e] text-[#064E3B] font-black flex items-center justify-center text-xs shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
                      <div className="font-bold text-gray-900 text-sm truncate">{user.name}</div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</div>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900">
                        {user.role}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-gray-700 font-semibold transition-colors"
                        >
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      {user.role === 'TURF_OWNER' && (
                        <Link
                          to="/owner"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-gray-700 font-semibold transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          <span>Owner Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/my-bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-gray-700 font-semibold transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>My Bookings</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-2.5 font-semibold transition-colors border-t border-gray-100 mt-1 pt-1.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-emerald-100 hover:text-white px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* 3. Primary "Book Now" CTA (Matches reference image hero button) */}
            <Link
              to="/turfs"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-green-glow transition-all duration-200 active:scale-95 flex items-center gap-1.5"
            >
              <span>Book Now</span>
            </Link>

          </div>

          {/* ======================================================== */}
          {/* MOBILE MENU TOGGLE & QUICK CTA                            */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/turfs"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-sm"
            >
              Book Now
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 hover:text-white transition-colors"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE DRAWER (Exact matching mobile screen mockup)      */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#064E3B] border-t border-emerald-800/80 px-4 pt-4 pb-6 space-y-4 animate-fade-in shadow-2xl">
          
          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              to="/"
              className={`p-3 rounded-xl flex items-center justify-between ${
                isActive('/') ? 'bg-[#166534] text-white shadow-sm' : 'bg-emerald-950/50 text-emerald-100'
              }`}
            >
              <span>Home</span>
              {isActive('/') && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
            </Link>

            <Link
              to="/turfs"
              className={`p-3 rounded-xl flex items-center justify-between ${
                isActive('/turfs') ? 'bg-[#166534] text-white shadow-sm' : 'bg-emerald-950/50 text-emerald-100'
              }`}
            >
              <span>Explore Turfs</span>
              {isActive('/turfs') && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
            </Link>

            <Link
              to="/my-bookings"
              className={`p-3 rounded-xl flex items-center justify-between ${
                isActive('/my-bookings') ? 'bg-[#166534] text-white shadow-sm' : 'bg-emerald-950/50 text-emerald-100'
              }`}
            >
              <span>My Bookings</span>
              {isActive('/my-bookings') && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="p-3 rounded-xl bg-purple-950/70 border border-purple-800 text-purple-200 font-bold flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Panel</span>
              </Link>
            )}

            {user?.role === 'TURF_OWNER' && (
              <Link
                to="/owner"
                className="p-3 rounded-xl bg-blue-950/70 border border-blue-800 text-blue-200 font-bold flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Owner Portal</span>
              </Link>
            )}
          </div>

          {/* City Selector for Mobile */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#22c55e]" />
              City: {selectedCity}
            </span>
            <div className="flex gap-1">
              {cities.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCity === c ? 'bg-[#22c55e] text-[#064E3B]' : 'bg-emerald-900 text-emerald-200'
                  }`}
                >
                  {c.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Role Switcher for Mobile */}
          <div className="border-t border-emerald-800/80 pt-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#22c55e]" />
              Instant Role Switcher
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin')}
                className="px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800/50 text-purple-200 text-left"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('owner')}
                className="px-3 py-2 rounded-xl bg-blue-950/70 border border-blue-800/50 text-blue-200 text-left"
              >
                🏟️ Turf Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('new_owner')}
                className="px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-800/50 text-amber-200 text-left"
              >
                🔑 Reset Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('customer')}
                className="px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-200 text-left"
              >
                ⚽ Customer
              </button>
            </div>
          </div>

          {/* Profile / Auth Bar */}
          <div className="pt-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-red-200 bg-red-950/60 rounded-xl border border-red-900/60 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user?.name})</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="block w-full py-2.5 text-center text-xs font-black text-[#064E3B] bg-white hover:bg-emerald-50 rounded-xl shadow-md transition-colors"
              >
                Sign In to TurfHub
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
