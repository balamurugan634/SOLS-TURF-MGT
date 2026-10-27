import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, ShieldCheck, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="about" className="bg-[#064E3B] text-white border-t border-emerald-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-800/80">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-500/40">
                <svg className="w-5 h-5 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.5" fill="#064E3B"/>
                  <polygon points="12,7 15,9.5 14,13.5 10,13.5 9,9.5" fill="#22c55e" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Turf<span className="text-[#22c55e]">Hub</span>
              </span>
            </div>
            <p className="text-emerald-100/80 text-sm max-w-sm leading-relaxed">
              India's premier sports turf booking & facility management ecosystem. Discover state-of-the-art football, cricket, and futsal arenas with real-time dynamic pricing and instant confirmation.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                100% Verified Grounds
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <Award className="w-4 h-4 text-[#22c55e]" />
                Best Price Guarantee
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/turfs" className="hover:text-white transition-colors">Explore All Turfs</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white transition-colors">Booking History</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Customer Login</Link></li>
              <li><Link to="/owner" className="hover:text-white transition-colors">Turf Owner Portal</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Console</Link></li>
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Sports</h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80">
              <li><Link to="/turfs?sport=Football" className="hover:text-white transition-colors">5v5 & 7v7 Football</Link></li>
              <li><Link to="/turfs?sport=Box%20Cricket" className="hover:text-white transition-colors">Box Cricket Arenas</Link></li>
              <li><Link to="/turfs?sport=Futsal" className="hover:text-white transition-colors">Futsal Grounds</Link></li>
              <li><Link to="/turfs?sport=Badminton" className="hover:text-white transition-colors">Badminton Courts</Link></li>
              <li><span className="text-emerald-400/60 text-xs">More sports coming soon</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-3 text-sm text-emerald-100/80">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span>HSR Layout, Bengaluru, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span>+91 80 4000 8900</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span>support@turfhub.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
          <p>© {new Date().getFullYear()} TurfHub Inc. All rights reserved. Built with React & Django.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cancellation Rules</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
