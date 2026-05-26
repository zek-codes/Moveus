import React, { useState } from 'react';
import { UserPlus, Star, Trash2, Phone, Shield, Clipboard, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Driver, Car } from '../types';

interface ManageDriversProps {
  drivers: Driver[];
  cars: Car[];
  onAddDriver: (driver: Omit<Driver, 'id' | 'debt' | 'mileageThisWeek'>) => void;
  onDeleteDriver: (id: string) => void;
  onAssignCar: (driverId: string, carId: string) => void;
}

export default function ManageDrivers({
  drivers,
  cars,
  onAddDriver,
  onDeleteDriver,
  onAssignCar,
}: ManageDriversProps) {
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [assignedCarId, setAssignedCarId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) return setError('Driver Name is required.');
    if (!licenseNumber.trim()) return setError('License Number is required.');
    if (!phoneNumber.trim()) return setError('Phone Number is required.');

    onAddDriver({
      name: name.trim(),
      licenseNumber: licenseNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      assignedCarId,
    });

    setName('');
    setLicenseNumber('');
    setPhoneNumber('');
    setAssignedCarId('');
    setSuccess('Driver added and configured successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div id="manage-drivers-view" className="space-y-8">
      {/* Upper Layout heading */}
      <div>
        <h1 className="text-3xl font-serif italic text-[#e2e2e2]">Drivers Directory</h1>
        <p className="mt-2 text-white/40 text-xs tracking-wide uppercase font-sans">
          Onboard, configure, assign vehicles, and review active operator profiles.
        </p>
      </div>

      {/* Main Grid: Add Driver vs Driver Directory */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Onboard Left Panel */}
        <div id="add-driver-form-card" className="bg-[#111111] border border-white/5 p-6 rounded-none h-fit space-y-5">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <UserPlus className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Onboard New Driver</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div id="driver-error-log" className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-none font-sans">
                {error}
              </div>
            )}
            {success && (
              <div id="driver-success-log" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-none font-sans">
                {success}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Full Name</label>
              <input
                id="driver-input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">License Number</label>
              <input
                id="driver-input-license"
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="DL-987654321A"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#e2e2e2]/40">Phone Number</label>
              <input
                id="driver-input-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 0192"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Assign Car (Optional)</label>
              <select
                id="driver-select-car"
                value={assignedCarId}
                onChange={(e) => setAssignedCarId(e.target.value)}
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-white/70 focus:border-[#d4af37] focus:outline-none"
              >
                <option value="" className="text-white/30">Unassigned</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} ({car.numberPlate})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-add-driver-submit"
              type="submit"
              className="w-full cursor-pointer rounded-none bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition active:scale-98"
            >
              Configure & Save Profile
            </button>
          </form>
        </div>

        {/* Directory right side table/cards */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif italic text-white border-b border-white/10 pb-2 w-full">Driver Directory ({drivers.length})</h3>
          </div>

          {drivers.length === 0 ? (
            <div id="empty-drivers-state" className="flex flex-col items-center justify-center p-12 rounded-none border border-white/5 bg-[#111111]/15 h-80 text-center">
              <UsersIconPlaceholder className="h-9 w-9 text-white/20 mb-3" />
              <p className="text-sm text-[#e2e2e2] font-serif">No active drivers onboarded</p>
              <p className="text-xs text-white/30 mt-1 font-sans">Submit the driver form to organize shifts and mileage calculation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drivers.map((driver) => {
                const assignedCar = cars.find((c) => c.id === driver.assignedCarId);
                return (
                  <motion.div
                    id={`driver-card-${driver.id}`}
                    key={driver.id}
                    layoutId={`driver-layout-${driver.id}`}
                    className="group relative rounded-none border border-white/5 bg-[#111111] p-5 shadow-sm hover:border-[#d4af37]/25 transition-all duration-150"
                  >
                    {/* Upper Line Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-[#e2e2e2] group-hover:text-[#d4af37] transition font-sans">
                          {driver.name}
                        </h4>
                        <div className="flex items-center mt-1 text-white/40 space-x-1 font-mono text-[10px]">
                          <Shield className="h-3 w-3 text-white/20" />
                          <span>License: {driver.licenseNumber}</span>
                        </div>
                      </div>

                      <button
                        id={`btn-del-driver-${driver.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to completely offboard driver ${driver.name}? All unpaid mileage indices might reside unadjusted.`)) {
                            onDeleteDriver(driver.id);
                          }
                        }}
                        className="cursor-pointer text-white/30 hover:text-red-400 p-1.5 rounded-none hover:bg-red-500/10 transition"
                        title="Remove Driver"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Meta Indicators */}
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-white/30 font-bold uppercase tracking-wider block text-[10px]">Assigned Asset</span>
                        {assignedCar ? (
                          <span className="font-bold text-[#d4af37] block truncate">
                            {assignedCar.name}
                            <span className="font-serif text-[10px] bg-white/5 text-[#d4af37] px-1.5 py-0.5 rounded-none border border-white/10 block w-fit mt-1 italic">
                              {assignedCar.numberPlate}
                            </span>
                          </span>
                        ) : (
                          <select
                            id={`quick-assign-${driver.id}`}
                            value=""
                            onChange={(e) => onAssignCar(driver.id, e.target.value)}
                            className="bg-[#050505] border border-white/15 rounded-none px-1.5 py-1 text-xs text-white/40 focus:outline-none w-full"
                          >
                            <option value="">Choose Car...</option>
                            {cars.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.numberPlate})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1 text-right">
                        <span className="text-white/30 font-bold uppercase tracking-wider block text-[10px]">Active Debt Owing</span>
                        <span className={`text-sm font-serif block ${driver.debt > 0 ? 'text-red-400' : 'text-white/40'}`}>
                          ${driver.debt.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-[#e2e2e2]/40">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3.5 w-3.5 text-white/20" />
                        <span className="font-mono">{driver.phoneNumber}</span>
                      </div>
                      <span className="font-serif text-[10px] bg-white/5 text-[#d4af37] px-1.5 py-0.5 rounded-none border border-white/5 italic">
                        Weekly: {driver.mileageThisWeek} km
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersIconPlaceholder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
