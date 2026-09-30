import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, MapPin, CheckCircle2, XCircle, Clock, Star, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { SwapRequest } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChatModal } from '../components/ChatModal';
import { MeetupModal } from '../components/MeetupModal';
import { RatingModal } from '../components/RatingModal';

export const SwapsPage: React.FC = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'received' | 'sent'>('all');

  // Modal controls
  const [selectedChatSwap, setSelectedChatSwap] = useState<SwapRequest | null>(null);
  const [selectedMeetupSwap, setSelectedMeetupSwap] = useState<SwapRequest | null>(null);
  const [selectedRatingSwap, setSelectedRatingSwap] = useState<SwapRequest | null>(null);

  useEffect(() => {
    if (user) {
      loadSwaps();
    }
  }, [user, filterType]);

  const loadSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.getSwaps(filterType === 'all' ? undefined : filterType);
      setSwaps(res.swaps || []);
    } catch (e) {
      console.error('Failed fetching swaps:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.acceptSwap(id);
      loadSwaps();
    } catch (e: any) {
      alert(e.message || 'Failed to accept swap.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectSwap(id);
      loadSwaps();
    } catch (e: any) {
      alert(e.message || 'Failed to reject swap.');
    }
  };

  const handleCompleteExchange = async (id: string) => {
    if (!window.confirm('Have you physically handed over and received the books? This will permanently update book ownership!')) return;
    try {
      await api.completeExchange(id);
      loadSwaps();
    } catch (e: any) {
      alert(e.message || 'Failed to complete exchange.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this swap request?')) return;
    try {
      await api.cancelSwap(id);
      loadSwaps();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel swap.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'ACCEPTED': return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'MEETUP_PENDING': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'MEETUP_CONFIRMED': return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'EXCHANGE_COMPLETED': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'RATED': return 'bg-emerald-200 text-emerald-950 border-emerald-400';
      case 'REJECTED': return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'CANCELLED': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">Swap Requests Hub</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track live book proposals, meetups, chat, and exchange confirmations</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          {(['all', 'received', 'sent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                filterType === t ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Swaps List */}
      {swaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
          No swap requests found. Discover books nearby and send your first swap proposal!
        </div>
      ) : (
        <div className="space-y-4">
          {swaps.map((swap) => {
            const isRequester = swap.requester_id === user?.id;
            const partnerName = isRequester ? swap.owner_name : swap.requester_name;
            const partnerImage = isRequester ? swap.owner_image : swap.requester_image;
            const partnerRating = isRequester ? swap.owner_rating : swap.requester_rating;

            return (
              <div key={swap.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={partnerImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={partnerName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Swap Partner: {partnerName}</span>
                        <span className="text-amber-700 text-xs font-semibold">⭐ {partnerRating?.toFixed(1) || '5.0'}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {isRequester ? 'You sent this request' : 'You received this request'} • {new Date(swap.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border w-fit ${getStatusBadge(swap.status)}`}>
                    Status: {swap.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Items Exchange Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  
                  {/* Offered Books */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-2">
                      Books Offered:
                    </span>
                    <div className="space-y-2">
                      {swap.offeredItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                          <img src={item.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=100'} alt={item.title} className="w-8 h-10 object-cover rounded" />
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</h5>
                            <p className="text-slate-500 text-[10px]">by {item.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requested Books */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-2">
                      Books Requested:
                    </span>
                    <div className="space-y-2">
                      {swap.requestedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                          <img src={item.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=100'} alt={item.title} className="w-8 h-10 object-cover rounded" />
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</h5>
                            <p className="text-slate-500 text-[10px]">by {item.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Meetup Details snippet if arranged */}
                {swap.meetup && (
                  <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong>Meetup:</strong> {swap.meetup.location_name} on <strong>{swap.meetup.date}</strong> at {swap.meetup.time}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMeetupSwap(swap)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      View / Edit Meetup →
                    </button>
                  </div>
                )}

                {/* Action Guide Banner for Pending requests */}
                {swap.status === 'PENDING' && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span>
                      {isRequester 
                        ? `⏳ Waiting for ${partnerName} to accept your request. You can open Chat to message them!` 
                        : `👇 Action Required: Accept this request to swap, or open Chat to discuss details with ${partnerName}!`}
                    </span>
                  </div>
                )}

                {/* State Machine Control Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  
                  {/* PENDING State Actions */}
                  {swap.status === 'PENDING' && !isRequester && (
                    <>
                      <button
                        onClick={() => handleAccept(swap.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Swap Request</span>
                      </button>
                      <button
                        onClick={() => setSelectedChatSwap(swap)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span>Chat & Discuss</span>
                      </button>
                      <button
                        onClick={() => handleReject(swap.id)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {/* Chat Button (Available for all active states: PENDING, ACCEPTED, MEETUP, COMPLETED) */}
                  {(swap.status !== 'PENDING' || isRequester) && ['PENDING', 'ACCEPTED', 'MEETUP_PENDING', 'MEETUP_CONFIRMED', 'EXCHANGE_COMPLETED'].includes(swap.status) && (
                    <button
                      onClick={() => setSelectedChatSwap(swap)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>Open Partner Chat</span>
                    </button>
                  )}

                  {/* Meetup Arrange Button */}
                  {['PENDING', 'ACCEPTED', 'MEETUP_PENDING', 'MEETUP_CONFIRMED'].includes(swap.status) && (
                    <button
                      onClick={() => setSelectedMeetupSwap(swap)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{swap.meetup ? 'Manage Meetup Location' : 'Arrange Public Meetup'}</span>
                    </button>
                  )}

                  {/* Complete Exchange Button */}
                  {['MEETUP_CONFIRMED', 'MEETUP_PENDING', 'ACCEPTED'].includes(swap.status) && (
                    <button
                      onClick={() => handleCompleteExchange(swap.id)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Books Exchanged</span>
                    </button>
                  )}

                  {/* Rating Button */}
                  {['EXCHANGE_COMPLETED'].includes(swap.status) && (
                    <button
                      onClick={() => setSelectedRatingSwap(swap)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>Rate Swap Partner</span>
                    </button>
                  )}

                  {/* Cancel Button */}
                  {['PENDING', 'ACCEPTED', 'MEETUP_PENDING'].includes(swap.status) && (
                    <button
                      onClick={() => handleCancel(swap.id)}
                      className="px-3 py-2 text-slate-400 hover:text-rose-600 text-xs font-semibold"
                    >
                      Cancel Swap
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ChatModal
        swap={selectedChatSwap}
        isOpen={!!selectedChatSwap}
        onClose={() => setSelectedChatSwap(null)}
        onOpenMeetup={() => {
          setSelectedMeetupSwap(selectedChatSwap);
          setSelectedChatSwap(null);
        }}
      />

      <MeetupModal
        swap={selectedMeetupSwap}
        isOpen={!!selectedMeetupSwap}
        onClose={() => setSelectedMeetupSwap(null)}
        onUpdated={loadSwaps}
      />

      <RatingModal
        swap={selectedRatingSwap}
        isOpen={!!selectedRatingSwap}
        onClose={() => setSelectedRatingSwap(null)}
        onSubmitted={loadSwaps}
      />

    </div>
  );
};
