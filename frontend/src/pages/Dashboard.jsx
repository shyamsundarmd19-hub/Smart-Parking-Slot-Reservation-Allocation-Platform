import React, { useState, useEffect } from 'react';
import { parkingService, adminService } from '../services/api';
import { SlotGrid } from '../components/SlotGrid';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';
import { MapPin, DollarSign, Car, Zap, Bike, Search, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';

export const Dashboard = ({ setView }) => {
  const { isAuthenticated } = useAuth();
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchLots = async () => {
    setLoading(true);
    try {
      const res = await parkingService.getLots();
      setLots(res.data);
      if (res.data.length > 0 && !selectedLot) {
        setSelectedLot(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching parking lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (lotId) => {
    try {
      const res = await parkingService.getSlotGrid(lotId);
      setSlots(res.data.slots);
    } catch (err) {
      console.error('Error loading slots for lot:', err);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      fetchSlots(selectedLot.id);
      setSelectedSlot(null);
    }
  }, [selectedLot]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await adminService.seedSampleData();
      await fetchLots();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (!isAuthenticated) {
      setView('login');
      return;
    }
    setSelectedSlot(slot);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (reservation) => {
    // Refresh slots
    if (selectedLot) {
      fetchSlots(selectedLot.id);
    }
    fetchLots();
  };

  // Filter slots
  const filteredSlots = slots.filter((s) => {
    if (filterType === 'all') return true;
    return s.slot_type.toLowerCase() === filterType.toLowerCase();
  });

  // Filter lots by search query
  const filteredLots = lots.filter(
    (l) =>
      l.lot_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-orange-100/80 via-orange-50 to-amber-50/70 border border-orange-200/70 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Live Cloud Parking Allotment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Reserve Your Ideal Parking Slot In Seconds
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Real-time occupancy tracking, instant encrypted QR parking passes via AWS S3, and automated ticket dispatch.
          </p>

          {lots.length === 0 && !loading && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="mt-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-orange-300 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              Seed Demo Parking Facilities
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lots List & Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Available Locations</h2>
            <button
              onClick={fetchLots}
              title="Refresh Lots"
              className="p-1.5 rounded-lg text-stone-500 hover:text-orange-600 hover:bg-orange-100/60 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by lot name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-orange-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
            />
          </div>

          {/* Lots Cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">Loading parking facilities...</div>
            ) : filteredLots.length === 0 ? (
              <div className="bg-white border border-orange-100 rounded-xl p-6 text-center text-xs text-stone-500">
                No matching parking lots found.
              </div>
            ) : (
              filteredLots.map((lot) => {
                const isSelected = selectedLot?.id === lot.id;
                const percentAvailable = lot.total_slots > 0 ? (lot.available_slots / lot.total_slots) * 100 : 0;
                const isFull = lot.available_slots === 0;

                return (
                  <div
                    key={lot.id}
                    onClick={() => setSelectedLot(lot)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-100/80 border-orange-400 ring-2 ring-orange-200 shadow-sm'
                        : 'bg-white border-orange-100 hover:border-orange-300 hover:bg-orange-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-stone-900">{lot.lot_name}</h3>
                      <span className="text-xs font-bold text-orange-600 shrink-0">
                        ${lot.hourly_rate.toFixed(2)}/hr
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="truncate">{lot.location}</span>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-stone-500">Available:</span>
                        <span className={isFull ? 'text-rose-600 font-bold' : 'text-orange-700 font-bold'}>
                          {lot.available_slots} / {lot.total_slots} Slots
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFull ? 'bg-rose-400' : 'bg-orange-500'
                          }`}
                          style={{ width: `${percentAvailable}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Slot Grid & Filters */}
        <div className="lg:col-span-8 space-y-4">
          {selectedLot ? (
            <>
              {/* Facility Header & Type Filter Pills */}
              <div className="bg-white border border-orange-100 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">{selectedLot.lot_name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      {selectedLot.available_slots} Slots Free
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{selectedLot.location}</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-orange-50/70 p-1 rounded-xl border border-orange-100">
                  {[
                    { id: 'all', label: 'All Slots' },
                    { id: 'car', label: '🚗 Car' },
                    { id: 'bike', label: '🏍️ Bike' },
                    { id: 'ev', label: '⚡ EV Charging' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        filterType === tab.id
                          ? 'bg-white text-orange-800 shadow-sm border border-orange-200'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Grid Component */}
              <SlotGrid
                slots={filteredSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotClick}
                lotName={selectedLot.lot_name}
              />
            </>
          ) : (
            <div className="bg-white border border-orange-100 rounded-xl p-12 text-center text-stone-500">
              <Car className="w-12 h-12 text-orange-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800 mb-1">Select a Parking Facility</h3>
              <p className="text-xs text-stone-500">Choose a parking lot from the left to view and reserve available slots.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && selectedSlot && selectedLot && (
        <BookingModal
          slot={selectedSlot}
          lot={selectedLot}
          onClose={() => setIsBookingOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
