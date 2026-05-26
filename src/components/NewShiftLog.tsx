import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, DollarSign, Fuel, Receipt, Percent, Clipboard, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Driver, Car, ShiftLog } from '../types';

interface NewShiftLogProps {
  drivers: Driver[];
  cars: Car[];
  shifts: ShiftLog[];
  onAddShiftLog: (log: Omit<ShiftLog, 'id' | 'titheMoney'>) => void;
}

export default function NewShiftLog({ drivers, cars, shifts, onAddShiftLog }: NewShiftLogProps) {
  const [driverId, setDriverId] = useState('');
  const [amountCashedIn, setAmountCashedIn] = useState('');
  const [amountOwing, setAmountOwing] = useState('');
  const [manualDebt, setManualDebt] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-calculated variables for visual interest
  const [calcTithe, setCalcTithe] = useState(0);
  const [calcTotalDebt, setCalcTotalDebt] = useState(0);

  // Load from driver selection to display active car assigned
  const selectedDriver = drivers.find((d) => d.id === driverId);
  const selectedCar = selectedDriver ? cars.find((c) => c.id === selectedDriver.assignedCarId) : null;

  useEffect(() => {
    const cash = Number(amountCashedIn) || 0;
    setCalcTithe(cash * 0.1);

    const owing = Number(amountOwing) || 0;
    const manDebt = Number(manualDebt) || 0;
    setCalcTotalDebt(owing + manDebt);
  }, [amountCashedIn, amountOwing, manualDebt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!driverId) return setError('Please select a driver from the fleet directory.');
    if (!selectedDriver) return setError('Selected driver profile is invalid.');

    const cash = Number(amountCashedIn);
    const owing = Number(amountOwing) || 0;
    const manDebt = Number(manualDebt) || 0;
    const fuelVal = Number(fuelCost) || 0;
    const litVal = Number(fuelLiters) || 0;

    if (isNaN(cash) || cash < 0) return setError('Please enter a valid amount cashed in.');
    if (isNaN(owing) || owing < 0) return setError('Please enter a valid amount owing.');
    if (isNaN(manDebt) || manDebt < 0) return setError('Please enter a valid manual debt amount.');
    if (isNaN(fuelVal) || fuelVal < 0) return setError('Please enter a valid fuel cost expense.');
    if (isNaN(litVal) || litVal < 0) return setError('Please enter a valid fuel liters figure.');

    onAddShiftLog({
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      carId: selectedCar ? selectedCar.id : '',
      carPlate: selectedCar ? selectedCar.numberPlate : 'No Car',
      amountCashedIn: cash,
      amountOwing: owing,
      manualDebt: manDebt,
      fuelCost: fuelVal,
      fuelLiters: litVal,
      date,
      notes: notes.trim(),
    });

    // Reset fields
    setAmountCashedIn('');
    setAmountOwing('');
    setManualDebt('');
    setFuelCost('');
    setFuelLiters('');
    setNotes('');
    setSuccess(`Shift log added successfully! Driver ${selectedDriver.name}'s debt is updated.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div id="new-shift-log-view" className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-serif italic text-[#e2e2e2]">Shift Log Registry</h1>
        <p className="mt-2 text-white/40 text-xs tracking-wide uppercase font-sans">
          Upload active service returns, fuel transactions, shortfalls, and record auto-generated driver debts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Input parameters panel */}
        <div id="shift-log-form-card" className="bg-[#111111] border border-white/5 p-6 rounded-none h-fit space-y-5 lg:col-span-2">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <Clipboard className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Log Shift Operations</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div id="shift-error" className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-none font-sans">
                {error}
              </div>
            )}
            {success && (
              <div id="shift-success" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-none font-sans">
                {success}
              </div>
            )}

            {/* Selecting Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Select Shift Driver</label>
                <select
                  id="shift-select-driver"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-white/60 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="" className="text-white/20">Choose active driver profile...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Plate: {d.assignedCarId ? cars.find((c) => c.id === d.assignedCarId)?.numberPlate : 'None'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Shift Date</label>
                <div className="relative">
                  <input
                    id="shift-input-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Assigned Asset Details (Dynamic Banner) */}
            {selectedDriver && (
              <div id="assigned-driver-meta" className="flex items-center justify-between p-3.5 bg-white/5 rounded-none border border-white/10">
                <div>
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Vessel Assignment</span>
                  <span className="text-[#e2e2e2] text-xs font-serif italic">
                    {selectedCar ? `${selectedCar.name} [${selectedCar.numberPlate}]` : 'No car allocated. Please assign a car first.'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Current Driver Debt Balance</span>
                  <span className="text-red-400 text-xs font-serif">$ {selectedDriver.debt.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Financial columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Amount Cashed In ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs">$</span>
                  <input
                    id="shift-input-cash"
                    type="number"
                    step="any"
                    value={amountCashedIn}
                    onChange={(e) => setAmountCashedIn(e.target.value)}
                    placeholder="250.00"
                    className="w-full rounded-none border border-white/10 bg-[#050505] pl-7 pr-3 py-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Shift Shortfall (Owing) ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs">$</span>
                  <input
                    id="shift-input-owing"
                    type="number"
                    step="any"
                    value={amountOwing}
                    onChange={(e) => setAmountOwing(e.target.value)}
                    placeholder="30.00"
                    className="w-full rounded-none border border-white/10 bg-[#050505] pl-7 pr-3 py-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[9px] text-white/30 block mt-1">Auto-added to driver debt history balance.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Extra Manual Debt ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs">$</span>
                  <input
                    id="shift-input-manual-debt"
                    type="number"
                    step="any"
                    value={manualDebt}
                    onChange={(e) => setManualDebt(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-none border border-white/10 bg-[#050505] pl-7 pr-3 py-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[9px] text-white/30 block mt-1">Other auto-allocated penalties or invoices.</span>
              </div>
            </div>

            {/* Fuel commands and parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                  <Fuel className="h-3 w-3 text-white/30" />
                  Fuel Spent Cost ($) (Fuel Command)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs">$</span>
                  <input
                    id="shift-input-fuel-cost"
                    type="number"
                    step="any"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="45.00"
                    className="w-full rounded-none border border-white/10 bg-[#050505] pl-7 pr-3 py-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Gas Fuel Liters (L)</label>
                <div className="relative">
                  <input
                    id="shift-input-fuel-liters"
                    type="number"
                    step="any"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Operational Notes</label>
              <textarea
                id="shift-input-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Evening rush traffic report, tyre replacement reminder etc."
                rows={2}
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <button
              id="btn-add-shift-submit"
              type="submit"
              className="w-full cursor-pointer rounded-none bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black transition active:scale-98"
            >
              Log Live Shift Audit
            </button>
          </form>
        </div>

        {/* Live Calculation Panel Right */}
        <div id="live-computation-metrics" className="space-y-6">
          <div className="bg-[#111111] border border-white/5 p-6 rounded-none h-fit space-y-4 shadow-sm">
            <h3 className="font-serif italic text-base text-white border-b border-white/10 pb-3 flex items-center space-x-2">
              <Percent className="h-4 w-4 text-[#d4af37]" />
              <span>Shift Sync Audit Preview</span>
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Auto-calculated Tithe (10%)</span>
                <span className="text-xl font-serif text-[#d4af37]">${calcTithe.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Auto-generated Driver Debt</span>
                <span className="text-xl font-serif text-red-400">${calcTotalDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#050505] rounded-none border border-white/5 text-[10px] text-white/40 space-y-2 mt-4 font-sans leading-relaxed">
              <p>Tithe is strictly valued at 10% of total cash-in payload.</p>
              <p>Total newly applied debt is consolidated automatically onto the linked driver balance on form submission.</p>
            </div>
          </div>
        </div>
      </div>

      {/* History log rows list */}
      <div id="fleet-shifts-listing" className="bg-[#111111] border border-white/5 p-6 rounded-none shadow-sm">
        <h3 className="font-serif italic text-lg text-white border-b border-white/10 pb-3 mb-4">
          All Logged Shift Records ({shifts.length})
        </h3>

        {shifts.length === 0 ? (
          <p className="text-center text-white/30 text-xs py-8 font-serif italic">
            No shifts logs saved in sheet. Create an entry above to register operational audit trail rows.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/40">
              <thead>
                <tr className="border-b border-white/10 font-bold uppercase text-[10px] tracking-wider text-white/30 font-serif italic">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Driver</th>
                  <th className="py-3 px-2">Car Plate</th>
                  <th className="py-3 px-2 text-right">Cash In</th>
                  <th className="py-3 px-2 text-right">Owing</th>
                  <th className="py-3 px-2 text-right">Manual Debt</th>
                  <th className="py-3 px-2 text-right">Fuel Spent</th>
                  <th className="py-3 px-2 text-right">Liters</th>
                  <th className="py-3 px-2 text-right">Tithe (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                {shifts.map((s) => (
                  <tr id={`shift-history-${s.id}`} key={s.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-2 font-mono text-white/40">{s.date}</td>
                    <td className="py-3 px-2 font-serif italic text-[#e2e2e2]">{s.driverName}</td>
                    <td className="py-3 px-2 font-serif italic text-[#d4af37]">{s.carPlate}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#e2e2e2]">${s.amountCashedIn.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-red-400">${s.amountOwing.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-red-500">${s.manualDebt.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-[#e2e2e2]">${s.fuelCost.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-white/40">{s.fuelLiters || 0} L</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-400">${s.titheMoney.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
