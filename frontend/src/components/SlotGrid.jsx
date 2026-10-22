import React from 'react';
import { Car, Bike, Zap, CheckCircle2, Lock } from 'lucide-react';

export const SlotGrid = ({ slots, selectedSlot, onSelectSlot, lotName }) => {
  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white border border-orange-100 rounded-xl p-8 text-center text-stone-500">
        <Car className="w-10 h-10 text-orange-300 mx-auto mb-2" />
        <p className="font-medium">No parking slots configured for this facility yet.</p>
      </div>
    );
  }

  const getSlotTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'ev':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'bike':
        return <Bike className="w-3.5 h-3.5 text-orange-600" />;
      default:
        return <Car className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  return (
    <div className="bg-white border border-orange-100 rounded-xl p-5 shadow-sm">
      {/* Grid Legend & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-orange-100">
        <div>
          <h3 className="text-base font-bold text-stone-900">Interactive Parking Slot Layout</h3>
          <p className="text-xs text-stone-500">Select an available peach slot to reserve your parking spot.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-orange-100 border border-orange-300"></span>
            <span className="text-stone-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-600 ring-2 ring-orange-300"></span>
            <span className="text-stone-900 font-bold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-stone-200 border border-stone-300 opacity-60"></span>
            <span className="text-stone-500">Occupied</span>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isOccupied = slot.is_occupied;

          let slotClass = '';
          if (isSelected) {
            slotClass = 'bg-orange-500 text-white border-orange-600 ring-2 ring-orange-300 shadow-md scale-105';
          } else if (isOccupied) {
            slotClass = 'bg-stone-200 text-stone-600 border-stone-300 cursor-not-allowed opacity-60';
          } else {
            slotClass = 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-300 cursor-pointer hover:shadow-sm';
          }

          return (
            <button
              key={slot.id}
              disabled={isOccupied}
              onClick={() => onSelectSlot(slot)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all duration-150 min-h-[92px] ${slotClass}`}
            >
              {/* Slot Header: Type & Occupancy icon */}
              <div className="w-full flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-semibold opacity-90">
                  {getSlotTypeIcon(slot.slot_type)}
                  <span className="uppercase text-[10px]">{slot.slot_type}</span>
                </span>
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : isOccupied ? (
                  <Lock className="w-3 h-3 text-stone-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                )}
              </div>

              {/* Slot Number */}
              <div className="my-1">
                <span className="text-base font-extrabold tracking-tight">
                  {slot.slot_number}
                </span>
              </div>

              {/* Status Label */}
              <div className="text-[10px] font-bold tracking-wide">
                {isSelected ? 'SELECTED' : isOccupied ? 'OCCUPIED' : 'READY'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
