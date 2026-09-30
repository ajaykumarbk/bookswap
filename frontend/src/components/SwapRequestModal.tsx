import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, Plus, BookOpen } from 'lucide-react';
import { Book } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SwapRequestModalProps {
  targetBook: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  targetBook,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadMyAvailableBooks();
    }
  }, [isOpen, user]);

  const loadMyAvailableBooks = async () => {
    try {
      const res = await api.getBooks({ availability: 'Available', my_books: true });
      const availableMine = res.books || [];
      setMyBooks(availableMine);
      if (availableMine.length > 0) {
        setSelectedOfferedIds([availableMine[0].id]);
      }
    } catch (err) {
      console.error('Failed loading my books:', err);
    }
  };

  if (!isOpen || !targetBook) return null;

  const toggleSelectBook = (id: string) => {
    if (selectedOfferedIds.includes(id)) {
      if (selectedOfferedIds.length === 1) return; // Must keep at least one selected
      setSelectedOfferedIds(selectedOfferedIds.filter(i => i !== id));
    } else {
      setSelectedOfferedIds([...selectedOfferedIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOfferedIds.length === 0) {
      setError('Please select at least one book to offer in exchange.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createSwap({
        owner_id: targetBook.owner_id,
        requested_book_ids: [targetBook.id],
        offered_book_ids: selectedOfferedIds,
        message: message || `Hi ${targetBook.owner_name || ''}, I'd love to swap for "${targetBook.title}".`
      });

      onClose();
      navigate('/swaps');
    } catch (err: any) {
      setError(err.message || 'Failed to send swap request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-serif font-bold text-lg">Request Book Swap</h3>
              <p className="text-amber-100 text-xs">Propose a title exchange with {targetBook.owner_name || 'Owner'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* You Want Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
            <img
              src={targetBook.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
              alt={targetBook.title}
              className="w-12 h-16 object-cover rounded-lg"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">You Want</span>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{targetBook.title}</h4>
              <p className="text-slate-500 text-xs">by {targetBook.author}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Owner: {targetBook.owner_name}</p>
            </div>
          </div>

          {/* Select Offered Books */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select Book(s) You Offer in Exchange:
            </label>

            {myBooks.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <BookOpen className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-amber-900">You don't have any available books in your library!</p>
                <p className="text-[11px] text-amber-700 mt-1 mb-2">Please add a book first so you can offer it in exchange.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/add-book');
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-semibold"
                >
                  + Add Book Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myBooks.map((book) => {
                  const isSelected = selectedOfferedIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => toggleSelectBook(book.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-lg"
                        />
                        <div>
                          <h5 className="font-semibold text-slate-900 text-xs line-clamp-1">{book.title}</h5>
                          <p className="text-slate-500 text-[11px]">by {book.author}</p>
                          <span className="text-[10px] text-slate-400">Condition: {book.condition}</span>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Proposal Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Add a Friendly Note to {targetBook.owner_name}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I've been looking for this book. Let's arrange a swap!"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading || myBooks.length === 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Send Swap Request'}
          </button>
        </form>

      </div>
    </div>
  );
};
