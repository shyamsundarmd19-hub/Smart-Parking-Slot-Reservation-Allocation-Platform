import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, QrCode, LayoutDashboard, Ticket, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar = ({ currentView, setView }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setView('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-300">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-orange-600">ParkCloud</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Cloud Free Tier
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium hidden sm:block">Smart Slot Allotment</p>
            </div>
          </div>

          {/* Navigation Items (Role-aware) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                currentView === 'dashboard'
                  ? 'bg-orange-100 text-orange-900 border border-orange-200'
                  : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              <Car className="w-4 h-4" />
              Find Parking
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setView('passes')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  currentView === 'passes'
                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                    : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <Ticket className="w-4 h-4" />
                My Passes
              </button>
            )}

            {/* Attendant & Admin Gate Scanner */}
            {isAuthenticated && (user?.role === 'attendant' || user?.role === 'admin') && (
              <button
                onClick={() => setView('scanner')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  currentView === 'scanner'
                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                    : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Gate Scanner
              </button>
            )}

            {/* Admin Analytics */}
            {isAuthenticated && user?.role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  currentView === 'admin'
                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                    : 'text-stone-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Analytics & Lots
              </button>
            )}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-900">{user.name}</span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    <span className="text-[11px] capitalize font-medium text-orange-700">{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('login')}
                  className="px-4 py-2 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView('register')}
                  className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm shadow-orange-200 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
