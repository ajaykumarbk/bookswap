import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Star, Users, Heart, ArrowRightLeft, BookOpen, BellRing, Info } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Book, BookRecommendation, WishlistItem } from '../types';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onOpenSwapModal: (book: Book) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenSwapModal }) => {
  const { user } = useAuth();
  const { location, setRadius, openLocationModal } = useLocation();

  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [nearbyBooks, setNearbyBooks] = useState<Book[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [wishlistMatches, setWishlistMatches] = useState<WishlistItem[]>([]);
  const [selectedScoreBreakdown, setSelectedScoreBreakdown] = useState<BookRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  const radiusOptions = [5, 10, 25, 50, 100];

  useEffect(() => {
    loadDashboardData();
  }, [location.radiusKm, location.lat, location.lng, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Recommended Books Nearby
      const recRes = await api.getRecommendedBooks(location.lat, location.lng, location.radiusKm);
      setRecommendations(recRes.recommendations || []);

      // 2. Nearby Books
      const bookRes = await api.getNearbyBooks(location.lat, location.lng, location.radiusKm, 12);
      setNearbyBooks(bookRes.books || []);

      // 3. Wishlist matches if user logged in
      if (user) {
        const wishRes = await api.getWishlist();
        const matches = (wishRes.wishlist || []).filter((w: WishlistItem) => (w.availableNearbyCount || 0) > 0);
        setWishlistMatches(matches);
      }

      // 4. Nearby Users Demo Data
      const usersDemo = [
        { id: 'usr_1', name: 'Rahul Sharma', distance: 2.4, rating: 4.9, booksCount: 12, city: 'Bengaluru', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
        { id: 'usr_2', name: 'Ajay Kumar', distance: 3.1, rating: 4.8, booksCount: 15, city: 'Bengaluru', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
        { id: 'usr_3', name: 'Priya Patel', distance: 4.5, rating: 5.0, booksCount: 8, city: 'Bengaluru', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
        { id: 'usr_4', name: 'Ananya Rao', distance: 5.2, rating: 4.7, booksCount: 10, city: 'Bengaluru', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' }
      ];
      setNearbyUsers(usersDemo.filter(u => u.id !== user?.id));

    } catch (err) {
      console.error('Error loading homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Location Bar & Radius Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-slate-900 text-base">📍 {location.city}</span>
              <button
                onClick={openLocationModal}
                className="text-[11px] font-semibold text-amber-700 hover:underline"
              >
                Change Location
              </button>
            </div>
            <p className="text-slate-500 text-xs">Filter books within your neighborhood radius</p>
          </div>
        </div>

        {/* Radius Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 px-2">Radius:</span>
          {radiusOptions.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                location.radiusKm === r
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Wishlist Matches Alert Banner */}
      {wishlistMatches.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Wishlist Books Available Nearby!</h4>
              <p className="text-amber-100 text-xs mt-0.5">
                {wishlistMatches.length} title(s) from your wishlist are currently listed for swap within {location.radiusKm} km.
              </p>
            </div>
          </div>
          <Link
            to={`/profile/${user?.id}`}
            className="px-4 py-2 bg-white text-amber-900 font-bold text-xs rounded-xl hover:bg-amber-50 shadow-sm shrink-0"
          >
            View Wishlist Matches →
          </Link>
        </div>
      )}

      {/* Recommended Books Nearby (Smart Engine) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-slate-900">Recommended Books Nearby</h2>
              <p className="text-slate-500 text-xs">Personalized recommendation score based on wishlist, genre & proximity</p>
            </div>
          </div>
          <Link to="/discover" className="text-xs font-semibold text-amber-700 hover:underline">
            See All →
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            No recommendations found within {location.radiusKm} km. Try expanding your search radius.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 8).map((rec) => (
              <div key={rec.book.id} className="relative">
                {/* Score Match Badge */}
                <div
                  onClick={() => setSelectedScoreBreakdown(rec)}
                  className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md cursor-pointer hover:scale-105 transition-transform flex items-center gap-1"
                  title="Click to view match score breakdown"
                >
                  <span>{rec.recommendationScore}% Match</span>
                  <Info className="w-3 h-3 text-amber-200" />
                </div>

                <BookCard
                  book={rec.book}
                  onOpenSwapModal={onOpenSwapModal}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Score Breakdown Modal */}
      {selectedScoreBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Recommendation Score Breakdown</h4>
              <button onClick={() => setSelectedScoreBreakdown(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800">{selectedScoreBreakdown.book.title}</div>
              <div className="flex justify-between py-1 border-b">
                <span>Total Score:</span>
                <span className="font-bold text-amber-700">{selectedScoreBreakdown.recommendationScore} / 100</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Wishlist Match (30%):</span>
                <span className="font-semibold text-emerald-600">+{selectedScoreBreakdown.matchReasons.wishlistScore} pts</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Genre Match (25%):</span>
                <span className="font-semibold text-emerald-600">+{selectedScoreBreakdown.matchReasons.genreScore} pts</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Distance Proximity (20%):</span>
                <span className="font-semibold text-emerald-600">+{selectedScoreBreakdown.matchReasons.distanceScore} pts</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Owner Rating & Popularity (25%):</span>
                <span className="font-semibold text-emerald-600">+{selectedScoreBreakdown.matchReasons.ratingScore} pts</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedScoreBreakdown(null)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Books You May Like */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-xl text-slate-900">Books You May Like</h2>
          <Link to="/discover" className="text-xs font-semibold text-amber-700 hover:underline">
            Explore All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {nearbyBooks.slice(0, 6).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpenSwapModal={onOpenSwapModal}
            />
          ))}
        </div>
      </section>

      {/* Nearby Users */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-xl text-slate-900">Nearby Readers in {location.city}</h2>
            <p className="text-slate-500 text-xs">Connect with local book owners for upcoming title exchanges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {nearbyUsers.map((u) => (
            <div key={u.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 hover:bg-amber-50/50 transition-colors">
              <img
                src={u.image}
                alt={u.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-300"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate">{u.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{u.distance} km away</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-medium">
                  <span className="text-amber-700 font-semibold">⭐ {u.rating}</span>
                  <span>• {u.booksCount} books</span>
                </div>
              </div>

              <Link
                to={`/profile/${u.id}`}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-amber-800 text-[11px] font-semibold transition-all shadow-2xs shrink-0"
              >
                Profile
              </Link>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
