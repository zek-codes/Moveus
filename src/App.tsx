import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  Car,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Clock,
  ExternalLink,
  Flame,
  User,
  CheckCircle,
  Database,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Driver, Car as CarType, ShiftLog, MaintenanceLog, SpreadsheetInfo } from './types';
import { initAuth, googleSignIn, logout as firebaseLogout } from './lib/firebaseAuth';
import { findOrCreateSpreadsheet, loadDataFromSheets, syncFullDataToSheets } from './lib/sheetsSync';

// Sub-components
import Dashboard from './components/Dashboard';
import ManageDrivers from './components/ManageDrivers';
import AddCar from './components/AddCar';
import NewShiftLog from './components/NewShiftLog';
import InformationPage from './components/InformationPage';

// Default professional starter templates
const INITIAL_CARS: CarType[] = [
  {
    id: 'car-1',
    name: 'Toyota Prius Hybrid',
    numberPlate: 'TX-882-C',
    mileage: 44500,
    lastServiceMileage: 40000,
    nextServiceMileage: 45000,
    maintenanceCost: 135.00,
  },
  {
    id: 'car-2',
    name: 'Tesla Model 3',
    numberPlate: 'EV-102-S',
    mileage: 12300,
    lastServiceMileage: 10000,
    nextServiceMileage: 15000,
    maintenanceCost: 85.00,
  },
];

const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'driver-1',
    name: 'Abel Tesfaye',
    licenseNumber: 'DL-H982X',
    phoneNumber: '+1 (555) 0122',
    assignedCarId: 'car-1',
    assignedCarPlate: 'TX-882-C',
    debt: 120.00,
    mileageThisWeek: 320,
    fuelRequired: 32,
  },
  {
    id: 'driver-2',
    name: 'Lana Del Rey',
    licenseNumber: 'DL-R311Y',
    phoneNumber: '+1 (555) 0399',
    assignedCarId: 'car-2',
    assignedCarPlate: 'EV-102-S',
    debt: 0.00,
    mileageThisWeek: 150,
    fuelRequired: 15,
  },
];

const INITIAL_SHIFTS: ShiftLog[] = [
  {
    id: 'shift-1',
    driverId: 'driver-1',
    driverName: 'Abel Tesfaye',
    carId: 'car-1',
    carPlate: 'TX-882-C',
    amountCashedIn: 320.00,
    amountOwing: 45.00,
    manualDebt: 20.00,
    fuelCost: 40.00,
    fuelLiters: 25,
    titheMoney: 32.00,
    date: '2026-05-25',
    notes: 'Rush hour rain shift.',
  },
  {
    id: 'shift-2',
    driverId: 'driver-2',
    driverName: 'Lana Del Rey',
    carId: 'car-2',
    carPlate: 'EV-102-S',
    amountCashedIn: 410.00,
    amountOwing: 0.00,
    manualDebt: 0.00,
    fuelCost: 15.00,
    fuelLiters: 12,
    titheMoney: 41.00,
    date: '2026-05-24',
    notes: 'Clean standard charging run.',
  },
];

const INITIAL_MAINTENANCE: MaintenanceLog[] = [
  {
    id: 'maint-1',
    carId: 'car-1',
    carPlate: 'TX-882-C',
    cost: 135.00,
    category: 'Oil Change',
    description: 'Standard synthetic oil replacement and filters change',
    date: '2026-05-10',
    isDebt: false,
  },
  {
    id: 'maint-2',
    carId: 'car-2',
    carPlate: 'EV-102-S',
    cost: 85.00,
    category: 'Tires',
    description: 'Puncture repair and tire dynamic balance test',
    date: '2026-05-20',
    isDebt: true, // Counts as outstanding garage servicing debt alert
  },
];

export default function App() {
  // Security PIN states and verification logic
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('moveus_unlocked') === 'true';
  });
  const [securityPin, setSecurityPin] = useState(() => {
    return localStorage.getItem('moveus_security_pin') || '1234';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleVerifyPin = (code: string) => {
    if (code === securityPin) {
      setIsUnlocked(true);
      sessionStorage.setItem('moveus_unlocked', 'true');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Access Denied. Incorrect Passcode.');
      setPinInput('');
    }
  };

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'cars' | 'shifts' | 'info'>('dashboard');

  // Core Operational States
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [shifts, setShifts] = useState<ShiftLog[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);

  // Google Integration / Auth States
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // UTC clock state
  const [currentTime, setCurrentTime] = useState('2026-05-26 15:15:00 UTC');

  // Initialize clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      setCurrentTime(utcString);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Load baseline state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedDrivers = localStorage.getItem('moveus_drivers');
      const savedCars = localStorage.getItem('moveus_cars');
      const savedShifts = localStorage.getItem('moveus_shifts');
      const savedMaint = localStorage.getItem('moveus_maintenance');
      const savedSpreadsheet = localStorage.getItem('moveus_spreadsheet');

      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
      else setDrivers(INITIAL_DRIVERS);

      if (savedCars) setCars(JSON.parse(savedCars));
      else setCars(INITIAL_CARS);

      if (savedShifts) setShifts(JSON.parse(savedShifts));
      else setShifts(INITIAL_SHIFTS);

      if (savedMaint) setMaintenance(JSON.parse(savedMaint));
      else setMaintenance(INITIAL_MAINTENANCE);

      if (savedSpreadsheet) setSpreadsheet(JSON.parse(savedSpreadsheet));
    } catch (e) {
      console.error('Failed to restore local operational indices:', e);
    } finally {
      setIsLoading(false);
    }

    // 2. Initialize Firebase Auth State trigger listener
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAuthChecking(false);
        // Automatically attempt to locate or sync if we have credentials
        triggerSyncInit(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthChecking(false);
      }
    );
  }, []);

  // 3. Keep LocalStorage synchronized with memory states
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('moveus_drivers', JSON.stringify(drivers));
  }, [drivers, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('moveus_cars', JSON.stringify(cars));
  }, [cars, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('moveus_shifts', JSON.stringify(shifts));
  }, [shifts, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('moveus_maintenance', JSON.stringify(maintenance));
  }, [maintenance, isLoading]);

  useEffect(() => {
    if (spreadsheet) {
      localStorage.setItem('moveus_spreadsheet', JSON.stringify(spreadsheet));
    } else {
      localStorage.removeItem('moveus_spreadsheet');
    }
  }, [spreadsheet]);

  // Sync Logic: Setup Spreadsheet & Load remote content
  const triggerSyncInit = async (accessToken: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const sheetInfo = await findOrCreateSpreadsheet(accessToken);
      setSpreadsheet(sheetInfo);

      // Fetch existing sheet entries
      const remoteData = await loadDataFromSheets(accessToken, sheetInfo.id);

      // Merge / overwrite logic
      // To provide smooth zero-conflict operations:
      // If sheets are fresh (have no entries), we write our current memory state.
      // If sheets have rows, we adopt the sheets as the master record.
      if (remoteData.drivers.length === 0 && remoteData.cars.length === 0) {
        await syncFullDataToSheets(accessToken, sheetInfo.id, {
          drivers,
          cars,
          shifts,
          maintenance,
        });
      } else {
        if (remoteData.drivers.length > 0) setDrivers(remoteData.drivers);
        if (remoteData.cars.length > 0) setCars(remoteData.cars);
        if (remoteData.shifts.length > 0) setShifts(remoteData.shifts);
        if (remoteData.maintenance.length > 0) setMaintenance(remoteData.maintenance);
      }
    } catch (err: any) {
      console.error('Failed to sync to Google Sheets:', err);
      setSyncError(err?.message || 'Failed to establish connection to Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Triggers Google sign-in workflow
  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await triggerSyncInit(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login process halted:', err);
      setSyncError(err?.message || 'Authorization failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    if (window.confirm('Disconnect and log out of Google Sheets sync? Operational data will remain stored in local storage safe.')) {
      await firebaseLogout();
      setUser(null);
      setToken(null);
      setSpreadsheet(null);
    }
  };

  // Sync state to Google Sheets immediately if connected
  const pushUpdateToSheets = async (
    nextDrivers: Driver[],
    nextCars: CarType[],
    nextShifts: ShiftLog[],
    nextMaint: MaintenanceLog[]
  ) => {
    if (!token || !spreadsheet) return;
    setIsSyncing(true);
    try {
      await syncFullDataToSheets(token, spreadsheet.id, {
        drivers: nextDrivers,
        cars: nextCars,
        shifts: nextShifts,
        maintenance: nextMaint,
      });
    } catch (err: any) {
      console.error('Failed background sync to sheets:', err);
      setSyncError('Background sync failed. Offline mode active.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Trigger Force Sync Button
  const handleForceSync = async () => {
    if (!token) {
      await handleGoogleSignIn();
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncFullDataToSheets(token, spreadsheet!.id, {
        drivers,
        cars,
        shifts,
        maintenance,
      });
      // reload
      const remoteData = await loadDataFromSheets(token, spreadsheet!.id);
      if (remoteData.drivers.length > 0) setDrivers(remoteData.drivers);
      if (remoteData.cars.length > 0) setCars(remoteData.cars);
      if (remoteData.shifts.length > 0) setShifts(remoteData.shifts);
      if (remoteData.maintenance.length > 0) setMaintenance(remoteData.maintenance);
    } catch (err: any) {
      setSyncError(err?.message || 'Sync operation failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- MODEL ACTIONS HANDLERS ---

  // Onboard driver
  const handleAddDriver = (newDriver: Omit<Driver, 'id' | 'debt' | 'mileageThisWeek'>) => {
    const fresh: Driver = {
      ...newDriver,
      id: `driver-${Date.now()}`,
      debt: 0,
      mileageThisWeek: 0,
    };
    // Fetch assigned plate
    const assigned = cars.find((c) => c.id === newDriver.assignedCarId);
    if (assigned) {
      fresh.assignedCarPlate = assigned.numberPlate;
    }

    const updated = [...drivers, fresh];
    setDrivers(updated);
    pushUpdateToSheets(updated, cars, shifts, maintenance);
  };

  // Defund/offboard driver
  const handleDeleteDriver = (id: string) => {
    const updated = drivers.filter((d) => d.id !== id);
    setDrivers(updated);
    pushUpdateToSheets(updated, cars, shifts, maintenance);
  };

  // Assign car to driver
  const handleAssignCar = (driverId: string, carId: string) => {
    const car = cars.find((c) => c.id === carId);
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        return {
          ...d,
          assignedCarId: carId,
          assignedCarPlate: car ? car.numberPlate : '',
        };
      }
      return d;
    });
    setDrivers(updated);
    pushUpdateToSheets(updated, cars, shifts, maintenance);
  };

  // Add registered car
  const handleAddCar = (newCar: Omit<CarType, 'id' | 'maintenanceCost'>) => {
    const fresh: CarType = {
      ...newCar,
      id: `car-${Date.now()}`,
      maintenanceCost: 0,
    };
    const updated = [...cars, fresh];
    setCars(updated);
    pushUpdateToSheets(drivers, updated, shifts, maintenance);
  };

  // De-commission car
  const handleDeleteCar = (id: string) => {
    const updatedCars = cars.filter((c) => c.id !== id);
    const updatedDrivers = drivers.map((d) => {
      if (d.assignedCarId === id) {
        return { ...d, assignedCarId: '', assignedCarPlate: '' };
      }
      return d;
    });

    setCars(updatedCars);
    setDrivers(updatedDrivers);
    pushUpdateToSheets(updatedDrivers, updatedCars, shifts, maintenance);
  };

  // Manual fast edit vehicle mileage meter
  const handleUpdateCarMileage = (carId: string, nextMileage: number) => {
    const updated = cars.map((c) => {
      if (c.id === carId) {
        return { ...c, mileage: nextMileage };
      }
      return c;
    });
    setCars(updated);
    pushUpdateToSheets(drivers, updated, shifts, maintenance);
  };

  // Input weekly mileage driver (and auto calculation)
  const handleUpdateDriverMileage = (driverId: string, mileage: number) => {
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        return {
          ...d,
          mileageThisWeek: mileage,
          fuelRequired: mileage / 10, // estimated base calculation
        };
      }
      return d;
    });
    setDrivers(updated);
    pushUpdateToSheets(updated, cars, shifts, maintenance);
  };

  // Submit Shift audit log (and process calculations)
  const handleAddShiftLog = (newLog: Omit<ShiftLog, 'id' | 'titheMoney'>) => {
    const tithe = newLog.amountCashedIn * 0.1;
    const freshShift: ShiftLog = {
      ...newLog,
      id: `shift-${Date.now()}`,
      titheMoney: tithe,
    };

    const updatedShifts = [...shifts, freshShift];

    // Auto-update linked driver parameters
    // Newly generated debt (Owing amount + Manual Debt) adds directly to driver total debt
    const debtImpact = newLog.amountOwing + newLog.manualDebt;
    const updatedDrivers = drivers.map((d) => {
      if (d.id === newLog.driverId) {
        return {
          ...d,
          debt: d.debt + debtImpact,
        };
      }
      return d;
    });

    // Auto-increment linked vehicle mileage
    // Let's assume a shift generates standard mileage increment based on driver's week scale or defaults,
    // or let vehicle keep current set mileage. (Let's keep current set mileage edit-reliant, or add a standard estimate)
    const updatedCars = [...cars];

    setShifts(updatedShifts);
    setDrivers(updatedDrivers);
    pushUpdateToSheets(updatedDrivers, updatedCars, updatedShifts, maintenance);
  };

  // Add recorded Maintenance item
  const handleAddMaintenanceLog = (maintObj: Omit<MaintenanceLog, 'id'>) => {
    const freshM: MaintenanceLog = {
      ...maintObj,
      id: `maint-${Date.now()}`,
    };

    const updatedMaintenance = [...maintenance, freshM];

    // Accumulate overall diagnostic costs to vehicle
    const updatedCars = cars.map((c) => {
      if (c.id === maintObj.carId) {
        return {
          ...c,
          maintenanceCost: c.maintenanceCost + maintObj.cost,
          // Set last service milestone if category matches Oil / General Service
          lastServiceMileage:
            maintObj.category === 'Oil Change' || maintObj.category === 'General Repair'
              ? c.mileage
              : c.lastServiceMileage,
          // Increment service interval limit by 5000 from current mileage
          nextServiceMileage:
            maintObj.category === 'Oil Change' || maintObj.category === 'General Repair'
              ? c.mileage + 5000
              : c.nextServiceMileage,
        };
      }
      return c;
    });

    setMaintenance(updatedMaintenance);
    setCars(updatedCars);
    pushUpdateToSheets(drivers, updatedCars, shifts, updatedMaintenance);
  };

  const handleChangePin = (newPin: string) => {
    if (/^\d{4}$/.test(newPin)) {
      setSecurityPin(newPin);
      localStorage.setItem('moveus_security_pin', newPin);
      return true;
    }
    return false;
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e2e2e2] flex flex-col items-center justify-center p-6 selection:bg-[#d4af37]/20 selection:text-[#d4af37]">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#111111] border border-white/5 p-8 rounded-none shadow-2xl relative text-center space-y-6"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center space-y-3">
            <div className="h-11 w-11 bg-[#d4af37] flex items-center justify-center border border-[#b2922e] shadow-lg shadow-[#d4af37]/10">
              <Lock className="h-5 w-5 text-black shrink-0" />
            </div>
            <div>
              <h1 className="text-xl font-serif text-white font-bold tracking-wider uppercase">
                Moveus
              </h1>
              <p className="text-[9px] bg-yellow-950/20 border border-[#d4af37]/30 font-mono text-[#d4af37] px-2 py-0.5 rounded-none font-bold inline-block mt-1">
                SECURE OPERATIONS LOGISTICS
              </p>
            </div>
          </div>

          {/* Input Block */}
          <div className="space-y-4">
            <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono">
              Enter 4-Digit Security PIN
            </p>

            {/* 4 dots display */}
            <div className="flex justify-center items-center space-x-4 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinInput.length > index;
                return (
                  <div
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full border border-white/10 transition-all duration-150 ${
                      isFilled ? 'bg-[#d4af37] scale-110 shadow-sm shadow-[#d4af37]/50' : 'bg-[#050505]'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-405 text-[11px] font-sans bg-red-500/10 border border-red-500/20 px-3 py-1.5 inline-block text-red-400"
              >
                {pinError}
              </motion.div>
            )}

            {/* Hidden real input field for typing support */}
            <input
              id="security-pin-input-field"
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 4) {
                  setPinInput(val);
                  if (val.length === 4) {
                    handleVerifyPin(val);
                  }
                }
              }}
              autoFocus
              className="absolute inset-x-0 bottom-0 top-0 h-full w-full opacity-0 cursor-default"
            />
          </div>

          {/* Virtual Pin Pad Layout */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (pinInput.length < 4) {
                    const newVal = pinInput + num;
                    setPinInput(newVal);
                    if (newVal.length === 4) {
                      handleVerifyPin(newVal);
                    }
                  }
                }}
                className="h-11 w-11 mx-auto flex items-center justify-center bg-[#050505] border border-white/5 text-xs font-mono hover:bg-white/5 hover:border-[#d4af37]/20 active:scale-95 transition text-[#e2e2e2]"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setPinInput('');
                setPinError('');
              }}
              className="h-11 w-11 mx-auto flex items-center justify-center bg-[#050505]/40 border border-white/5 text-[9px] font-sans hover:bg-white/5 hover:text-red-400 active:scale-95 transition"
            >
              CLEAR
            </button>
            <button
              onClick={() => {
                if (pinInput.length < 4) {
                  const newVal = pinInput + '0';
                  setPinInput(newVal);
                  if (newVal.length === 4) {
                    handleVerifyPin(newVal);
                  }
                }
              }}
              className="h-11 w-11 mx-auto flex items-center justify-center bg-[#050505] border border-white/5 text-xs font-mono hover:bg-white/5 hover:border-[#d4af37]/20 active:scale-95 transition text-[#e2e2e2]"
            >
              0
            </button>
            <button
              onClick={() => {
                if (pinInput.length > 0) {
                  setPinInput(pinInput.slice(0, -1));
                }
              }}
              className="h-11 w-11 mx-auto flex items-center justify-center bg-[#050505]/40 border border-white/5 text-xs font-mono hover:bg-white/5 active:scale-95 transition font-bold"
            >
              ←
            </button>
          </div>

          {/* Default code hint info */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/30 tracking-widest font-mono uppercase">
              DEFAULT SYSTEM ACCESS PIN: <span className="text-[#d4af37] font-bold">1234</span>
            </p>
          </div>
        </motion.div>
        <div className="text-[9px] text-white/20 tracking-widest uppercase font-mono mt-8">
          PROT-ID: 715997745179 // MOVEUS SYSTEM SHIELD LOCK
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e2e2] font-sans flex flex-col selection:bg-[#d4af37]/20 selection:text-[#d4af37]">
      {/* Top Header Panel */}
      <header className="border-b border-white/5 bg-[#080808] sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Brand Logo & Clock */}
          <div className="flex items-center space-x-3.5">
            <div className="h-9 w-9 shrink-0 bg-[#d4af37] flex items-center justify-center border border-[#b2922e]">
              <Flame className="h-4.5 w-4.5 text-black shrink-0 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-serif tracking-wider uppercase text-white font-bold">
                  Moveus
                </span>
                <span className="text-[9px] bg-yellow-950/20 border border-[#d4af37]/30 font-mono text-[#d4af37] px-1.5 py-0.2 rounded-none font-bold">
                  OPERATIONS
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">
                <Clock className="h-3 w-3 text-white/20" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Google Sheets Connexion Status */}
          <div className="flex flex-wrap items-center gap-3">
            <AnimatePresence mode="wait">
              {token ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center space-x-3 bg-[#111111] border border-white/5 rounded-none px-4 py-2 text-xs text-[#e2e2e2] h-9"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-none h-2 w-2 bg-[#d4af37]"></span>
                  </span>
                  <div>
                    <span className="text-[#d4af37] font-semibold font-serif italic block">Sheets Synced</span>
                    {spreadsheet && (
                      <a
                        href={spreadsheet.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/30 hover:text-white transition flex items-center space-x-1 text-[9px] mt-0.5 uppercase tracking-widest decoration-dotted"
                      >
                        <span>Open sheet</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  <button
                    id="btn-disconnect-sheets"
                    onClick={handleSignOut}
                    className="cursor-pointer text-white/30 hover:text-red-400 transition pl-2 border-l border-white/5 ml-1"
                    title="Disconnect Google Sheets"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleGoogleSignIn}
                  className="cursor-pointer bg-[#d4af37] hover:bg-[#c19d2f] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition flex items-center space-x-2 rounded-none h-9 hover:scale-[1.01] active:scale-98"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 fill-current" />
                  <span>Connect Google Sheets</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button
              id="btn-trigger-manual-sync"
              onClick={handleForceSync}
              disabled={isSyncing}
              className={`cursor-pointer border border-white/10 bg-white/5 h-9 w-9 rounded-none hover:bg-white/10 text-white/70 disabled:opacity-50 flex items-center justify-center transition`}
              title="Force Sync / Reload"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="btn-lock-system"
              onClick={() => {
                setIsUnlocked(false);
                sessionStorage.removeItem('moveus_unlocked');
              }}
              className="cursor-pointer border border-white/10 bg-white/5 h-9 w-9 rounded-none hover:bg-red-950/20 hover:border-red-500/30 text-white/70 hover:text-red-400 flex items-center justify-center transition"
              title="Lock System Console"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Rail left */}
        <nav className="w-full md:w-64 shrink-0 flex flex-col space-y-1 bg-[#111111] p-3 rounded-none border border-white/5 h-fit shadow-sm">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/30 px-3 pb-2 mb-2 block border-b border-white/5 font-mono">
            Navigation Ledger
          </span>
          {[
            { id: 'dashboard', name: 'Dashboard Analytics', icon: LayoutDashboard },
            { id: 'drivers', name: 'Manage Drivers', icon: Users },
            { id: 'cars', name: 'Add/Manage Cars', icon: Car },
            { id: 'shifts', name: 'New Shift Log', icon: Receipt },
            { id: 'info', name: 'Fleet Health & Info', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                id={`rail-tab-${item.id}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSyncError(null);
                }}
                className={`cursor-pointer flex items-center space-x-3 rounded-none px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  isSelected
                     ? 'bg-[#d4af37] text-black font-extrabold shadow-sm'
                     : 'text-white/40 hover:text-[#e2e2e2] hover:bg-white/5'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-black' : 'text-[#d4af37]'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="pt-8 mt-8 border-t border-white/5 text-[9px] text-white/30 uppercase tracking-widest space-y-2 px-3 font-mono">
            <span className="block font-bold">Logistics Database:</span>
            <div className="flex items-center space-x-1.5 text-white/50">
              <Database className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>{token ? 'Google Drive Cloud' : 'Local Storage Sandbox'}</span>
            </div>
            {isSyncing && <span className="text-[#d4af37] font-serif italic block animate-pulse">Sync loop active...</span>}
          </div>
        </nav>

        {/* Dynamic Display Area */}
        <main className="flex-1 bg-[#050505]">
          {syncError && (
            <div id="top-sync-error" className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-none flex items-start space-x-3 text-xs font-sans">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <span className="font-bold block">Google Sync Pipeline Interrupted</span>
                <span className="mt-0.5 block opacity-85 text-[11px]">{syncError}</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  drivers={drivers}
                  cars={cars}
                  shifts={shifts}
                  maintenance={maintenance}
                />
              )}

              {activeTab === 'drivers' && (
                <ManageDrivers
                  drivers={drivers}
                  cars={cars}
                  onAddDriver={handleAddDriver}
                  onDeleteDriver={handleDeleteDriver}
                  onAssignCar={handleAssignCar}
                />
              )}

              {activeTab === 'cars' && (
                <AddCar
                  cars={cars}
                  onAddCar={handleAddCar}
                  onDeleteCar={handleDeleteCar}
                  onUpdateCarMileage={handleUpdateCarMileage}
                />
              )}

              {activeTab === 'shifts' && (
                <NewShiftLog
                  drivers={drivers}
                  cars={cars}
                  shifts={shifts}
                  onAddShiftLog={handleAddShiftLog}
                />
              )}

              {activeTab === 'info' && (
                <InformationPage
                  drivers={drivers}
                  cars={cars}
                  maintenance={maintenance}
                  onUpdateDriverMileage={handleUpdateDriverMileage}
                  onAddMaintenance={handleAddMaintenanceLog}
                  securityPin={securityPin}
                  onChangePin={handleChangePin}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080808]/40 text-center py-6 text-[10px] text-white/20 tracking-widest uppercase font-mono mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <span>Moveus Logistics Platform v1.2</span>
          <span>Designed with Sophisticated Dark visual aesthetics</span>
        </div>
      </footer>
    </div>
  );
}

