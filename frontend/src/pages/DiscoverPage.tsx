import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Map, LayoutGrid, MapPin, SlidersHorizontal } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { MapView } from '../components/MapView';
import { Book } from '../types';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';

interface DiscoverPageProps {
  onOpenSwapModal: (book: Book) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onOpenSwapModal }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { location } = useLocation();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [condition, setCondition] = useState('All');
  const [radius, setRadius] = useState<number>(location.radiusKm);
  const [sort, setSort] = useState('Nearest');

  const genresList = ['All', 'Self Help', 'Technology', 'Fiction', 'Business', 'Science', 'Psychology', 'Fantasy'];
  const languagesList = ['All', 'English', 'Hindi', 'Kannada', 'Spanish'];
  const conditionsList = ['All', 'New', 'Like New', 'Very Good', 'Good', 'Acceptable'];
  const sortOptions = ['Nearest', 'Recently Added', 'Most Requested', 'Best Rated Owner'];

  useEffect(() => {
    fetchBooks();
  }, [search, genre, language, condition, radius, sort]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getBooks({
        search,
        genre,
        language,
        condition,
        radius,
        lat: location.lat,
        lng: location.lng,
        sort
      });
      setBooks(res.books || []);
    } catch (e) {
      console.error('Failed fetching discover books:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900">Discover Books Nearby</h1>
            <p className="text-slate-500 text-xs mt-0.5">Explore physical books available for swap in {location.city}</p>
          </div>

          {/* Grid vs Map Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'map' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book title, author name, ISBN number, or subject..."
            className="w-full pl-10 pr-24 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            Search
          </button>
        </form>

        {/* Filters & Sort Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          
          {/* Genre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              {genresList.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              {languagesList.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              {conditionsList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Distance Radius */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Radius</label>
            <select
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
              <option value={100}>Within 100 km</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-amber-50 border border-amber-200 rounded-xl font-bold text-amber-900"
            >
              {sortOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Main Results View */}
      {viewMode === 'map' ? (
        <MapView
          books={books}
          userLat={location.lat}
          userLng={location.lng}
          radiusKm={radius}
          height="550px"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Found <strong>{books.length}</strong> available books within {radius} km</span>
          </div>

          {books.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              No matching books found. Try adjusting your search keywords or increasing the distance radius!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOpenSwapModal={onOpenSwapModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
