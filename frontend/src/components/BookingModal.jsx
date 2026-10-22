import React, { useState } from 'react';
import { reservationService } from '../services/api';
import { X, Clock, Car, CreditCard, ShieldCheck, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export const BookingModal = ({ slot, lot, onClose, onBookingSuccess }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('UPI / Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookedReservation, setBookedReservation] = useState(null);

  const hourlyRate = lot?.hourly_rate || 20;
  const totalAmount = (durationHours * hourlyRate).toFixed(2);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Please provide your vehicle license number.');
      return;
    }

    setLoading(true);
    setError('');

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    try {
      const res = await reservationService.create({
        slot_id: slot.id,
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        payment_method: paymentMethod,
      });

      setBookedReservation(res.data);
      if (onBookingSuccess) {
        onBookingSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-orange-200 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-orange-50/70 border-b border-orange-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {bookedReservation ? 'Reservation Confirmed!' : `Reserve Slot ${slot.slot_number}`}
              </h3>
              <p className="text-xs text-stone-500">{lot.lot_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-orange-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {bookedReservation ? (
            /* Success State */
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-orange-50">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-stone-900">Pass Generated Successfully!</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Your parking pass PDF and QR code have been created and encrypted to AWS S3.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Slot Allocated:</span>
                  <span className="font-bold text-stone-900">{slot.slot_number} ({slot.slot_type.toUpperCase()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Vehicle:</span>
                  <span className="font-bold text-stone-900">{bookedReservation.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Paid:</span>
                  <span className="font-bold text-orange-600">${bookedReservation.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pass Hash:</span>
                  <span className="font-mono text-[11px] text-stone-700">{bookedReservation.pass_hash.substring(0, 16)}...</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                {bookedReservation.pass_qr_url && (
                  <a
                    href={bookedReservation.pass_qr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-orange-300 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Parking Pass PDF
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold rounded-xl border border-orange-200 transition"
                >
                  Close & View In My Passes
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleBooking} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Vehicle License Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-AB-1234 or DL-4C-9876"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-semibold uppercase tracking-wider transition"
                />
              </div>

              {/* Duration Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Duration: {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                  </label>
                  <span className="text-xs text-orange-600 font-semibold">${hourlyRate}/hr</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                  <span>1 Hour</span>
                  <span>6 Hours</span>
                  <span>12 Hours</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI / Instant Pay', 'Credit / Debit Card'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        paymentMethod === method
                          ? 'bg-orange-100 text-orange-900 border-orange-300 ring-1 ring-orange-400'
                          : 'bg-white text-stone-600 border-orange-100 hover:bg-orange-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <span className="text-xs text-stone-500 font-medium">Estimated Total:</span>
                  <div className="text-xs text-stone-400">{durationHours} hr &times; ${hourlyRate}/hr</div>
                </div>
                <span className="text-xl font-extrabold text-orange-600">${totalAmount}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm shadow-orange-300 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Pay & Reserve Slot
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
