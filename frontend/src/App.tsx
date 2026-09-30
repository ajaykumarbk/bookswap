import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LocationPickerModal } from './components/LocationPickerModal';
import { AuthModal } from './components/AuthModal';
import { SwapRequestModal } from './components/SwapRequestModal';

import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { AddBookPage } from './pages/AddBookPage';
import { MyBooksPage } from './pages/MyBooksPage';
import { SwapsPage } from './pages/SwapsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Book } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [selectedSwapBook, setSelectedSwapBook] = useState<Book | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenSwapModal = (book: Book) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setSelectedSwapBook(book);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-serif text-slate-400">
        Loading BookSwap Platform...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      <Navbar onOpenAuth={handleOpenAuth} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={user ? <HomePage onOpenSwapModal={handleOpenSwapModal} /> : <LandingPage onOpenAuth={handleOpenAuth} onOpenSwapModal={handleOpenSwapModal} />}
          />
          <Route path="/discover" element={<DiscoverPage onOpenSwapModal={handleOpenSwapModal} />} />
          <Route path="/book/:id" element={<BookDetailPage onOpenSwapModal={handleOpenSwapModal} />} />
          
          <Route
            path="/add-book"
            element={user ? <AddBookPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/my-books"
            element={user ? <MyBooksPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/swaps"
            element={user ? <SwapsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/messages"
            element={user ? <SwapsPage /> : <Navigate to="/" replace />}
          />
          <Route path="/profile/:id" element={<UserProfilePage onOpenSwapModal={handleOpenSwapModal} />} />
          <Route
            path="/admin"
            element={user && user.role === 'admin' ? <AdminDashboardPage /> : <Navigate to="/" replace />}
          />
        </Routes>
      </main>

      <Footer />

      {/* Global Modals */}
      <LocationPickerModal />
      
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      <SwapRequestModal
        targetBook={selectedSwapBook}
        isOpen={!!selectedSwapBook}
        onClose={() => setSelectedSwapBook(null)}
      />
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
