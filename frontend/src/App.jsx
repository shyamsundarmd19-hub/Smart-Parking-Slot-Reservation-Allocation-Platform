import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { MyPasses } from './pages/MyPasses';
import { AttendantScanner } from './pages/AttendantScanner';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const MainContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Handle hash change for natural browser navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['dashboard', 'passes', 'scanner', 'admin', 'login', 'register'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSetView = (view) => {
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <Login setView={handleSetView} />;
      case 'register':
        return <Register setView={handleSetView} />;
      case 'passes':
        return isAuthenticated ? (
          <MyPasses setView={handleSetView} />
        ) : (
          <Login setView={handleSetView} />
        );
      case 'scanner':
        return isAuthenticated && (user?.role === 'attendant' || user?.role === 'admin') ? (
          <AttendantScanner />
        ) : (
          <Login setView={handleSetView} />
        );
      case 'admin':
        return isAuthenticated && user?.role === 'admin' ? (
          <AdminAnalytics />
        ) : (
          <Login setView={handleSetView} />
        );
      case 'dashboard':
      default:
        return <Dashboard setView={handleSetView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50/50 text-stone-800">
      <Navbar currentView={currentView} setView={handleSetView} />

      <main className="flex-1">{renderCurrentView()}</main>

      {/* Cloud-Architect Footer */}
      <footer className="bg-white border-t border-orange-100 py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-stone-700">
            ParkCloud &bull; Cloud Smart Parking Slot Reservation System
          </p>
          <p className="text-[11px] text-stone-400">
            Built for AWS Free Tier Architecture &bull; React SPA &bull; FastAPI &bull; PostgreSQL &bull; AWS S3 & SES
          </p>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
