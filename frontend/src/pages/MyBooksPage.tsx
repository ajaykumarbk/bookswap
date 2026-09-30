import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Trash2, Edit3, Heart, Eye, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Book, WishlistItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MyBooksPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'All' | 'Available' | 'Reserved' | 'Swapped' | 'Wishlist'>('All');
  const [books, setBooks] = useState<Book[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Wishlist item input
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishAuthor, setNewWishAuthor] = useState('');

  useEffect(() => {
    if (user) {
      loadMyBooks();
      loadWishlist();
    }
  }, [user]);

  const loadMyBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getBooks({});
      const mine = (res.books || []).filter((b: Book) => b.owner_id === user?.id);
      setBooks(mine);
    } catch (e) {
      console.error('Failed fetching my books:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await api.getWishlist();
      setWishlist(res.wishlist || []);
    } catch (e) {}
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this book from your library?')) return;
    try {
      await api.deleteBook(id);
      setBooks(books.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove book.');
    }
  };

  const handleAddWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;
    try {
      await api.addToWishlist({
        book_title: newWishTitle.trim(),
        author: newWishAuthor.trim() || undefined
      });
      setNewWishTitle('');
      setNewWishAuthor('');
      loadWishlist();
    } catch (e) {}
  };

  const handleRemoveWishlist = async (id: string) => {
    try {
      await api.removeFromWishlist(id);
      setWishlist(wishlist.filter(w => w.id !== id));
    } catch (e) {}
  };

  const filteredBooks = books.filter(b => {
    if (activeTab === 'All') return true;
    return b.status === activeTab;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">My Library & Wishlist</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage your physical collection and desired swap titles</p>
        </div>

        <Link
          to="/add-book"
          className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add New Book</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {(['All', 'Available', 'Reserved', 'Swapped', 'Wishlist'] as const).map((tab) => {
          const count = tab === 'Wishlist' ? wishlist.length : books.filter(b => tab === 'All' || b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {tab === 'Wishlist' && <Heart className={`w-3.5 h-3.5 ${activeTab === 'Wishlist' ? 'fill-white' : ''}`} />}
              <span>{tab}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      {activeTab === 'Wishlist' ? (
        <div className="space-y-6">
          
          {/* Add to Wishlist Box */}
          <form onSubmit={handleAddWishlist} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Add Book to Wishlist</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newWishTitle}
                onChange={(e) => setNewWishTitle(e.target.value)}
                placeholder="Book title (e.g. Clean Code)"
                className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
              <input
                type="text"
                value={newWishAuthor}
                onChange={(e) => setNewWishAuthor(e.target.value)}
                placeholder="Author name (optional)"
                className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                + Add Wishlist Item
              </button>
            </div>
          </form>

          {/* Wishlist Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                Your wishlist is empty. Add titles you are hunting for!
              </div>
            ) : (
              wishlist.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-slate-900 text-sm">{w.book_title}</h4>
                      {w.author && <p className="text-slate-500 text-xs">by {w.author}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveWishlist(w.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Match alert indicator */}
                  {(w.availableNearbyCount || 0) > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-semibold text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        {w.availableNearbyCount} copy available nearby!
                      </span>
                      <Link
                        to={`/discover?search=${encodeURIComponent(w.book_title)}`}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Swap Now →
                      </Link>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No copies listed nearby yet. We will notify you when one appears!
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              No books found in this status. Click "+ Add New Book" above to list one!
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between p-4 space-y-3">
                <div className="flex gap-3">
                  <img
                    src={book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
                    alt={book.title}
                    className="w-16 h-22 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1 ${
                      book.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {book.status}
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-xs line-clamp-1">{book.title}</h4>
                    <p className="text-slate-500 text-[11px] truncate">by {book.author}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {book.views} views</span>
                      <span className="flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> {book.swap_requests_count || 0} reqs</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                  <Link to={`/book/${book.id}`} className="font-semibold text-amber-700 hover:underline text-[11px]">
                    View Public Page
                  </Link>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove Book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
