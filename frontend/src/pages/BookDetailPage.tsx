import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Heart, ArrowRightLeft, ShieldCheck, BookOpen, User as UserIcon, AlertTriangle } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Book } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

interface BookDetailPageProps {
  onOpenSwapModal: (book: Book) => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({ onOpenSwapModal }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [ownerOtherBooks, setOwnerOtherBooks] = useState<Book[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadBookDetails();
    }
  }, [id]);

  const loadBookDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getBookById(id!);
      setBook(res.book);
      setDistanceKm(res.distanceKm);
      setOwnerOtherBooks(res.ownerOtherBooks || []);
    } catch (e) {
      console.error('Failed fetching book details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!book || !user) return;
    try {
      if (isInWishlist) {
        setIsInWishlist(false);
      } else {
        await api.addToWishlist({
          book_title: book.title,
          author: book.author,
          isbn: book.isbn
        });
        setIsInWishlist(true);
      }
    } catch (e) {}
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading book details...</div>;
  }

  if (!book) {
    return <div className="p-12 text-center text-slate-400">Book not found or has been removed.</div>;
  }

  const isOwner = user?.id === book.owner_id;

  return (
    <div className="space-y-12">
      
      {/* Main Book Hero Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cover Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-3/4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md relative">
            <img
              src={book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              {book.condition}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Views: {book.views}</span>
            <span>Requested: {book.swap_requests_count || 0} times</span>
          </div>
        </div>

        {/* Metadata & Actions Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            
            {/* Badges Bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-md">
                {book.genre}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-600 text-xs font-semibold">{book.language}</span>
              {distanceKm !== null && (
                <span className="bg-slate-900 text-white text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ml-auto">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>📍 ~{distanceKm} km away</span>
                </span>
              )}
            </div>

            <h1 className="font-serif font-extrabold text-3xl text-slate-900">{book.title}</h1>
            <p className="text-slate-600 font-medium text-base mt-1">by {book.author}</p>

            {/* Quick Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 my-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ISBN</span>
                <span className="font-mono font-semibold text-slate-800">{book.isbn || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Publisher</span>
                <span className="font-semibold text-slate-800">{book.publisher || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Published</span>
                <span className="font-semibold text-slate-800">{book.publication_year || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className={`font-extrabold ${book.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {book.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Book Description</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {book.description || 'No detailed description provided for this book.'}
              </p>
            </div>
          </div>

          {/* Owner Box & Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            {/* Owner Snapshot */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={book.owner_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                  alt={book.owner_name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{book.owner_name}</span>
                    <span className="text-amber-700 text-xs bg-amber-100 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {book.owner_rating ? book.owner_rating.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {book.owner_city} • {book.owner_completed_swaps || 0} completed swaps
                  </p>
                </div>
              </div>

              <Link
                to={`/profile/${book.owner_id}`}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-semibold"
              >
                View Profile
              </Link>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {!isOwner && book.status === 'Available' && (
                <button
                  onClick={() => onOpenSwapModal(book)}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Request Swap for this Book</span>
                </button>
              )}

              <button
                onClick={handleToggleWishlist}
                className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isInWishlist
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-white' : ''}`} />
                <span>{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="p-3.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Report Listing"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Owner's Other Available Books */}
      {ownerOtherBooks.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-serif font-bold text-xl text-slate-900">
            Other Books Available from {book.owner_name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ownerOtherBooks.map((other) => (
              <BookCard
                key={other.id}
                book={other}
                onOpenSwapModal={onOpenSwapModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report Modal */}
      <ReportModal
        reportedBookId={book.id}
        reportedUserId={book.owner_id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

    </div>
  );
};
