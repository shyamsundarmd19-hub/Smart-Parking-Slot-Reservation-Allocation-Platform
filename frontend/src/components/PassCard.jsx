import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Clock, Download, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const PassCard = ({ reservation, onCancel }) => {
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            Booked & Ready
          </span>
        );
      case 'checked_in':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Parked / Inside
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-stone-500" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-orange-100 hover:border-orange-300 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
      {/* Top Banner */}
      <div className="bg-orange-50/70 p-4 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 tracking-tight">
              {reservation.vehicle_number}
            </h4>
            <p className="text-[11px] text-stone-500">
              Ref: {reservation.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      {/* Pass Body with QR Code */}
      <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
        {/* QR Code Container */}
        <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-200/60 shadow-inner flex flex-col items-center shrink-0">
          <QRCodeSVG
            value={reservation.pass_hash}
            size={108}
            bgColor="#fff7ed"
            fgColor="#1c1917"
            level="M"
          />
          <span className="text-[9px] font-mono text-stone-500 mt-1">Scan At Gate</span>
        </div>

        {/* Pass Details */}
        <div className="flex-1 w-full space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Schedule</span>
              <span className="font-semibold text-stone-800">{formatDate(reservation.start_time)}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Expires</span>
              <span className="font-semibold text-stone-800">{formatDate(reservation.end_time)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-orange-50">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Prepaid Fee</span>
              <span className="font-bold text-orange-600 text-sm">${reservation.total_amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Verification Hash</span>
              <span className="font-mono text-[10px] text-stone-600 truncate block">
                {reservation.pass_hash.substring(0, 12)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-orange-50/40 p-3 border-t border-orange-100 flex items-center justify-between gap-2">
        {reservation.pass_qr_url ? (
          <a
            href={reservation.pass_qr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Ticket
          </a>
        ) : (
          <span className="text-[11px] text-stone-400 italic">Encrypted to AWS S3</span>
        )}

        {reservation.status === 'booked' && onCancel && (
          <button
            onClick={() => onCancel(reservation.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
          >
            Cancel Pass
          </button>
        )}
      </div>
    </div>
  );
};
