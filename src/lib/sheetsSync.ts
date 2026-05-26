import { Car, Driver, ShiftLog, MaintenanceLog, SpreadsheetInfo } from '../types';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper to make Google API requests
async function googleFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Google API Error on ${url}:`, errText);
    throw new Error(`Google Sheets API Error: ${res.statusText} (${res.status}). Details: ${errText}`);
  }
  return res.json();
}

/**
 * Searches for an existing "Moveus Operations Spreadsheet" in Google Drive.
 * If not found, creates a new one with appropriate sheets and headers.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<SpreadsheetInfo> {
  try {
    // 1. Search for existing sheet
    const q = encodeURIComponent("name = 'Moveus Operations Spreadsheet' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const searchUrl = `${DRIVE_FILES_URL}?q=${q}&fields=files(id,name,webViewLink)`;
    const searchResult = await googleFetch(searchUrl, accessToken);

    if (searchResult.files && searchResult.files.length > 0) {
      const file = searchResult.files[0];
      return {
        id: file.id,
        name: file.name,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      };
    }

    // 2. Setup standard template sheets
    const createBody = {
      properties: {
        title: 'Moveus Operations Spreadsheet',
      },
      sheets: [
        { properties: { title: 'Overview' } },
        { properties: { title: 'Drivers' } },
        { properties: { title: 'Cars' } },
        { properties: { title: 'Shifts' } },
        { properties: { title: 'Maintenance' } },
      ],
    };

    const newSheet = await googleFetch(SHEETS_BASE_URL, accessToken, {
      method: 'POST',
      body: JSON.stringify(createBody),
    });

    const spreadsheetId = newSheet.spreadsheetId;
    const webViewUrl = newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 3. Populate base headers
    await initializeSheetHeaders(accessToken, spreadsheetId);

    return {
      id: spreadsheetId,
      name: 'Moveus Operations Spreadsheet',
      url: webViewUrl,
    };
  } catch (error) {
    console.error('Error finding or creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Initializes table headers for the newly created spreadsheet
 */
async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const rangesData = [
    {
      range: 'Overview!A1:H10',
      values: [
        ['MOVEUS LOGISTICS DASHBOARD'],
        ['This sheet stores synchronized data from your Moveus operations app.'],
        ['Do not delete sheets, but you can view detailed data in other tabs.'],
        [],
        ['Tab Name', 'Description', 'Current Records Count'],
        ['Drivers', 'Drivers profiles, assigned cars and debt balances', '=COUNTA(Drivers!A2:A)'],
        ['Cars', 'Fleet tracking, mileages and service plans', '=COUNTA(Cars!A2:A)'],
        ['Shifts', 'Daily shift earnings, shortage (amount owing) and 10% tithes', '=COUNTA(Shifts!A2:A)'],
        ['Maintenance', 'Routine logistics garage billing and garage balances', '=COUNTA(Maintenance!A2:A)'],
      ],
    },
    {
      range: 'Drivers!A1:H1',
      values: [['id', 'name', 'licenseNumber', 'phoneNumber', 'assignedCarId', 'assignedCarPlate', 'debt', 'mileageThisWeek']],
    },
    {
      range: 'Cars!A1:G1',
      values: [['id', 'name', 'numberPlate', 'mileage', 'lastServiceMileage', 'nextServiceMileage', 'maintenanceCost']],
    },
    {
      range: 'Shifts!A1:M1',
      values: [['id', 'driverId', 'driverName', 'carId', 'carPlate', 'amountCashedIn', 'amountOwing', 'manualDebt', 'fuelCost', 'fuelLiters', 'titheMoney', 'date', 'notes']],
    },
    {
      range: 'Maintenance!A1:H1',
      values: [['id', 'carId', 'carPlate', 'cost', 'category', 'description', 'date', 'isDebt']],
    },
  ];

  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`;
  await googleFetch(url, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: rangesData,
    }),
  });
}

/**
 * Pulls all operational data from Google Sheets and parses them back to arrays of objects.
 */
export async function loadDataFromSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ drivers: Driver[]; cars: Car[]; shifts: ShiftLog[]; maintenance: MaintenanceLog[] }> {
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchGet?ranges=Drivers!A1:Z500&ranges=Cars!A1:Z500&ranges=Shifts!A1:Z1000&ranges=Maintenance!A1:Z1000`;
  const response = await googleFetch(url, accessToken);

  const ranges = response.valueRanges || [];
  
  const driversRaw = ranges[0]?.values || [];
  const carsRaw = ranges[1]?.values || [];
  const shiftsRaw = ranges[2]?.values || [];
  const maintenanceRaw = ranges[3]?.values || [];

  // Parse Drivers
  const drivers: Driver[] = [];
  if (driversRaw.length > 1) {
    const headers = driversRaw[0];
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('name');
    const licIdx = headers.indexOf('licenseNumber');
    const phoneIdx = headers.indexOf('phoneNumber');
    const carIdIdx = headers.indexOf('assignedCarId');
    const carPlateIdx = headers.indexOf('assignedCarPlate');
    const debtIdx = headers.indexOf('debt');
    const mileageIdx = headers.indexOf('mileageThisWeek');

    for (let i = 1; i < driversRaw.length; i++) {
      const row = driversRaw[i];
      if (!row[idIdx]) continue;
      drivers.push({
        id: String(row[idIdx] || ''),
        name: String(row[nameIdx] || ''),
        licenseNumber: String(row[licIdx] || ''),
        phoneNumber: String(row[phoneIdx] || ''),
        assignedCarId: String(row[carIdIdx] || ''),
        assignedCarPlate: carPlateIdx >= 0 ? String(row[carPlateIdx] || '') : '',
        debt: Number(row[debtIdx] || 0),
        mileageThisWeek: Number(row[mileageIdx] || 0),
      });
    }
  }

  // Parse Cars
  const cars: Car[] = [];
  if (carsRaw.length > 1) {
    const headers = carsRaw[0];
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('name');
    const plateIdx = headers.indexOf('numberPlate');
    const mileageIdx = headers.indexOf('mileage');
    const lastIdx = headers.indexOf('lastServiceMileage');
    const nextIdx = headers.indexOf('nextServiceMileage');
    const costIdx = headers.indexOf('maintenanceCost');

    for (let i = 1; i < carsRaw.length; i++) {
      const row = carsRaw[i];
      if (!row[idIdx]) continue;
      cars.push({
        id: String(row[idIdx] || ''),
        name: String(row[nameIdx] || ''),
        numberPlate: String(row[plateIdx] || ''),
        mileage: Number(row[mileageIdx] || 0),
        lastServiceMileage: Number(row[lastIdx] || 0),
        nextServiceMileage: Number(row[nextIdx] || 5000),
        maintenanceCost: Number(row[costIdx] || 0),
      });
    }
  }

  // Parse Shifts
  const shifts: ShiftLog[] = [];
  if (shiftsRaw.length > 1) {
    const headers = shiftsRaw[0];
    const idIdx = headers.indexOf('id');
    const dIdIdx = headers.indexOf('driverId');
    const dNameIdx = headers.indexOf('driverName');
    const cIdIdx = headers.indexOf('carId');
    const cPlateIdx = headers.indexOf('carPlate');
    const cashIdx = headers.indexOf('amountCashedIn');
    const owingIdx = headers.indexOf('amountOwing');
    const manDebtIdx = headers.indexOf('manualDebt');
    const fuelCostIdx = headers.indexOf('fuelCost');
    const fuelLitIdx = headers.indexOf('fuelLiters');
    const titheIdx = headers.indexOf('titheMoney');
    const dateIdx = headers.indexOf('date');
    const notesIdx = headers.indexOf('notes');

    for (let i = 1; i < shiftsRaw.length; i++) {
      const row = shiftsRaw[i];
      if (!row[idIdx]) continue;
      shifts.push({
        id: String(row[idIdx] || ''),
        driverId: String(row[dIdIdx] || ''),
        driverName: String(row[dNameIdx] || ''),
        carId: String(row[cIdIdx] || ''),
        carPlate: String(row[cPlateIdx] || ''),
        amountCashedIn: Number(row[cashIdx] || 0),
        amountOwing: Number(row[owingIdx] || 0),
        manualDebt: Number(row[manDebtIdx] || 0),
        fuelCost: Number(row[fuelCostIdx] || 0),
        fuelLiters: fuelLitIdx >= 0 ? Number(row[fuelLitIdx] || 0) : 0,
        titheMoney: Number(row[titheIdx] || 0),
        date: String(row[dateIdx] || ''),
        notes: notesIdx >= 0 ? String(row[notesIdx] || '') : '',
      });
    }
  }

  // Parse Maintenance Logs
  const maintenance: MaintenanceLog[] = [];
  if (maintenanceRaw.length > 1) {
    const headers = maintenanceRaw[0];
    const idIdx = headers.indexOf('id');
    const carIdIdx = headers.indexOf('carId');
    const plateIdx = headers.indexOf('carPlate');
    const costIdx = headers.indexOf('cost');
    const catIdx = headers.indexOf('category');
    const descIdx = headers.indexOf('description');
    const dateIdx = headers.indexOf('date');
    const isDebtIdx = headers.indexOf('isDebt');

    for (let i = 1; i < maintenanceRaw.length; i++) {
      const row = maintenanceRaw[i];
      if (!row[idIdx]) continue;
      maintenance.push({
        id: String(row[idIdx] || ''),
        carId: String(row[carIdIdx] || ''),
        carPlate: String(row[plateIdx] || ''),
        cost: Number(row[costIdx] || 0),
        category: String(row[catIdx] || 'General'),
        description: String(row[descIdx] || ''),
        date: String(row[dateIdx] || ''),
        isDebt: String(row[isDebtIdx] || 'false') === 'true',
      });
    }
  }

  return { drivers, cars, shifts, maintenance };
}

/**
 * Syncs the entire current memory state to Google Sheets.
 * Used to save new drivers, new cars, shifts, and maintenance costs completely.
 */
export async function syncFullDataToSheets(
  accessToken: string,
  spreadsheetId: string,
  data: { drivers: Driver[]; cars: Car[]; shifts: ShiftLog[]; maintenance: MaintenanceLog[] }
): Promise<void> {
  const driverRows = [
    ['id', 'name', 'licenseNumber', 'phoneNumber', 'assignedCarId', 'assignedCarPlate', 'debt', 'mileageThisWeek'],
    ...data.drivers.map((d) => [
      d.id,
      d.name,
      d.licenseNumber,
      d.phoneNumber,
      d.assignedCarId,
      d.assignedCarPlate || '',
      d.debt,
      d.mileageThisWeek,
    ]),
  ];

  const carRows = [
    ['id', 'name', 'numberPlate', 'mileage', 'lastServiceMileage', 'nextServiceMileage', 'maintenanceCost'],
    ...data.cars.map((c) => [
      c.id,
      c.name,
      c.numberPlate,
      c.mileage,
      c.lastServiceMileage,
      c.nextServiceMileage,
      c.maintenanceCost,
    ]),
  ];

  const shiftRows = [
    ['id', 'driverId', 'driverName', 'carId', 'carPlate', 'amountCashedIn', 'amountOwing', 'manualDebt', 'fuelCost', 'fuelLiters', 'titheMoney', 'date', 'notes'],
    ...data.shifts.map((s) => [
      s.id,
      s.driverId,
      s.driverName,
      s.carId,
      s.carPlate,
      s.amountCashedIn,
      s.amountOwing,
      s.manualDebt,
      s.fuelCost,
      s.fuelLiters || 0,
      s.titheMoney,
      s.date,
      s.notes || '',
    ]),
  ];

  const maintenanceRows = [
    ['id', 'carId', 'carPlate', 'cost', 'category', 'description', 'date', 'isDebt'],
    ...data.maintenance.map((m) => [
      m.id,
      m.carId,
      m.carPlate,
      m.cost,
      m.category,
      m.description,
      m.date,
      String(m.isDebt),
    ]),
  ];

  const rangesData = [
    { range: 'Drivers!A1:H500', values: driverRows },
    { range: 'Cars!A1:G500', values: carRows },
    { range: 'Shifts!A1:M1000', values: shiftRows },
    { range: 'Maintenance!A1:H1000', values: maintenanceRows },
  ];

  // First we clear the sheets to avoid leaving stale rows
  const clearUrl = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchClear`;
  await googleFetch(clearUrl, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      ranges: ['Drivers!A2:H500', 'Cars!A2:G500', 'Shifts!A2:M1000', 'Maintenance!A2:H1000'],
    }),
  });

  // Then write the new data starting from A1 (which overwrites headers and sets values)
  const writeUrl = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`;
  await googleFetch(writeUrl, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: rangesData,
    }),
  });
}
