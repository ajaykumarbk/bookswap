import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, ArrowRightLeft, ShieldCheck, Star, Users, Sparkles, Heart, ChevronRight, CheckCircle2 } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Book } from '../types';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenSwapModal: (book: Book) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onOpenSwapModal }) => {
  const navigate = useNavigate();
  const { location, openLocationModal } = useLocation();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);

  useEffect(() => {
    loadFeaturedBooks();
  }, [location]);

  const loadFeaturedBooks = async () => {
    try {
      const res = await api.getNearbyBooks(location.lat, location.lng, 50, 6);
      setFeaturedBooks(res.books || []);
    } catch (e) {}
  };

  const steps = [
    { num: '01', title: 'Add Your Books', desc: 'List physical books sitting on your shelf with instant ISBN lookup.' },
    { num: '02', title: 'Discover Nearby Books', desc: 'Browse available books listed by readers within your city radius.' },
    { num: '03', title: 'Request a Swap', desc: 'Offer one or multiple books from your collection for a title you want.' },
    { num: '04', title: 'Meet Safely', desc: 'Coordinate a meeting at a public library, coffee shop, or metro station.' },
    { num: '05', title: 'Exchange & Review', desc: 'Hand over physical books, confirm exchange, and rate your swap partner.' }
  ];

  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pt-12 pb-20 rounded-3xl border border-amber-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-semibold shadow-2xs animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Hyperlocal Community Book Exchange Platform</span>
          </div>

          <h1 className="font-serif font-extrabold text-4xl sm:text-6xl text-slate-900 tracking-tight leading-[1.15]">
            Swap Books. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
              Discover Readers.
            </span> Build Your Library.
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Connect with passionate readers in your neighborhood. Exchange physical books safely without money, expand your shelf, and build community connections.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-xl shadow-amber-600/25 hover:scale-103 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Swapping Books</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <Link
              to="/discover"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all text-center"
            >
              Explore Nearby Books
            </Link>
          </div>

          {/* Location Badge Indicator */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              onClick={openLocationModal}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xs hover:border-amber-400 transition-all"
            >
              <MapPin className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>Showing books near <strong>{location.city}</strong> ({location.radiusKm} km radius)</span>
              <span className="text-amber-700 underline text-[11px] ml-1">Change</span>
            </button>
          </div>

        </div>
      </section>

      {/* Featured Nearby Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">Available Books Near You</h2>
            <p className="text-slate-500 text-xs mt-1">Ready for exchange in {location.city}</p>
          </div>
          <Link to="/discover" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline">
            <span>View All ({featuredBooks.length}+)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            No books found within {location.radiusKm} km. Try increasing your location search radius!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {featuredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpenSwapModal={onOpenSwapModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-slate-900 text-white py-16 rounded-3xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-serif font-bold text-3xl text-white">How BookSwap Works</h2>
          <p className="text-slate-400 text-xs">Five simple steps to exchange your books safely</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 relative flex flex-col justify-between">
              <div>
                <span className="font-serif font-extrabold text-2xl text-amber-400 mb-2 block">{s.num}</span>
                <h3 className="font-bold text-sm text-white mb-1.5">{s.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif font-bold text-3xl text-slate-900">Built for Community & Privacy</h2>
          <p className="text-slate-500 text-xs">Designed with safety, trust ratings, and privacy protections at its core</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Location-Based Discovery</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Find physical books available within 5 to 100 km of your exact location using privacy-preserving distance calculations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Safety-First Public Exchanges</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Arrange meetups at verified public venues like local libraries or cafes. We never expose your private address or phone number.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Community Trust & Ratings</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Build your reputation with completed swap history, mutual user ratings, and verified review badges.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
