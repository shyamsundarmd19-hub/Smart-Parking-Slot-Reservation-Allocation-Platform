import React, { useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { PassCard } from '../components/PassCard';
import { Ticket, RefreshCw, Car, AlertCircle } from 'lucide-react';

export const MyPasses = ({ setView }) => {
  const [reservations, setReservations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPasses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reservationService.getMyReservations();
      setReservations(res.data);
    } catch (err) {
      setError('Could not load your parking passes. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleCancelPass = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? The slot will be released.')) {
      return;
    }
    try {
      await reservationService.cancel(id);
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel pass.');
    }
  };

  const filteredPasses = reservations.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">My Parking Passes</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Display these digital QR passes at gate scanners upon entry and exit.
          </p>
        </div>

        <button
          onClick={fetchPasses}
          className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Passes
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Passes' },
          { id: 'booked', label: 'Active & Booked' },
          { id: 'checked_in', label: 'Inside Lot' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === tab.id
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                : 'bg-white text-stone-600 border border-orange-100 hover:bg-orange-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Passes Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading your passes...</div>
      ) : filteredPasses.length === 0 ? (
        <div className="bg-white border border-orange-100 rounded-2xl p-12 text-center text-stone-500 space-y-3">
          <Ticket className="w-12 h-12 text-orange-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Parking Passes Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You don't have any parking passes in this category. Find an available slot and reserve your parking spot.
          </p>
          <button
            onClick={() => setView('dashboard')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Find Parking Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasses.map((pass) => (
            <PassCard key={pass.id} reservation={pass} onCancel={handleCancelPass} />
          ))}
        </div>
      )}
    </div>
  );
};
