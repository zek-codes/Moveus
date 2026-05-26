import { DollarSign, AlertTriangle, Users, Car, Hammer, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { Car as CarType, Driver, ShiftLog, MaintenanceLog } from '../types';

interface DashboardProps {
  drivers: Driver[];
  cars: CarType[];
  shifts: ShiftLog[];
  maintenance: MaintenanceLog[];
}

export default function Dashboard({ drivers, cars, shifts, maintenance }: DashboardProps) {
  // 1. Total Money Cashed In
  const totalCashedIn = shifts.reduce((sum, s) => sum + s.amountCashedIn, 0);

  // 2. Amount Owing (unpaid driver debt balances)
  const totalAmountOwing = drivers.reduce((sum, d) => sum + d.debt, 0);

  // 3. Maintenance Cost (overall historical costs registered)
  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);

  // 4. Tithe Money (10% of total amount cashed in)
  const totalTitheMoney = shifts.reduce((sum, s) => sum + s.titheMoney, 0);

  // Secondary service debt - maintenance recorded but pending payment (marked isDebt: true)
  const servicingDebt = maintenance.filter((m) => m.isDebt).reduce((sum, m) => sum + m.cost, 0);

  // Total recorded fuel expenses
  const totalFuelCost = shifts.reduce((sum, s) => sum + (s.fuelCost || 0), 0);

  const stats = [
    {
      id: 'dash-cash-in',
      name: 'Total Cashed In',
      value: `$${totalCashedIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Accumulated gross shift earnings',
      icon: DollarSign,
      cardClass: 'bg-[#111111] border border-white/5 border-t-2 border-t-[#d4af37]',
      valueClass: 'text-3xl font-serif text-white',
      badgeClass: 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20',
    },
    {
      id: 'dash-amount-owing',
      name: 'Amount Owing',
      value: `$${totalAmountOwing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Active shortfalls and unpaid driver balances',
      icon: AlertTriangle,
      cardClass: 'bg-[#111111] border border-white/5',
      valueClass: 'text-3xl font-serif text-red-400',
      badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
    },
    {
      id: 'dash-maint-cost',
      name: 'Maintenance Cost',
      value: `$${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Overall garage fees and part replacements',
      icon: Hammer,
      cardClass: 'bg-[#111111] border border-white/5',
      valueClass: 'text-3xl font-serif text-[#e2e2e2]',
      badgeClass: 'bg-white/5 text-white/70 border border-white/10',
    },
    {
      id: 'dash-tithe-money',
      name: 'Tithe (10%)',
      value: `$${totalTitheMoney.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: '10% allocated church/charity contribution',
      icon: Percent,
      cardClass: 'bg-[#111111] border border-white/5',
      valueClass: 'text-3xl font-serif text-[#d4af37]',
      badgeClass: 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25',
    },
  ];

  // Quick info summaries
  const recentShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const overdueCars = cars.filter((c) => c.mileage >= c.nextServiceMileage);

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-serif italic text-[#e2e2e2]">Executive Overview</h1>
        <p className="mt-2 text-white/40 text-xs tracking-wide uppercase font-sans">
          Week 42 • Core Accounting & Fleet Diagnostics
        </p>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              id={stat.id}
              key={stat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-6 relative overflow-hidden rounded-none ${stat.cardClass}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#e2e2e2]/40">{stat.name}</span>
                <span className={`p-1.5 rounded-sm text-xs ${stat.badgeClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className={stat.valueClass}>
                  {stat.value}
                </h3>
                <p className="mt-1.5 text-[11px] text-[#e2e2e2]/30 leading-normal">{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Metrics / Quick View */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Driver Overview */}
        <div id="active-drivers-overview-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-4">
          <div className="flex items-center space-x-3 text-white border-b border-white/10 pb-3">
            <Users className="h-4.5 w-4.5 text-[#d4af37]" />
            <h3 className="font-serif italic text-base">Fleet Operations Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-[#080808] p-4 border border-white/5 text-center">
              <span className="block text-2xl font-serif text-[#d4af37]">{drivers.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Total Drivers</span>
            </div>
            <div className="bg-[#080808] p-4 border border-white/5 text-center">
              <span className="block text-2xl font-serif text-[#e2e2e2]">{cars.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Total Cars</span>
            </div>
          </div>
          <div className="space-y-2 mt-4 text-xs text-white/65 font-sans">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Assigned Vehicles:</span>
              <span className="font-medium text-white/90">
                {drivers.filter((d) => d.assignedCarId).length} / {drivers.length}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Outstanding Garage Debts:</span>
              <span className="font-serif text-[#d4af37]">${servicingDebt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40 font-sans">Calculated Fuel Cost:</span>
              <span className="font-medium text-[#e2e2e2]">${totalFuelCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* System Warnings/Announcements */}
        <div id="service-alerts-card" className="bg-[#111111] border border-white/5 p-6 rounded-none space-y-4 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div className="flex items-center space-x-3">
              <Car className="h-4.5 w-4.5 text-[#d4af37]" />
              <h3 className="font-serif italic text-base">Active Fleet Service Warnings</h3>
            </div>
            {overdueCars.length > 0 && (
              <span className="animate-pulse bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold tracking-widest uppercase">
                {overdueCars.length} ATTENTION REQUIRED
              </span>
            )}
          </div>

          {overdueCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center p-4">
              <div className="h-9 w-9 text-[#d4af37] bg-white/5 rounded-none flex items-center justify-center border border-white/10 mb-3">
                <span className="text-lg font-serif">✓</span>
              </div>
              <p className="text-sm text-white/80 font-sans">All vehicle service indexes healthy</p>
              <p className="text-xs text-white/40 mt-1">No outstanding mileage intervals exceeded.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-48 space-y-3 pr-1">
              {overdueCars.map((car) => {
                const limitExceededBy = car.mileage - car.nextServiceMileage;
                return (
                  <div
                    id={`alert-car-${car.id}`}
                    key={car.id}
                    className="flex justify-between items-center bg-[#1a1212] border border-red-900/30 p-4 rounded-none"
                  >
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-100">{car.name}</h4>
                      <p className="text-xs text-red-400 mt-1 font-sans">
                        Over weekly mileage threshold by{' '}
                        <strong className="font-serif italic text-sm">{limitExceededBy.toLocaleString()} km/mi</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-white/40 uppercase tracking-widest">Servicing Debt</span>
                      <span className="block text-sm text-[#d4af37] font-serif font-semibold mt-0.5">Required</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Shift Logs Table */}
      <div id="recent-activities-table" className="bg-[#111111] p-6 border border-white/5 rounded-none">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
          <h3 className="font-serif italic text-base text-white">
            Recent Shift Activity
          </h3>
          <span className="text-xs uppercase tracking-widest text-[#d4af37] cursor-pointer hover:underline font-bold">
            Audit Ledger
          </span>
        </div>
        {recentShifts.length === 0 ? (
          <p className="text-center text-white/40 text-xs py-8 font-sans">
            No shift reports logged in the current sync interval.
          </p>
        ) : (
          <div className="overflow-x-auto bg-[#0d0d0d] border border-white/5 rounded-none">
            <table className="w-full text-left text-xs text-[#e2e2e2]">
              <thead>
                <tr className="bg-white/5 text-white/60 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Vehicle / Plate</th>
                  <th className="py-3 px-4 text-right">Cashed In</th>
                  <th className="py-3 px-4 text-right">Owing</th>
                  <th className="py-3 px-4 text-right">Fuel Expense</th>
                  <th className="py-3 px-4 text-right">Tithe (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentShifts.map((log) => (
                  <tr id={`shift-${log.id}`} key={log.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="py-3 px-4 font-mono text-white/40">{log.date}</td>
                    <td className="py-3 px-4 font-sans font-bold text-white">{log.driverName}</td>
                    <td className="py-3 px-4 font-serif italic text-white/60">{log.carPlate}</td>
                    <td className="py-3 px-4 text-right font-serif text-white/90">${log.amountCashedIn.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-serif text-red-400">
                      {log.amountOwing > 0 ? `$${log.amountOwing.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="py-3 px-4 text-right font-serif text-white/50">${log.fuelCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-serif text-[#d4af37] font-medium">${log.titheMoney.toFixed(2)}</td>
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
