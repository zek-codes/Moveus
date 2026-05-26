import React, { useState } from 'react';
import { Fuel, ShieldAlert, BadgeInfo, Wrench, Clock, FileSpreadsheet, PlusCircle, AlertTriangle, CheckCircle, Flame, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Driver, Car, MaintenanceLog } from '../types';

interface InformationPageProps {
  drivers: Driver[];
  cars: Car[];
  maintenance: MaintenanceLog[];
  onUpdateDriverMileage: (driverId: string, mileage: number) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id'>) => void;
  securityPin: string;
  onChangePin: (newPin: string) => boolean;
}

export default function InformationPage({
  drivers,
  cars,
  maintenance,
  onUpdateDriverMileage,
  onAddMaintenance,
  securityPin,
  onChangePin,
}: InformationPageProps) {
  // Security settings states
  const [newPinInput, setNewPinInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [pinUpdateStatus, setPinUpdateStatus] = useState({ success: false, message: '' });

  const handlePinUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPinUpdateStatus({ success: false, message: '' });
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinUpdateStatus({ success: false, message: 'PIN must be exactly 4 numeric digits.' });
      return;
    }
    const succ = onChangePin(newPinInput);
    if (succ) {
      setPinUpdateStatus({ success: true, message: 'Security passcode updated successfully.' });
      setNewPinInput('');
      setTimeout(() => setPinUpdateStatus({ success: false, message: '' }), 4000);
    } else {
      setPinUpdateStatus({ success: false, message: 'Failed to update. Verify criteria.' });
    }
  };

  // Mileage & Fuel States
  const [driverId, setDriverId] = useState('');
  const [weeklyMileage, setWeeklyMileage] = useState('');
  const [fuelEfficiency, setFuelEfficiency] = useState('10'); // km or miles per liter
  const [mileageSaved, setMileageSaved] = useState('');

  // Maintenance Logging States
  const [maintenanceCarId, setMaintenanceCarId] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('Oil Change');
  const [maintenanceDesc, setMaintenanceDesc] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDebt, setIsDebt] = useState(false); // Tagging as garage/servicing debt

  const [maintError, setMaintError] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

  // Calculations
  const selectedDriver = drivers.find((d) => d.id === driverId);
  const currentWeeklyMileageVal = Number(weeklyMileage) || 0;
  const efficiencyVal = Number(fuelEfficiency) || 10;
  const calculatedFuelRequired = currentWeeklyMileageVal / efficiencyVal;

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) return;

    const parsedMileage = Number(weeklyMileage);
    if (isNaN(parsedMileage) || parsedMileage < 0) return;

    onUpdateDriverMileage(driverId, parsedMileage);
    setMileageSaved(`Mileage updated for ${selectedDriver?.name}! Estimated weekly fuel required is ${calculatedFuelRequired.toFixed(1)} Liters.`);
    setTimeout(() => setMileageSaved(''), 5000);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintError('');
    setMaintSuccess('');

    if (!maintenanceCarId) return setMaintError('Please select a car asset for maintenance log.');
    const costVal = Number(maintenanceCost);
    if (isNaN(costVal) || costVal < 0) return setMaintError('Please enter a valid positive maintenance cost.');

    const selectedCar = cars.find((c) => c.id === maintenanceCarId);
    if (!selectedCar) return setMaintError('Selected car is invalid.');

    onAddMaintenance({
      carId: selectedCar.id,
      carPlate: selectedCar.numberPlate,
      cost: costVal,
      category: maintenanceCategory,
      description: maintenanceDesc.trim(),
      date: maintenanceDate,
      isDebt,
    });

    setMaintenanceCost('');
    setMaintenanceDesc('');
    setIsDebt(false);
    setMaintSuccess(`Maintenance log added successfully for ${selectedCar.name}!`);
    setTimeout(() => setMaintSuccess(''), 3000);
  };

  // Outstanding servicing debts of the whole fleet (maintenance recorded with isDebt == true)
  const servicingDebtsList = maintenance.filter((m) => m.isDebt);
  const totalServicingDebtValue = servicingDebtsList.reduce((sum, m) => sum + m.cost, 0);

  // Mileage warnings
  const overdueServiceCars = cars.filter((c) => c.mileage >= c.nextServiceMileage);

  return (
    <div id="information-view" className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-serif italic text-[#e2e2e2]">Fleet Diagnostics & Calculations</h1>
        <p className="mt-2 text-white/40 text-xs tracking-wide uppercase font-sans">
          Compute route fuel targets, manage mechanic service ledgers, and trigger critical mechanical debt alarms.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Card Section 1: Mileage / Fuel required */}
        <div id="fuel-required-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-5 shadow-sm">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <Fuel className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Fuel Allocation Calculator</h3>
          </div>

          <form onSubmit={handleMileageSubmit} className="space-y-4">
            {mileageSaved && (
              <div id="mileage-success" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-none flex items-start space-x-2 font-sans">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{mileageSaved}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Driver</label>
                <select
                  id="calc-driver"
                  value={driverId}
                  onChange={(e) => {
                    setDriverId(e.target.value);
                    const selected = drivers.find((d) => d.id === e.target.value);
                    if (selected) {
                      setWeeklyMileage(String(selected.mileageThisWeek || ''));
                    }
                  }}
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-white/60 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">Select a driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.mileageThisWeek > 0 ? `(Curr: ${d.mileageThisWeek} km)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Weekly Mileage (km)</label>
                <input
                  id="calc-input-mileage"
                  type="number"
                  value={weeklyMileage}
                  onChange={(e) => setWeeklyMileage(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 font-sans">
                Average Fuel Efficiency Ratio: <span className="text-[#d4af37] font-serif font-bold">{efficiencyVal} km per Liter</span>
              </label>
              <input
                id="calc-input-efficiency"
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={fuelEfficiency}
                onChange={(e) => setFuelEfficiency(e.target.value)}
                className="w-full accent-[#d4af37] h-0.5 bg-white/10 rounded-none appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest">
                <span>5 km/L (Low efficiency)</span>
                <span>25 km/L (Ultra Eco hybrid)</span>
              </div>
            </div>

            {/* Calculations preview */}
            {currentWeeklyMileageVal > 0 && (
              <div id="fuel-calculation-result" className="p-4 bg-[#050505] rounded-none border border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Estimated Fuel Target Required</span>
                  <span className="text-2xl font-serif text-[#e2e2e2] mt-1 block">
                    {calculatedFuelRequired.toFixed(1)} <span className="text-xs font-serif italic text-white/40">Liters</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-white/30 uppercase tracking-widest font-mono">Trip Coverage Factor</span>
                  <span className="text-[#d4af37] text-xs font-serif italic">~{(calculatedFuelRequired * 0.26).toFixed(1)} gal</span>
                </div>
              </div>
            )}

            <button
              id="btn-save-weekly-mileage"
              type="submit"
              disabled={!driverId}
              className={`w-full cursor-pointer rounded-none bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition focus:outline-none ${!driverId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Update Driver Weekly Mileage
            </button>
          </form>
        </div>

        {/* Card Section 2: Log garage repairs */}
        <div id="add-maintenance-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-5 shadow-sm">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <Wrench className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Log Car Maintenance / Repairs</h3>
          </div>

          <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
            {maintError && (
              <div id="maint-error" className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-none font-sans">
                {maintError}
              </div>
            )}
            {maintSuccess && (
              <div id="maint-success" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-none font-sans">
                {maintSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 font-sans">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Select Car</label>
                <select
                  id="maint-select-car"
                  value={maintenanceCarId}
                  onChange={(e) => setMaintenanceCarId(e.target.value)}
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-white/60 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">Choose registered vehicle...</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.numberPlate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Maintenance Cost ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xs">$</span>
                  <input
                    id="maint-input-cost"
                    type="number"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(e.target.value)}
                    placeholder="120.00"
                    className="w-full rounded-none border border-white/10 bg-[#050505] pl-7 pr-3 py-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Service Category</label>
                <select
                  id="maint-select-cat"
                  value={maintenanceCategory}
                  onChange={(e) => setMaintenanceCategory(e.target.value)}
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-white/60 focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="Oil Change">Oil Change / Filters</option>
                  <option value="Brakes">Brakes & Pads</option>
                  <option value="Tires">Tires & Alignment</option>
                  <option value="Engine">Engine Mechanical</option>
                  <option value="Suspension">Suspension & Steering</option>
                  <option value="General Repair">General Repair</option>
                  <option value="Other">Other Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Repair Log Date</label>
                <input
                  id="maint-input-date"
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] focus:border-[#d4af37] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Repair Description</label>
              <input
                id="maint-input-desc"
                type="text"
                value={maintenanceDesc}
                onChange={(e) => setMaintenanceDesc(e.target.value)}
                placeholder="Replaced rear brake calipers and brake oil"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-none border border-white/10">
              <input
                id="maint-input-isdebt"
                type="checkbox"
                checked={isDebt}
                onChange={(e) => setIsDebt(e.target.checked)}
                className="h-3.5 w-3.5 rounded-none border-white/20 accent-[#d4af37] bg-[#050505] focus:outline-none focus:ring-0"
              />
              <div>
                <label htmlFor="maint-input-isdebt" className="text-xs font-bold text-[#d4af37] cursor-pointer block font-serif italic">
                  Mark as Owed Servicing Debt (Pending Payment)
                </label>
                <span className="text-[10px] text-white/30 block mt-1 leading-normal">
                  Enters this repair cost as outstanding mechanic balance (adds to Servicing Debt Alerts).
                </span>
              </div>
            </div>

            <button
              id="btn-add-maintenance-submit"
              type="submit"
              className="w-full cursor-pointer rounded-none bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition"
            >
              Add Mechanic Work Log
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: Servicing Alerts and Debt indicators */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Alerts for Car Servicing Debt */}
        <div id="service-debts-alerts-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="h-4.5 w-4.5 text-red-500 font-bold" />
              <h3 className="font-serif italic text-base">Servicing Debt Alarms</h3>
            </div>
            {totalServicingDebtValue > 0 && (
              <span className="bg-red-950/40 text-red-400 border border-red-800/50 text-[9px] px-1.5 py-0.5 rounded-none font-mono font-bold animate-pulse">
                ALARM ON
              </span>
            )}
          </div>

          <div className="text-center py-4 bg-[#050505] rounded-none border border-white/5 p-4">
            <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest block mb-1 font-sans">Total Fleet Outstanding Garage Debt</span>
            <span className={`text-3xl font-serif tracking-tight block ${totalServicingDebtValue > 0 ? 'text-red-405 italic' : 'text-white/40'}`}>
              ${totalServicingDebtValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {servicingDebtsList.length === 0 ? (
            <p className="text-center text-xs text-white/30 py-4 font-serif italic">No unpaid mechanic invoices or servicing debts exist. Fleet is clear!</p>
          ) : (
            <div className="overflow-y-auto max-h-48 space-y-2 pr-1 text-xs">
              {servicingDebtsList.map((m) => (
                <div id={`servicing-debt-${m.id}`} key={m.id} className="p-3 bg-red-950/10 border border-red-900/40 rounded-none flex justify-between items-center">
                  <div>
                    <h5 className="font-serif text-[#e2e2e2] italic">{m.category} — {m.carPlate}</h5>
                    <p className="text-white/40 text-[10px] truncate max-w-[200px] mt-0.5">{m.description}</p>
                    <span className="text-white/20 text-[9px] font-mono block mt-1">{m.date}</span>
                  </div>
                  <span className="font-mono text-red-450 font-bold">${m.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics on Car Servicing Overviews */}
        <div id="cars-servicing-analytics-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-4 col-span-1 lg:col-span-2 shadow-sm">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <Wrench className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Mechanic & Garage Logs ({maintenance.length})</h3>
          </div>

          {maintenance.length === 0 ? (
            <p className="text-center text-white/30 text-xs py-8 h-48 flex items-center justify-center font-serif italic">
              No historical vehicle servicing entries registered. Use the mechanic log form above to record logs.
            </p>
          ) : (
            <div className="overflow-x-auto text-xs">
              <div className="max-h-[300px] overflow-y-auto pr-1">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-white/30 font-serif italic uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-1">Date</th>
                      <th className="py-2.5 px-1">Car</th>
                      <th className="py-2.5 px-1">Category</th>
                      <th className="py-2.5 px-1">Description</th>
                      <th className="py-2.5 px-1">Type</th>
                      <th className="py-2.5 px-1 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/70">
                    {maintenance.map((m) => (
                      <tr id={`maint-row-${m.id}`} key={m.id} className="hover:bg-white/5 transition">
                        <td className="py-2 px-1 text-white/40">{m.date}</td>
                        <td className="py-2 px-1 font-serif italic text-[#e2e2e2]">{m.carPlate}</td>
                        <td className="py-2 px-1 text-[#d4af37] font-serif italic">{m.category}</td>
                        <td className="py-2 px-1 text-white/50 truncate max-w-[150px]" title={m.description}>
                          {m.description}
                        </td>
                        <td className="py-2 px-1">
                          {m.isDebt ? (
                            <span className="text-[9px] bg-red-955/40 text-red-400 border border-red-900/40 px-1 py-0.5 rounded-none">Owed Debt</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-955/40 text-emerald-400 border border-emerald-900/40 px-1 py-0.5 rounded-none">Settled</span>
                          )}
                        </td>
                        <td className="py-2 px-1 text-right font-serif text-[#e2e2e2]">${m.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Terminal Security & Access */}
      <div id="terminal-security-panel" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-5 shadow-sm">
        <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
          <ShieldAlert className="h-4.5 w-4.5 text-[#d4af37]" />
          <h3 className="font-serif italic text-base">Terminal Access Security & Key Lock</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-2 text-xs text-white/50 leading-relaxed font-sans">
            <p>
              The Moveus Logistics operations console is shielded by an encrypted 4-digit security passcode on startup to avoid unauthorized data access or local modifications.
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono pt-1">
              Active Security Passcode: <span className="text-[#d4af37] font-bold">{isRevealed ? securityPin : '••••'}</span>
              <button
                type="button"
                onClick={() => setIsRevealed(!isRevealed)}
                className="ml-2.5 text-[10px] text-[#d4af37] hover:underline uppercase font-bold cursor-pointer"
              >
                {isRevealed ? 'Hide' : 'Reveal'}
              </button>
            </p>
          </div>

          <form onSubmit={handlePinUpdate} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Update Master Access PIN</label>
              <div className="flex space-x-2">
                <input
                  id="input-new-pin"
                  type="text"
                  maxLength={4}
                  placeholder="New 4-digit PIN"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none font-mono"
                />
                <button
                  id="btn-update-pin"
                  type="submit"
                  className="cursor-pointer bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition"
                >
                  Save Code
                </button>
              </div>
            </div>

            {pinUpdateStatus.message && (
              <div
                id="pin-update-status"
                className={`text-[11px] px-3.5 py-2.5 rounded-none font-sans ${
                  pinUpdateStatus.success
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22c55e]'
                    : 'bg-red-500/10 border border-red-500/20 text-[#ef4444]'
                }`}
              >
                {pinUpdateStatus.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
