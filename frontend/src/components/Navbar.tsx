import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { BookOpen, MapPin, Search, Bell, MessageSquare, RefreshCw, PlusCircle, User as UserIcon, ShieldAlert, LogOut, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { location, openLocationModal, setRadius } = useLocation();
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadChats();
    }
  }, [user, routeLocation.pathname]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadNotifs(res.unreadCount || 0);
    } catch (e) {}
  };

  const loadUnreadChats = async () => {
    try {
      const res = await api.getUserChats();
      const count = (res.chats || []).reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
      setUnreadMessages(count);
    } catch (e) {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadNotifs(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">
                Book<span className="text-amber-600">Swap</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-1">
                Neighborhood Exchange
              </span>
            </div>
          </Link>

          {/* Location Badge */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={openLocationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200/80 text-xs font-medium transition-all shadow-xs"
              title="Change your search radius & city"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="font-semibold">{location.city}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{location.radiusKm} km</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search title, author, genre, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/discover"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                routeLocation.pathname === '/discover'
                  ? 'bg-amber-50 text-amber-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Discover
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-books"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    routeLocation.pathname === '/my-books'
                      ? 'bg-amber-50 text-amber-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  My Books
                </Link>

                <Link
                  to="/swaps"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    routeLocation.pathname === '/swaps'
                      ? 'bg-amber-50 text-amber-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Swaps</span>
                </Link>

                <Link
                  to="/messages"
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                  title="Messages"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unreadNotifs}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                        {unreadNotifs > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-amber-700 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400">No notifications yet</div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setShowNotifMenu(false);
                                if (n.type.includes('SWAP') || n.type === 'MEETUP_CONFIRMED' || n.type === 'EXCHANGE_COMPLETED') {
                                  navigate('/swaps');
                                } else if (n.type === 'MESSAGE') {
                                  navigate('/messages');
                                } else if (n.type === 'WISHLIST_MATCH') {
                                  navigate(`/book/${n.reference_id}`);
                                }
                              }}
                              className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.is_read ? 'bg-amber-50/40 font-medium' : ''
                              }`}
                            >
                              <div className="text-slate-900 font-semibold">{n.title}</div>
                              <div className="text-slate-600 text-[11px] mt-0.5">{n.message}</div>
                              <div className="text-slate-400 text-[9px] mt-1">
                                {new Date(n.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Book CTA */}
                <Link
                  to="/add-book"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-xs shadow-sm shadow-amber-600/20 hover:scale-102 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Book</span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-full border border-slate-200 hover:border-amber-400 transition-all focus:outline-hidden"
                  >
                    <img
                      src={user.profile_image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                        <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                        <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          ⭐ {user.rating?.toFixed(1) || '5.0'} • {user.completed_swaps} Swaps
                        </div>
                      </div>

                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>My Profile & Wishlist</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-purple-700 hover:bg-purple-50 font-semibold transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-purple-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm shadow-amber-600/20 transition-all"
                >
                  Join BookSwap
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
