import React, { useState } from 'react';
import { Car, Fuel, ShieldAlert, Plus, Trash2, Settings, HelpCircle, Gauge } from 'lucide-react';
import { motion } from 'motion/react';
import { Car as CarType } from '../types';

interface AddCarProps {
  cars: CarType[];
  onAddCar: (car: Omit<CarType, 'id' | 'maintenanceCost'>) => void;
  onDeleteCar: (id: string) => void;
  onUpdateCarMileage: (id: string, currentMileage: number) => void;
}

export default function AddCar({ cars, onAddCar, onDeleteCar, onUpdateCarMileage }: AddCarProps) {
  const [name, setName] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingMileageId, setEditingMileageId] = useState<string | null>(null);
  const [tempMileageInput, setTempMileageInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) return setError('Vehicle Name is required.');
    if (!numberPlate.trim()) return setError('Number Plate is required.');
    
    const parsedMileage = Number(mileage) || 0;
    const standardInterval = Number(nextServiceMileage) || (parsedMileage + 5000);

    // Normalizing plate to uppercase for uniformity
    const upperPlate = numberPlate.trim().toUpperCase();

    // Plate duplicate validation
    if (cars.some((c) => c.numberPlate.toUpperCase() === upperPlate)) {
      return setError(`A vehicle with plate ${upperPlate} is already registered in the system.`);
    }

    onAddCar({
      name: name.trim(),
      numberPlate: upperPlate,
      mileage: parsedMileage,
      lastServiceMileage: parsedMileage,
      nextServiceMileage: standardInterval,
    });

    setName('');
    setNumberPlate('');
    setMileage('');
    setNextServiceMileage('');
    setSuccess('Vehicle registered and service schedule initialized.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleMileageUpdateSubmit = (carId: string) => {
    const freshMileage = Number(tempMileageInput);
    if (isNaN(freshMileage) || freshMileage < 0) {
      alert('Please enter a valid positive mileage amount.');
      return;
    }
    onUpdateCarMileage(carId, freshMileage);
    setEditingMileageId(null);
  };

  return (
    <div id="add-car-view" className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-serif italic text-[#e2e2e2]">Fleet Asset Ledger</h1>
        <p className="mt-2 text-white/40 text-xs tracking-wide uppercase font-sans">
          Register new high-efficiency logistics assets, configure routine mechanical health limits, and monitor plate indices.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Form Column */}
        <div id="register-car-card" className="bg-[#111111] border border-white/5 p-6 rounded-none h-fit space-y-5">
          <div className="flex items-center space-x-2.5 text-white border-b border-white/10 pb-3">
            <Plus className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Register Fleet Asset</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div id="car-error" className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-none font-sans">
                {error}
              </div>
            )}
            {success && (
              <div id="car-success" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-none font-sans">
                {success}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 font-sans">Car Model / Name</label>
              <input
                id="car-input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Toyota Prius / Nissan Leaf"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 font-sans">Number Plate</label>
              <input
                id="car-input-plate"
                type="text"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
                placeholder="TX-221-M"
                styles={{ textTransform: 'uppercase' }}
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 font-sans">Starting Mileage (mi or km)</label>
              <input
                id="car-input-mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="25000"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 font-sans">Next Service Target Limit (Opt)</label>
              <input
                id="car-input-service"
                type="number"
                value={nextServiceMileage}
                onChange={(e) => setNextServiceMileage(e.target.value)}
                placeholder="30000"
                className="w-full rounded-none border border-white/10 bg-[#050505] p-2.5 text-xs text-[#e2e2e2] placeholder-white/20 focus:border-[#d4af37] focus:outline-none"
              />
              <span className="text-[10px] text-white/30 block mt-1">Defaults to current mileage + 5,000 units.</span>
            </div>

            <button
              id="btn-add-car-submit"
              type="submit"
              className="w-full cursor-pointer rounded-none bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition active:scale-98"
            >
              Add Vehicle Entry
            </button>
          </form>
        </div>

        {/* Right Active Cars Panel */}
        <div id="active-cars-overview" className="col-span-1 lg:col-span-2 space-y-4">
          <h3 className="text-base font-serif italic text-[#e2e2e2] border-b border-white/10 pb-2">Active Assets Ledger ({cars.length})</h3>

          {cars.length === 0 ? (
            <div id="empty-cars-state" className="flex flex-col items-center justify-center p-12 rounded-none border border-white/5 bg-[#111111]/15 h-80 text-center">
              <Car className="h-9 w-9 text-white/20 mb-3" />
              <p className="text-sm font-serif text-[#e2e2e2]">No vehicles registered</p>
              <p className="text-xs text-white/30 mt-1 font-sans">Onboard your first taxi/cab using the registration setup on the left.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cars.map((car) => {
                const serviceProgress = Math.min(
                  100,
                  Math.max(
                    0,
                    ((car.mileage - car.lastServiceMileage) / (car.nextServiceMileage - car.lastServiceMileage || 5000)) * 100
                  )
                );
                const isOverdue = car.mileage >= car.nextServiceMileage;

                return (
                  <motion.div
                    id={`car-card-${car.id}`}
                    key={car.id}
                    layoutId={`car-layout-${car.id}`}
                    className="bg-[#111111] border border-white/5 p-5 rounded-none relative overflow-hidden group hover:border-[#d4af37]/20 transition-all duration-150"
                  >
                    {/* Upper Row Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-[#e2e2e2] group-hover:text-[#d4af37] transition font-sans">
                          {car.name}
                        </h4>
                        <span className="font-serif italic text-xs bg-white/5 text-[#d4af37] border border-white/10 px-2.5 py-0.5 rounded-none inline-block mt-1">
                          {car.numberPlate}
                        </span>
                      </div>

                      <button
                        id={`btn-del-car-${car.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${car.name} (${car.numberPlate})? This will de-allocate any active driver dependencies!`)) {
                            onDeleteCar(car.id);
                          }
                        }}
                        className="cursor-pointer text-white/30 hover:text-red-400 p-1.5 rounded-none hover:bg-red-500/10 transition"
                        title="Remove Car"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Service health bars and mileage indicators */}
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 flex items-center space-x-1">
                          <Gauge className="h-3.5 w-3.5 text-white/20" />
                          <span>Total Mileage:</span>
                        </span>
                        
                        {editingMileageId === car.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              id={`input-quick-mileage-${car.id}`}
                              type="number"
                              value={tempMileageInput}
                              onChange={(e) => setTempMileageInput(e.target.value)}
                              className="w-20 bg-[#050505] border border-white/15 rounded-none text-right px-1 text-xs text-[#e2e2e2] font-mono focus:outline-none"
                            />
                            <button
                              id={`btn-save-quick-mileage-${car.id}`}
                              onClick={() => handleMileageUpdateSubmit(car.id)}
                              className="cursor-pointer bg-[#d4af37] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-none hover:bg-[#c19d2f]"
                            >
                              Set
                            </button>
                            <button
                              id={`btn-cancel-quick-mileage-${car.id}`}
                              onClick={() => setEditingMileageId(null)}
                              className="cursor-pointer bg-white/5 text-white/50 text-[10px] px-1 py-0.5 rounded-none hover:bg-white/10"
                            >
                              x
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-serif text-[#e2e2e2]">
                              {car.mileage.toLocaleString()} km
                            </span>
                            <button
                              id={`btn-edit-mileage-trigger-${car.id}`}
                              onClick={() => {
                                setEditingMileageId(car.id);
                                setTempMileageInput(String(car.mileage));
                              }}
                              className="cursor-pointer text-[10px] bg-white/5 text-white/40 px-1 py-0.5 rounded-none hover:bg-white/10"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-white/40">Service Health Index</span>
                          <span className={`${isOverdue ? 'text-red-400 font-bold' : serviceProgress > 80 ? 'text-[#d4af37]' : 'text-[#e2e2e2]/60'}`}>
                            {isOverdue ? 'OVERDUE' : `${Math.round(serviceProgress)}%`}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-1 px-0 overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 ${isOverdue ? 'bg-red-500 animate-pulse' : serviceProgress > 80 ? 'bg-[#d4af37]' : 'bg-emerald-500'}`}
                            style={{ width: `${serviceProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/30">
                          <span>Last: {car.lastServiceMileage.toLocaleString()}</span>
                          <span>Next: {car.nextServiceMileage.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Cumulative stats */}
                      <div className="flex justify-between pt-1 border-t border-white/5 text-xs">
                        <span className="text-white/40">Total Maintenance Paid:</span>
                        <span className="font-serif text-[#d4af37]">${car.maintenanceCost.toFixed(2)}</span>
                      </div>
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
