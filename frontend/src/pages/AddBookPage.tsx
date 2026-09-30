import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Sparkles, Upload, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export const AddBookPage: React.FC = () => {
  const navigate = useNavigate();

  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('1st Edition');
  const [publicationYear, setPublicationYear] = useState<number>(2023);
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Self Help');
  const [language, setLanguage] = useState('English');
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable' | 'Poor'>('Very Good');
  const [coverImage, setCoverImage] = useState('');
  const [availability, setAvailability] = useState('Available');

  const [fetchingIsbn, setFetchingIsbn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genresList = ['Self Help', 'Technology', 'Fiction', 'Business', 'Science', 'Psychology', 'Fantasy', 'Biography', 'History'];
  const conditionsList = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'Poor'];

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) {
      setError('Please enter an ISBN number first (e.g. 9780735211292).');
      return;
    }

    setFetchingIsbn(true);
    setError(null);

    try {
      const meta = await api.lookupISBN(isbn.trim());
      if (meta) {
        setTitle(meta.title || title);
        setAuthor(meta.author || author);
        if (meta.publisher) setPublisher(meta.publisher);
        if (meta.publication_year) setPublicationYear(meta.publication_year);
        if (meta.cover_image) setCoverImage(meta.cover_image);
        if (meta.description) setDescription(meta.description);
        if (meta.genre && genresList.includes(meta.genre)) setGenre(meta.genre);
      }
    } catch (e) {
      setError('Metadata not found for this ISBN. You can enter details manually below.');
    } finally {
      setFetchingIsbn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      setError('Book title and author are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createBook({
        isbn,
        title,
        author,
        publisher,
        edition,
        publication_year: publicationYear,
        description,
        genre,
        language,
        condition,
        cover_image: coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
        availability
      });

      navigate('/my-books');
    } catch (err: any) {
      setError(err.message || 'Failed to list book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900">+ Add Book to Your Library</h1>
          <p className="text-slate-500 text-xs mt-1">
            List a physical book sitting on your shelf to make it available for local neighborhood swapping.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* ISBN Lookup Box */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2">
          <label className="block text-xs font-bold text-amber-900 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Automatic ISBN Lookup</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 9780735211292"
              className="flex-1 px-3.5 py-2 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
            />
            <button
              type="button"
              onClick={handleIsbnLookup}
              disabled={fetchingIsbn}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Search className={`w-3.5 h-3.5 ${fetchingIsbn ? 'animate-spin' : ''}`} />
              <span>{fetchingIsbn ? 'Fetching...' : 'Fetch Info'}</span>
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            Enter the 10 or 13-digit ISBN on the back cover to automatically fill title, author, and book cover.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Atomic Habits"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Author Name *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="James Clear"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Genre / Category *</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {genresList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {conditionsList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Publisher</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Penguin Books"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Edition</label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="1st Edition"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Year</label>
              <input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(parseInt(e.target.value) || 2023)}
                placeholder="2020"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Book Cover Image URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes on Condition</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Good condition, slight crease on page 42..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
          >
            {loading ? 'Publishing Book...' : 'Publish Book to Neighborhood Library'}
          </button>
        </form>

      </div>
    </div>
  );
};
