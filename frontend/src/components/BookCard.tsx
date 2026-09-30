import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, ArrowRightLeft } from 'lucide-react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onOpenSwapModal?: (book: Book) => void;
  onToggleWishlist?: (book: Book) => void;
  isInWishlist?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenSwapModal,
  onToggleWishlist,
  isInWishlist = false
}) => {
  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'New': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Like New': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Very Good': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Good': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-250 flex flex-col overflow-hidden relative">
      
      {/* Cover Image */}
      <div className="aspect-3/4 relative overflow-hidden bg-slate-100">
        <img
          src={book.cover_image || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600`}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-xs ${getConditionColor(book.condition)}`}>
          {book.condition}
        </span>

        {/* Distance Badge */}
        {book.distanceKm !== undefined && (
          <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{book.distanceKm} km away</span>
          </span>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            onClick={() => onToggleWishlist(book)}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isInWishlist
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500'
            }`}
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Body Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-amber-700 mb-1">
            <span>{book.genre}</span>
            {book.language && <span className="text-slate-400 font-normal">{book.language}</span>}
          </div>

          <Link to={`/book/${book.id}`} className="block">
            <h3 className="font-serif font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">
              {book.title}
            </h3>
          </Link>

          <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
            by {book.author}
          </p>
        </div>

        {/* Owner Snapshot */}
        <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={book.owner_image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100`}
              alt={book.owner_name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                {book.owner_name || 'Book Lover'}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{book.owner_rating ? book.owner_rating.toFixed(1) : '4.8'}</span>
              </div>
            </div>
          </div>

          {/* Swap Action CTA */}
          {onOpenSwapModal ? (
            <button
              onClick={() => onOpenSwapModal(book)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs hover:shadow-md"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swap</span>
            </button>
          ) : (
            <Link
              to={`/book/${book.id}`}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Details →
            </Link>
          )}
        </div>

      </div>

    </div>
  );
};
