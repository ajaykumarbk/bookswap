import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { SwapRequest } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RatingModalProps {
  swap: SwapRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  swap,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual', 'Great Condition']);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !swap || !user) return null;

  const revieweeId = swap.requester_id === user.id ? swap.owner_id : swap.requester_id;
  const revieweeName = swap.requester_id === user.id ? swap.owner_name : swap.requester_name;

  const tagOptions = ['Punctual', 'Great Condition', 'Friendly', 'Fast Communication', 'Safe Meetup'];

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter(item => item !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReview({
        swap_request_id: swap.id,
        reviewee_id: revieweeId,
        rating,
        comment,
        tags: selectedTags
      });
      onSubmitted();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg">Rate Swap Partner</h3>
            <p className="text-amber-100 text-xs">Share your exchange experience with {revieweeName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Star Selector */}
          <div className="text-center py-2">
            <span className="text-xs text-slate-500 font-medium block mb-2">How was your overall experience?</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 hover:scale-125 transition-transform focus:outline-hidden"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star ? 'fill-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tag Badges */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Feedback Badges</label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((t) => {
                const isSel = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      isSel
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    + {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Written Review</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell the community how punctual, friendly, and reliable your swap partner was..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-600/20 transition-all"
          >
            {loading ? 'Submitting Review...' : 'Submit Partner Review'}
          </button>
        </form>

      </div>
    </div>
  );
};
