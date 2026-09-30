import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SwapRequest } from '../types';
import { api } from '../services/api';

interface MeetupModalProps {
  swap: SwapRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const MeetupModal: React.FC<MeetupModalProps> = ({
  swap,
  isOpen,
  onClose,
  onUpdated
}) => {
  if (!isOpen || !swap) return null;

  const existing = swap.meetup;
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(existing?.time || '17:00');
  const [locationName, setLocationName] = useState(existing?.location_name || 'Central Library Coffee Lounge');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [loading, setLoading] = useState(false);

  const publicVenues = [
    'Central Library Lounge',
    'Starbucks Indiranagar',
    'Church Street Bookshop',
    'Metro Station Entrance',
    'Forum Mall Food Court'
  ];

  const handleProposeOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.arrangeMeetup(swap.id, {
        date,
        time,
        location_name: locationName,
        notes
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to set meetup.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMeetup = async () => {
    setLoading(true);
    try {
      await api.confirmMeetup(swap.id);
      onUpdated();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to confirm meetup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-serif font-bold text-lg">Arrange Public Meetup</h3>
              <p className="text-emerald-100 text-xs">Coordinate a safe public place to exchange books</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Safety Message */}
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Exchange Safety Tip:</strong> Always meet in public places like cafes, libraries, or metro stations. Avoid sharing your home address.
            </p>
          </div>

          {/* Dual Confirmation Banner if existing */}
          {existing && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
              <h5 className="font-bold text-xs text-slate-800">Mutual Confirmation Status:</h5>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700">
                  {existing.user_a_confirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  {swap.requester_name}: {existing.user_a_confirmed ? 'Confirmed ✓' : 'Waiting...'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  {existing.user_b_confirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  {swap.owner_name}: {existing.user_b_confirmed ? 'Confirmed ✓' : 'Waiting...'}
                </span>
              </div>

              {((!existing.user_a_confirmed && swap.requester_id === swap.requester_id) || (!existing.user_b_confirmed)) && (
                <button
                  type="button"
                  onClick={handleConfirmMeetup}
                  disabled={loading}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                >
                  ✓ Confirm Proposed Meetup
                </button>
              )}
            </div>
          )}

          {/* Meetup Form */}
          <form onSubmit={handleProposeOrUpdate} className="space-y-4">
            
            {/* Suggested Venues */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Suggested Public Location</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {publicVenues.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLocationName(v)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                      locationName === v
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Custom public location name..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I will be wearing a blue jacket."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              {loading ? 'Saving Meetup...' : 'Propose / Update Meetup Details'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
