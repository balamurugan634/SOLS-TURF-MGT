import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Shield, Building2, Calendar, LogOut,
  ChevronDown, Sparkles, Key, MapPin, User as UserIcon,
  Check, ExternalLink, Zap, Home, Compass, Info, Phone,
  ChevronRight
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
      className={`sticky top-0 z-40 bg-white border-b border-[#E5E7EB] transition-all duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] sm:h-20">
        <div className="flex items-center justify-between h-full">
          
          {/* ======================================================== */}
          {/* LEFT: BRAND LOGO & CITY SELECTOR */}
          {/* ======================================================== */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] rounded-xl"
              aria-label="TurfHub Homepage"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#064E3B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300 shrink-0">
                <svg className="w-5 h-5 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.6" fill="#064E3B"/>
                  <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#22c55e" />
                  <line x1="12" y1="2" x2="12" y2="7" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="15" y1="9.5" x2="19.5" y2="7.5" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="14" y1="13.5" x2="17.5" y2="18" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="10" y1="13.5" x2="6.5" y2="18" stroke="#22c55e" strokeWidth="1.6"/>
                  <line x1="9" y1="9.5" x2="4.5" y2="7.5" stroke="#22c55e" strokeWidth="1.6"/>
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#111827] flex items-center">
                Turf<span className="text-[#166534] font-extrabold ml-0.5">Hub</span>
              </span>
            </Link>

            {/* City Selector Pill */}
            <div className="relative hidden sm:block" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                aria-expanded={cityDropdownOpen}
              >
                <MapPin className="w-3.5 h-3.5 text-[#166534]" />
                <span>{selectedCity}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Your City
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-xs font-medium text-slate-800 transition-colors"
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check className="w-3.5 h-3.5 text-[#166534]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER: DESKTOP NAVIGATION (Clean Dark Text & Active Indicator) */}
          {/* ======================================================== */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-8 text-sm font-semibold h-full">
            <Link
              to="/"
              className={`h-full flex items-center transition-colors duration-200 ${
                isActive('/')
                  ? 'text-[#166534] font-bold'
                  : 'text-slate-600 hover:text-[#166534]'
              }`}
            >
              <span className="relative py-1">
                Home
                {isActive('/') && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#22c55e] rounded-full" />
                )}
              </span>
            </Link>

            <Link
              to="/turfs"
              className={`h-full flex items-center transition-colors duration-200 ${
                isActive('/turfs')
                  ? 'text-[#166534] font-bold'
                  : 'text-slate-600 hover:text-[#166534]'
              }`}
            >
              <span className="relative py-1">
                Turfs
                {isActive('/turfs') && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#22c55e] rounded-full" />
                )}
              </span>
            </Link>

            <Link
              to={isAuthenticated ? "/my-bookings" : "/login?redirect=/my-bookings"}
              className={`h-full flex items-center transition-colors duration-200 ${
                isActive('/my-bookings')
                  ? 'text-[#166534] font-bold'
                  : 'text-slate-600 hover:text-[#166534]'
              }`}
            >
              <span className="relative py-1">
                Bookings
                {isActive('/my-bookings') && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#22c55e] rounded-full" />
                )}
              </span>
            </Link>

            <a
              href="#about"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/#about');
                }
              }}
              className="h-full flex items-center text-slate-600 hover:text-[#166534] transition-colors duration-200"
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
              className="h-full flex items-center text-slate-600 hover:text-[#166534] transition-colors duration-200"
            >
              Contact
            </a>

            {/* Quick Contextual Dashboard Shortcut for Logged-in Staff */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Console</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'TURF_OWNER' && (
              <Link
                to="/owner"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Owner Portal</span>
              </Link>
            )}
          </nav>

          {/* ======================================================== */}
          {/* RIGHT: DEMO SWITCHER, USER MENU & "BOOK NOW" CTA */}
          {/* ======================================================== */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* 1. Fast Role Evaluator Switcher */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#166534] transition-all shadow-sm"
                aria-label="Switch Test Role"
                aria-expanded={roleDropdownOpen}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#166534]" />
                <span>Role Switcher</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-50 animate-fade-in text-xs">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Role (1-Click Test)
                    </span>
                    <span className="text-[9px] font-semibold bg-emerald-100 text-[#064E3B] px-1.5 py-0.5 rounded">
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
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Administrator</span>
                          {user?.role === 'ADMIN' && <span className="text-[10px] text-purple-600 font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">Create turf owners, view all revenue</p>
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
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Active Turf Owner</span>
                          {user?.role === 'TURF_OWNER' && !user.must_change_password && <span className="text-[10px] text-blue-600 font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">GreenField & Pace Arena dynamic pricing</p>
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
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Customer (John Doe)</span>
                          {user?.role === 'CUSTOMER' && <span className="text-[10px] text-[#166534] font-bold">Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">Book matches & download vouchers</p>
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
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
                  aria-label="User Profile Menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-[#166534] text-white font-black flex items-center justify-center text-xs shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-900 max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                      <div className="font-bold text-slate-900 text-sm truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</div>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-[#064E3B]">
                        {user.role}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#166534]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      {user.role === 'TURF_OWNER' && (
                        <Link
                          to="/owner"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-[#166534]" />
                          <span>Owner Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/my-bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 text-slate-700 font-semibold transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-[#166534]" />
                        <span>My Bookings</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-2.5 font-semibold transition-colors border-t border-slate-100 mt-1 pt-1.5"
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
                className="text-sm font-semibold text-slate-700 hover:text-[#166534] px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* 3. Primary "Book Now" CTA (Bright Green button) */}
            <Link
              to="/turfs"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-1.5"
            >
              <span>Book Now</span>
            </Link>

          </div>

          {/* ======================================================== */}
          {/* MOBILE MENU TOGGLE & QUICK CTA */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/turfs"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm"
            >
              Book Now
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE DRAWER (Clean white menu with dark text) */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-xl">
          
          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              to="/"
              className={`p-3 rounded-xl flex items-center justify-between border ${
                isActive('/') ? 'bg-emerald-50 text-[#166534] border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200/60'
              }`}
            >
              <span>Home</span>
              {isActive('/') && <Check className="w-3.5 h-3.5 text-[#166534]" />}
            </Link>

            <Link
              to="/turfs"
              className={`p-3 rounded-xl flex items-center justify-between border ${
                isActive('/turfs') ? 'bg-emerald-50 text-[#166534] border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200/60'
              }`}
            >
              <span>Explore Turfs</span>
              {isActive('/turfs') && <Check className="w-3.5 h-3.5 text-[#166534]" />}
            </Link>

            <Link
              to="/my-bookings"
              className={`p-3 rounded-xl flex items-center justify-between border ${
                isActive('/my-bookings') ? 'bg-emerald-50 text-[#166534] border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200/60'
              }`}
            >
              <span>My Bookings</span>
              {isActive('/my-bookings') && <Check className="w-3.5 h-3.5 text-[#166534]" />}
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Panel</span>
              </Link>
            )}

            {user?.role === 'TURF_OWNER' && (
              <Link
                to="/owner"
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Owner Portal</span>
              </Link>
            )}
          </div>

          {/* City Selector for Mobile */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#166534]" />
              City: {selectedCity}
            </span>
            <div className="flex gap-1">
              {cities.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCity === c ? 'bg-[#166534] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Demo Role Switcher for Mobile */}
          <div className="border-t border-slate-200 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#166534]" />
              Instant Role Switcher
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin')}
                className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-left"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('owner')}
                className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-left"
              >
                🏟️ Turf Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('new_owner')}
                className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-left"
              >
                🔑 Reset Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('customer')}
                className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#064E3B] text-left"
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
                className="w-full py-2.5 text-center text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user?.name})</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="block w-full py-2.5 text-center text-xs font-bold text-white bg-[#166534] hover:bg-[#064E3B] rounded-xl shadow-sm transition-colors"
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
