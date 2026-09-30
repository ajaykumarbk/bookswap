import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { api } from '../services/api';

interface ReportModalProps {
  reportedUserId?: string;
  reportedBookId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserId,
  reportedBookId,
  isOpen,
  onClose
}) => {
  const [reason, setReason] = useState('Fake Book or Inaccurate Info');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reasonsList = [
    'Fake Book or Inaccurate Info',
    'Offensive Content',
    'Scam or Fraudulent Activity',
    'Harassment or Inappropriate Behavior',
    'No-Show for Meetup Exchange',
    'Damaged or Defective Book',
    'Suspicious Account'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReport({
        reported_user_id: reportedUserId,
        reported_book_id: reportedBookId,
        reason,
        description
      });
      setSubmitted(true);
    } catch (e: any) {
      alert(e.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-200" />
            <div>
              <h3 className="font-serif font-bold text-lg">Report Content or User</h3>
              <p className="text-rose-100 text-xs">Help keep the BookSwap community safe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Report Submitted</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Our moderation team will review this report within 24 hours and take appropriate action.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                {reasonsList.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened in detail..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
