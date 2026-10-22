import React, { useState } from 'react';
import { verifyService } from '../services/api';
import { QrCode, Search, CheckCircle2, XCircle, ArrowRightLeft, Car, ShieldCheck, Clock } from 'lucide-react';

export const AttendantScanner = () => {
  const [passHash, setPassHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!passHash.trim()) return;

    setLoading(true);
    setScanResult(null);

    try {
      const res = await verifyService.scanPass(passHash.trim());
      setScanResult(res.data);

      // Add to recent scans
      setRecentScans((prev) => [
        {
          id: Date.now(),
          hash: passHash.trim(),
          result: res.data,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setScanResult({
        valid: false,
        message: err.response?.data?.detail || 'Verification request failed. Server error.',
        action_taken: 'ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CHECK_IN':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
            Check-In: Entry Verified
          </span>
        );
      case 'CHECK_OUT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            Check-Out: Slot Released
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {action || 'Invalid Pass'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Gate Attendant Scanner</h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Scan driver QR passes or enter pass hash codes to authorize gate entry and exit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Scanner & Verification Console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                Pass Verification Input
              </h2>
              <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Gate 1 Active
              </span>
            </div>

            {/* Input Form */}
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Scan QR / Paste Pass Hash
                </label>
                <div className="relative">
                  <QrCode className="w-5 h-5 text-orange-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter pass hash or scan camera barcode..."
                    value={passHash}
                    onChange={(e) => setPassHash(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm shadow-orange-300 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verify & Trigger Gate Action
                  </>
                )}
              </button>
            </form>

            {/* Verification Result Card */}
            {scanResult && (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  scanResult.valid
                    ? 'bg-orange-50/70 border-orange-300 ring-2 ring-orange-200'
                    : 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3
                      className={`text-base font-bold ${
                        scanResult.valid ? 'text-orange-950' : 'text-rose-900'
                      }`}
                    >
                      {scanResult.message}
                    </h3>
                  </div>
                  {getActionBadge(scanResult.action_taken)}
                </div>

                {scanResult.valid && (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-orange-200/60">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Driver Name</span>
                      <span className="font-bold text-stone-900">{scanResult.driver_name}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Vehicle License</span>
                      <span className="font-bold text-stone-900">
                        {scanResult.reservation?.vehicle_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Allotted Slot</span>
                      <span className="font-bold text-orange-600">{scanResult.slot_number}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Facility</span>
                      <span className="font-bold text-stone-900">{scanResult.lot_name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Gate Activity */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-orange-100 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider pb-2 border-b border-orange-100 flex items-center justify-between">
              <span>Recent Gate Scans</span>
              <span className="text-xs text-stone-400 font-normal">Session Log</span>
            </h2>

            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No scans recorded yet in this session.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900">
                        {scan.result.slot_number ? `Slot ${scan.result.slot_number}` : 'Pass Scan'}
                        {scan.result.driver_name && ` • ${scan.result.driver_name}`}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono truncate max-w-[180px]">
                        {scan.hash}
                      </div>
                    </div>
                    <div className="text-right">
                      {getActionBadge(scan.result.action_taken)}
                      <span className="text-[10px] text-stone-400 mt-0.5 block">{scan.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
