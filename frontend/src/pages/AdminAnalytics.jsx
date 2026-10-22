import React, { useState, useEffect } from 'react';
import { adminService, parkingService } from '../services/api';
import {
  DollarSign,
  TrendingUp,
  Car,
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  Layers,
} from 'lucide-react';

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddLotOpen, setIsAddLotOpen] = useState(false);
  const [newLotName, setNewLotName] = useState('');
  const [newLotLocation, setNewLotLocation] = useState('');
  const [newLotSlots, setNewLotSlots] = useState(20);
  const [newLotRate, setNewLotRate] = useState(25);
  const [addingLot, setAddingLot] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleCreateLot = async (e) => {
    e.preventDefault();
    setAddingLot(true);
    try {
      await parkingService.createLot({
        lot_name: newLotName.trim(),
        location: newLotLocation.trim(),
        total_slots: parseInt(newLotSlots),
        hourly_rate: parseFloat(newLotRate),
        is_active: true,
      });

      setFeedbackMsg(`Parking lot '${newLotName}' and its slots created successfully!`);
      setIsAddLotOpen(false);
      setNewLotName('');
      setNewLotLocation('');
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create parking lot.');
    } finally {
      setAddingLot(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await adminService.seedSampleData();
      fetchAnalytics();
      setFeedbackMsg('Sample demo parking facilities & slots populated successfully!');
    } catch (err) {
      console.error('Seeding error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Admin & Analytics Control</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time lot occupancy gauges, capacity alerts, and transaction records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => setIsAddLotOpen(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-300 transition"
          >
            <Plus className="w-4 h-4" />
            Add Parking Facility
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-orange-100 border border-orange-300 text-orange-900 text-xs font-semibold flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-orange-700 hover:text-orange-950 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase">
            <span>Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            ${analytics?.total_revenue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-[11px] text-stone-400">All successful prepayments</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase">
            <span>Total Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {analytics?.total_bookings || 0}
          </div>
          <p className="text-[11px] text-stone-400">Lifetime reservations handled</p>
        </div>

        {/* Active Vehicles Inside */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase">
            <span>Active Reservations</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {analytics?.active_reservations || 0}
          </div>
          <p className="text-[11px] text-stone-400">Currently booked or parked</p>
        </div>

        {/* Overall System Occupancy Gauge */}
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase">
            <span>System Occupancy</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {analytics?.overall_occupancy_rate || 0}%
          </div>
          <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (analytics?.overall_occupancy_rate || 0) >= 85 ? 'bg-rose-500' : 'bg-orange-500'
              }`}
              style={{ width: `${analytics?.overall_occupancy_rate || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Real-Time Facility Occupancy Gauges */}
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">Facility Capacity & Live Occupancy Gauges</h2>
            <p className="text-xs text-stone-500">
              Gauges alert when occupancy reaches or exceeds 85% full capacity.
            </p>
          </div>
          {(!analytics?.lot_metrics || analytics.lot_metrics.length === 0) && (
            <button
              onClick={handleSeedDemo}
              className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold rounded-lg transition"
            >
              Seed Sample Facilities
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {analytics?.lot_metrics?.map((lot) => {
            const isCritical = lot.occupancy_rate >= 85;
            return (
              <div
                key={lot.lot_id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-300'
                    : 'bg-orange-50/30 border-orange-200/80 hover:bg-orange-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-stone-900">{lot.lot_name}</h3>
                  {isCritical && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      &gt;85% Full Alert
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-2xl font-extrabold text-stone-900">
                      {lot.occupancy_rate}%
                    </span>
                    <span className="text-xs text-stone-500 ml-1">Occupied</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    {lot.occupied_slots} / {lot.total_slots} Slots
                  </span>
                </div>

                {/* Progress Gauge */}
                <div className="w-full h-2.5 bg-white border border-orange-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCritical ? 'bg-rose-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${lot.occupancy_rate}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Peak Hours & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Peak Hours Distribution */}
        <div className="lg:col-span-6 bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-stone-900 pb-2 border-b border-orange-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            24-Hour Peak Booking Traffic
          </h2>
          <p className="text-xs text-stone-500">
            Booking demand trends across morning rush, afternoon, and evening hours.
          </p>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2 items-end h-32">
            {analytics?.peak_hours?.map((stat) => {
              const maxCount = Math.max(...analytics.peak_hours.map((s) => s.booking_count), 1);
              const heightPercent = Math.max(12, (stat.booking_count / maxCount) * 100);

              return (
                <div key={stat.hour} className="flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-orange-200 group-hover:bg-orange-500 rounded-t transition-all"
                    style={{ height: `${heightPercent}%` }}
                    title={`Hour ${stat.hour}:00 - ${stat.booking_count} Bookings`}
                  ></div>
                  <span className="text-[9px] font-semibold text-stone-400">{stat.hour}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="lg:col-span-6 bg-white border border-orange-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-stone-900 pb-2 border-b border-orange-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            Recent Financial Transactions
          </h2>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {!analytics?.recent_transactions || analytics.recent_transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No recent transactions recorded yet.
              </div>
            ) : (
              analytics.recent_transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-3 bg-orange-50/30 rounded-xl border border-orange-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900">
                      {txn.driver_name} &bull; {txn.vehicle_number}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">{txn.transaction_id}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-orange-600 text-sm">
                      +${txn.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">{txn.payment_method}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Facility */}
      {isAddLotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-orange-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-orange-100">
              <h3 className="text-base font-bold text-stone-900">Add New Parking Facility</h3>
              <button
                onClick={() => setIsAddLotOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Hub Garage"
                  value={newLotName}
                  onChange={(e) => setNewLotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Location Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5th Avenue, Gate 3"
                  value={newLotLocation}
                  onChange={(e) => setNewLotLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Total Slots
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newLotSlots}
                    onChange={(e) => setNewLotSlots(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    value={newLotRate}
                    onChange={(e) => setNewLotRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLotOpen(false)}
                  className="w-1/2 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold rounded-xl border border-orange-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLot}
                  className="w-1/2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm shadow-orange-300 transition"
                >
                  {addingLot ? 'Creating...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
