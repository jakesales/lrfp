export const DEMO_PROPERTY = {
  titleRef: 'PROP-DEMO-001',
  postcode: 'EC2V 7HN',
  propertyNumber: '25',
  street: 'Moorgate',
  city: 'London',
  tenancyStatus: 'Let',
  startDate: '2024-04-01',
  monthlyRent: '1850',
  mortgageProvider: 'Lloyds Bank',
  productType: 'Buy-to-Let Fixed',
  mortgageEndDate: '2029-04-01',
  mortgageBalance: '312500',
  paymentType: 'Repayment',
  monthlyPayments: '1045',
};

export const DEMO_PROPERTY_REQUIRED = {
  titleRef: 'PROP-DEMO-001',
  postcode: 'EC2V 7HN',
  propertyNumber: '25',
  street: 'Moorgate',
  city: 'London',
};

export const DEMO_MANUAL_PERFECT = {
  titleRef: 'PROP-001',
  postcode: 'EC2V 7HN',
  propertyNumber: '25',
  street: 'Moorgate',
  city: 'London',
  addressId: 'ec2v-25',
};

export const DEMO_MANUAL_IMPERFECT = {
  titleRef: '',
  postcode: 'EC2V 7HN',
  propertyNumber: '25',
  street: 'Morgate',
  city: 'London',
  addressId: '',
};

/** Registered addresses for postcode lookup (demo). Includes AVM outputs. */
export const ADDRESS_LOOKUP = [
  { id: 'ec2v-25', postcode: 'EC2V 7HN', propertyNumber: '25', street: 'Moorgate', city: 'London', avmValue: 612000, marketRent: 2450, occupancy: 'Rented' },
  { id: 'ec2v-27', postcode: 'EC2V 7HN', propertyNumber: '27', street: 'Moorgate', city: 'London', avmValue: 585000, marketRent: 2380, occupancy: 'Rented' },
  { id: 'ec2v-1', postcode: 'EC2V 7HN', propertyNumber: '1', street: "Prince's Court", city: 'London', avmValue: 720000, marketRent: 2650, occupancy: 'Rented' },
  { id: 'm1-12', postcode: 'M1 4BT', propertyNumber: '12', street: 'Deansgate', city: 'Manchester', avmValue: 285000, marketRent: 1450, occupancy: 'Rented' },
  { id: 'm1-45', postcode: 'M1 4BT', propertyNumber: '45', street: 'Deansgate', city: 'Manchester', avmValue: 310000, marketRent: 1520, occupancy: 'Vacant' },
  { id: 'bs1-14', postcode: 'BS1 4DJ', propertyNumber: '14', street: 'Harbour View', city: 'Bristol', avmValue: 335000, marketRent: 1380, occupancy: 'Vacant' },
  { id: 'bs1-2', postcode: 'BS1 4DJ', propertyNumber: '2', street: 'Queen Square', city: 'Bristol', avmValue: 420000, marketRent: 1650, occupancy: 'Rented' },
  { id: 'eh3-8', postcode: 'EH3 9AA', propertyNumber: '8', street: 'Royal Terrace', city: 'Edinburgh', avmValue: 395000, marketRent: 1580, occupancy: 'Rented' },
  { id: 'ls1-3', postcode: 'LS1 4DY', propertyNumber: '3', street: 'The Calls', city: 'Leeds', avmValue: 248000, marketRent: 1120, occupancy: 'Vacant' },
];

export function normalizePostcode(postcode) {
  return String(postcode || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

export function searchAddressesByPostcode(postcode) {
  const normalized = normalizePostcode(postcode);
  if (normalized.length < 3) return [];
  const compact = normalized.replace(/\s/g, '');
  return ADDRESS_LOOKUP.filter((entry) => {
    const entryCompact = entry.postcode.replace(/\s/g, '');
    return entryCompact.startsWith(compact) || entry.postcode.startsWith(normalized);
  });
}

export function findRegisteredAddress(property) {
  const postcode = normalizePostcode(property.postcode);
  return ADDRESS_LOOKUP.find(
    (entry) =>
      normalizePostcode(entry.postcode) === postcode
      && entry.propertyNumber === String(property.propertyNumber || '').trim()
      && entry.street.toLowerCase() === String(property.street || '').trim().toLowerCase()
      && entry.city.toLowerCase() === String(property.city || '').trim().toLowerCase(),
  );
}

export function validateProperty(property) {
  const errors = {};

  REQUIRED_FIELDS.forEach((field) => {
    if (!String(property[field] || '').trim()) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  });

  if (property.postcode && !errors.postcode) {
    const matches = searchAddressesByPostcode(property.postcode);
    if (!matches.length) {
      errors.postcode = 'Postcode not recognised — check and try again';
    }
  }

  if (!errors.postcode && !errors.propertyNumber && !errors.street && !errors.city) {
    const registered = findRegisteredAddress(property);
    if (!registered) {
      errors.street = 'Address does not match our records for this postcode';
      errors.city = 'City does not match our records for this postcode';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Attach platform AVM outputs when a property is added to a portfolio. */
export function enrichPropertyWithAvm(property) {
  const registered = findRegisteredAddress(property);
  const enriched = {
    ...property,
    rentAgreed: property.rentAgreed ?? '',
    purchasePrice: property.purchasePrice ?? '',
    monthlyPayments: property.monthlyPayments ?? '',
    interestRate: property.interestRate ?? '',
    mortgageProvider: property.mortgageProvider ?? '',
    mortgageEndDate: property.mortgageEndDate ?? '',
    mortgageBalance: property.mortgageBalance ?? '',
    occupancy: property.occupancy ?? '',
  };

  if (registered) {
    enriched.avmValue = registered.avmValue;
    enriched.marketRent = registered.marketRent;
    if (registered.occupancy) enriched.occupancy = registered.occupancy;
  } else if (!enriched.avmValue) {
    const seed = `${property.postcode || ''}${property.propertyNumber || ''}`.length;
    enriched.avmValue = 200000 + seed * 15000;
    enriched.marketRent = 950 + seed * 40;
  }

  if (!enriched.occupancy && property.tenancyStatus) {
    enriched.occupancy = property.tenancyStatus === 'Let' ? 'Rented' : property.tenancyStatus;
  }

  return enriched;
}

export function enrichProperties(properties) {
  return properties.map(enrichPropertyWithAvm);
}

export const DEMO_PROPERTIES = [
  {
    titleRef: 'PROP-DEMO-001',
    postcode: 'EC2V 7HN',
    propertyNumber: '25',
    street: 'Moorgate',
    city: 'London',
    tenancyStatus: 'Let',
    startDate: '2024-04-01',
    monthlyRent: '1850',
    mortgageProvider: 'Lloyds Bank',
    productType: 'Buy-to-Let Fixed',
    mortgageEndDate: '2029-04-01',
    mortgageBalance: '312500',
    paymentType: 'Repayment',
    monthlyPayments: '1045',
  },
  {
    titleRef: 'PROP-DEMO-002',
    postcode: 'M1 4BT',
    propertyNumber: '12',
    street: 'Deansgate',
    city: 'Manchester',
    tenancyStatus: 'Vacant',
    startDate: '',
    monthlyRent: '',
    mortgageProvider: 'Halifax',
    productType: 'Tracker',
    mortgageEndDate: '2027-11-15',
    mortgageBalance: '228000',
    paymentType: 'Interest only',
    monthlyPayments: '580',
  },
];

export const FIELD_LABELS = {
  titleRef: 'Title / Ref',
  postcode: 'Postcode',
  propertyNumber: 'Property number',
  street: 'Street',
  city: 'City',
  tenancyStatus: 'Tenancy status',
  startDate: 'Start date',
  monthlyRent: 'Monthly rent (£)',
  mortgageProvider: 'Mortgage provider',
  productType: 'Product type',
  mortgageEndDate: 'Mortgage end date',
  mortgageBalance: 'Mortgage balance (£)',
  paymentType: 'Payment type',
  monthlyPayments: 'Monthly payments (£)',
};

export const REQUIRED_FIELDS = [
  'titleRef',
  'postcode',
  'propertyNumber',
  'street',
  'city',
];

export const OPTIONAL_FIELDS = [
  'tenancyStatus',
  'startDate',
  'monthlyRent',
  'mortgageProvider',
  'productType',
  'mortgageEndDate',
  'mortgageBalance',
  'paymentType',
  'monthlyPayments',
];

export const CSV_HEADERS = [
  'Title/Ref',
  'Postcode',
  'Property number',
  'Street',
  'City',
  'Tenancy status',
  'Start date',
  'Monthly rent',
  'Mortgage provider',
  'Product type',
  'Mortgage end date',
  'Mortgage balance',
  'Payment type',
  'Monthly payments',
];

const CSV_TO_KEY = {
  'Title/Ref': 'titleRef',
  Postcode: 'postcode',
  'Property number': 'propertyNumber',
  Street: 'street',
  City: 'city',
  'Tenancy status': 'tenancyStatus',
  'Start date': 'startDate',
  'Monthly rent': 'monthlyRent',
  'Mortgage provider': 'mortgageProvider',
  'Product type': 'productType',
  'Mortgage end date': 'mortgageEndDate',
  'Mortgage balance': 'mortgageBalance',
  'Payment type': 'paymentType',
  'Monthly payments': 'monthlyPayments',
};

export function parseCsv(text) {
  return parseCsvDetailed(text).validProperties;
}

export function parseCsvDetailed(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], validProperties: [], validCount: 0, invalidCount: 0 };
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(',').map((v) => v.trim());
    const property = {};
    headers.forEach((header, index) => {
      const key = CSV_TO_KEY[header];
      if (key) property[key] = values[index] || '';
    });

    const { valid, errors } = validateProperty(property);
    rows.push({
      line: i + 1,
      property,
      valid,
      errors,
      summary: valid ? 'Valid' : Object.values(errors).join('; '),
    });
  }

  const validProperties = rows.filter((row) => row.valid).map((row) => enrichPropertyWithAvm(row.property));

  return {
    rows,
    validProperties,
    validCount: validProperties.length,
    invalidCount: rows.length - validProperties.length,
  };
}

export function formatAddress(property) {
  return `${property.propertyNumber} ${property.street}, ${property.city}, ${property.postcode}`;
}

export function getMarketRentRange(property) {
  const marketRent = Number(property.marketRent) || 0;
  if (!marketRent) return null;
  const seed = `${property.postcode || ''}${property.propertyNumber || ''}`.length;
  return {
    low: Math.round(marketRent * (0.88 + (seed % 3) * 0.02)),
    high: Math.round(marketRent * (1.08 + (seed % 4) * 0.02)),
  };
}

/** Derived financial metrics — landlord inputs recalculate dependent fields. */
export function computePropertyFinancials(property) {
  const currentValue = Number(property.avmValue) || 0;
  const purchasePrice = Number(String(property.purchasePrice).replace(/[^0-9.]/g, '')) || 0;
  const remainingMortgage = Number(String(property.mortgageBalance).replace(/[^0-9.]/g, '')) || 0;
  const interestRate = Number(String(property.interestRate).replace(/[^0-9.]/g, '')) || 0;
  const bank = String(property.mortgageProvider || '').trim();
  const rentAgreed = Number(String(property.rentAgreed).replace(/[^0-9.]/g, '')) || 0;
  const marketRentRange = getMarketRentRange(property);

  const valueChange = purchasePrice > 0 && currentValue > 0 ? currentValue - purchasePrice : null;
  const valueChangePct = purchasePrice > 0 && valueChange != null
    ? (valueChange / purchasePrice) * 100
    : null;
  const ltv = currentValue > 0 && remainingMortgage > 0
    ? (remainingMortgage / currentValue) * 100
    : null;

  let indicativeRefinanceRate = null;
  let monthlySavings = null;
  if (interestRate > 0) {
    indicativeRefinanceRate = Math.max(0.5, Math.round((interestRate - 0.3) * 100) / 100);
    if (remainingMortgage > 0 && indicativeRefinanceRate < interestRate) {
      monthlySavings = Math.round(
        remainingMortgage * ((interestRate - indicativeRefinanceRate) / 100 / 12),
      );
    }
  }

  return {
    currentValue,
    purchasePrice,
    remainingMortgage,
    interestRate,
    bank,
    mortgageExpiry: property.mortgageEndDate || '',
    marketRentRange,
    rentAgreed,
    valueChange,
    valueChangePct,
    ltv,
    indicativeRefinanceRate,
    monthlySavings,
    hasPurchasePrice: purchasePrice > 0,
    hasCurrentValue: purchasePrice > 0 && currentValue > 0,
    hasValueChange: purchasePrice > 0 && currentValue > 0 && valueChange != null,
    hasRemainingMortgage: remainingMortgage > 0,
    hasInterestRate: interestRate > 0,
    hasBank: bank.length > 0,
    hasMortgageExpiry: !!String(property.mortgageEndDate || '').trim(),
    hasMarketRent: marketRentRange != null,
    hasRentAgreed: rentAgreed > 0,
    hasLtv: currentValue > 0 && remainingMortgage > 0 && ltv != null,
    hasIndicativeRefinance: interestRate > 0 && indicativeRefinanceRate != null,
  };
}

export function formatMortgageExpiry(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{2}\/\d{4}$/.test(str)) return str;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}/${date.getFullYear()}`;
}

/** Demo financials for a property — derived from AVM for consistent storytelling. */
export function getDemoFinancials(property) {
  const avm = Number(property.avmValue) || 400000;
  const seed = `${property.postcode || ''}${property.propertyNumber || ''}`.length;
  const purchasePrice = Math.round(avm * (0.72 + (seed % 5) * 0.02));
  const remainingMortgage = Math.round(purchasePrice * (0.55 + (seed % 4) * 0.05));
  const interestRate = (3.2 + (seed % 4) * 0.1).toFixed(1);
  const banks = ['Barclays', 'Lloyds Bank', 'Halifax', 'NatWest'];
  const bank = banks[seed % banks.length];
  const expiryYear = 2026 + (seed % 3);
  const expiryMonth = String(6 + (seed % 6)).padStart(2, '0');
  const marketRent = Number(property.marketRent) || 1400;
  const rentAgreed = Math.round(marketRent * (0.92 + (seed % 5) * 0.02));

  return {
    purchasePrice: String(purchasePrice),
    remainingMortgage: String(remainingMortgage),
    interestRate,
    bank,
    mortgageExpiry: `${expiryYear}-${expiryMonth}`,
    rentAgreed: String(rentAgreed),
  };
}

/** Sync financials edit to portfolio line items (monthly payment estimate). */
export function applyFinancialsToProperty(property) {
  const remaining = Number(String(property.mortgageBalance).replace(/[^0-9.]/g, '')) || 0;
  const rate = Number(String(property.interestRate).replace(/[^0-9.]/g, '')) || 0;

  if (remaining > 0 && rate > 0) {
    property.monthlyPayments = String(Math.round(remaining * (rate / 100 / 12)));
  }

  return property;
}

export function hasDisplayValue(value) {
  if (value == null || value === '') return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  return String(value).trim() !== '';
}

export function formatCurrency(value) {
  const num = Number(String(value).replace(/[^0-9.]/g, ''));
  if (!num) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatInterestRate(value) {
  const num = Number(String(value).replace(/[^0-9.]/g, ''));
  if (!num) return null;
  return `${num.toFixed(2)}%`;
}

export function formatPercent(value, decimals = 1) {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatRatio(value) {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}x`;
}

/** Portfolio metrics use AVM outputs attached at import time. */
export function computePortfolioMetrics(properties) {
  const enriched = enrichProperties(properties);
  const count = enriched.length;
  let totalPortfolioValue = 0;
  let totalMarketRent = 0;
  let totalRentAgreed = 0;
  let hasRentAgreed = false;
  let totalDebt = 0;
  let totalMortgage = 0;

  enriched.forEach((property) => {
    totalPortfolioValue += Number(property.avmValue) || 0;
    totalMarketRent += Number(property.marketRent) || 0;
    const agreed = Number(property.rentAgreed) || 0;
    if (agreed > 0) {
      hasRentAgreed = true;
      totalRentAgreed += agreed;
    }
    totalDebt += Number(property.mortgageBalance) || 0;
    totalMortgage += Number(property.monthlyPayments) || 0;
  });

  const totalEquity = totalPortfolioValue - totalDebt;
  const annualMarketRent = totalMarketRent * 12;
  const grossYield = totalPortfolioValue > 0 ? (annualMarketRent / totalPortfolioValue) * 100 : null;
  const incomeForIcr = hasRentAgreed ? totalRentAgreed : totalMarketRent;
  const icr = totalMortgage > 0 ? (incomeForIcr / totalMortgage) * 100 : null;

  return {
    totalProperties: count,
    totalPortfolioValue,
    totalMarketRent,
    totalRentAgreed: hasRentAgreed ? totalRentAgreed : null,
    totalEquity,
    totalMortgageMonthly: totalMortgage,
    grossYield,
    icr,
    properties: enriched,
  };
}

export function loadState() {
  try {
    const raw = sessionStorage.getItem('lrfp-state');
    return raw ? JSON.parse(raw) : { accessGranted: false, loggedIn: false, portfolio: null };
  } catch {
    return { accessGranted: false, loggedIn: false, portfolio: null };
  }
}

export function isAccessCodeValid(code) {
  const expected = [7, 7, 7, 2, 1, 2].map((d) => String(d)).join('');
  return String(code || '').trim() === expected;
}

export function saveState(state) {
  sessionStorage.setItem('lrfp-state', JSON.stringify(state));
}
