import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MapPin, Calendar, ShieldCheck, Heart, BookOpen, ShieldAlert, Check } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Book, Review, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserProfilePageProps {
  onOpenSwapModal: (book: Book) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onOpenSwapModal }) => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile state if current user
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getPublicProfile(id!);
      setProfileUser(res.user);
      setDistanceKm(res.distanceKm);
      setAvailableBooks(res.availableBooks || []);
      setReviews(res.reviews || []);
      if (res.user) {
        setBio(res.user.bio || '');
        setPhone(res.user.phone || '');
      }
    } catch (e) {
      console.error('Failed fetching user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({ bio, phone });
      setProfileUser(res.user);
      updateUser(res.user);
      setIsEditing(false);
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    }
  };

  const handleBlockUser = async () => {
    if (!profileUser || !window.confirm(`Are you sure you want to block ${profileUser.name}?`)) return;
    try {
      await api.blockUser(profileUser.id);
      alert(`${profileUser.name} has been blocked.`);
    } catch (e) {}
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading user profile...</div>;
  if (!profileUser) return <div className="p-12 text-center text-slate-400">User profile not found.</div>;

  const isSelf = currentUser?.id === profileUser.id;

  return (
    <div className="space-y-8">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img
              src={profileUser.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={profileUser.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif font-bold text-2xl text-slate-900">{profileUser.name}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Email Verified</span>
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {profileUser.city}, {profileUser.country}</span>
                {distanceKm !== null && <span className="font-semibold text-amber-700">• ~{distanceKm} km away</span>}
                <span>• Joined {new Date(profileUser.created_at).getFullYear()}</span>
              </div>

              {/* Reputation Stats Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{profileUser.rating ? profileUser.rating.toFixed(1) : '5.0'} / 5.0</span>
                </div>

                <div className="bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold text-slate-800">
                  {profileUser.completed_swaps || 0} Swaps Completed
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full sm:w-auto flex sm:flex-col gap-2">
            {isSelf ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            ) : (
              <button
                onClick={handleBlockUser}
                className="w-full px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold"
              >
                Block User
              </button>
            )}
          </div>
        </div>

        {/* Bio Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white font-semibold text-xs rounded-xl">
              Save Changes
            </button>
          </form>
        ) : (
          profileUser.bio && (
            <p className="text-slate-600 text-xs mt-4 pt-4 border-t border-slate-100 leading-relaxed">
              "{profileUser.bio}"
            </p>
          )
        )}
      </div>

      {/* Available Books Section */}
      <section className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-900">
          Available Books ({availableBooks.length})
        </h2>
        {availableBooks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            This user currently has no available books for swap.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableBooks.map((book) => (
              <BookCard key={book.id} book={book} onOpenSwapModal={onOpenSwapModal} />
            ))}
          </div>
        )}
      </section>

      {/* Community Reviews Section */}
      <section className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-slate-900">
          Swap Partner Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No reviews yet. Completed swaps will display feedback here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={r.reviewer_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={r.reviewer_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="font-bold text-slate-900 text-xs">{r.reviewer_name}</span>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    <span>{r.rating}.0</span>
                  </div>
                </div>
                {r.comment && <p className="text-slate-600 text-xs italic">"{r.comment}"</p>}
                <span className="text-[10px] text-slate-400 block">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
