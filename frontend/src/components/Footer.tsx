import React from 'react';
import { BookOpen, ShieldCheck, Heart, MapPin, RefreshCw, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-lg text-white">BookSwap</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The hyperlocal physical book exchange platform connecting passionate readers within walking and driving distance.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-md w-fit">
              <Lock className="w-3 h-3" />
              <span>Exact Addresses Never Exposed</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/discover" className="hover:text-amber-400 transition-colors">Discover Books Nearby</Link></li>
              <li><Link to="/swaps" className="hover:text-amber-400 transition-colors">Active Swap Requests</Link></li>
              <li><Link to="/add-book" className="hover:text-amber-400 transition-colors">List a Physical Book</Link></li>
              <li><Link to="/my-books" className="hover:text-amber-400 transition-colors">Personal Library Dashboard</Link></li>
            </ul>
          </div>

          {/* Community Safety */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Trust & Safety</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Public Exchange Meetups Only</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Fuzzy Geographic Radius</li>
              <li className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Automated Ownership Transfers</li>
            </ul>
          </div>

          {/* Getting Started */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h4 className="font-semibold text-amber-400 mb-1 text-xs">Join the Community</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Create your free account today to list books sitting on your shelf, connect with nearby readers, and swap books safely in your neighborhood.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 BookSwap Platform. Built for community readers.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for book lovers everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
