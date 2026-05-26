export interface Car {
  id: string;
  name: string;
  numberPlate: string;
  mileage: number; // accumulated total mileage
  lastServiceMileage: number;
  nextServiceMileage: number; // mileage at which next service is due
  maintenanceCost: number; // total cost of operations
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  assignedCarId: string; // ID of the car assigned
  assignedCarPlate?: string; // Cache the car plate for sheets
  debt: number; // calculated from shifts and manually added debt
  mileageThisWeek: number; // weekly mileage
  fuelRequired?: number; // calculated based on weekly mileage
}

export interface ShiftLog {
  id: string;
  driverId: string;
  driverName: string;
  carId: string;
  carPlate: string;
  amountCashedIn: number;
  amountOwing: number; // shift shortfall added to driver's debt
  manualDebt: number; // secondary manual debt entered
  fuelCost: number; // fuel cost
  fuelLiters?: number; // fuel liters
  titheMoney: number; // 10% of amountCashedIn
  date: string;
  notes?: string;
}

export interface MaintenanceLog {
  id: string;
  carId: string;
  carPlate: string;
  cost: number;
  category: string; // "Oil Change", "Brakes", "Tires", "Engine", "Suspension", "General Repair", "Other"
  description: string;
  date: string;
  isDebt: boolean; // whether this cost is a service debt (owed amount)
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}
