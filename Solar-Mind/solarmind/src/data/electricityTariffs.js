/**
 * Indian Electricity Tariff Database
 * Sources: State Electricity Regulatory Commission (SERC) orders, 2024–25
 * Structure: slabs are applied progressively (like income tax slabs).
 * fixedCharge is ₹/month regardless of consumption.
 * energyCharge is ₹/kWh for units within that slab.
 * If slabs is null, flatRate applies to all units.
 */

export const TARIFF_DB = {
  // ── UTTARAKHAND (UPCL) ────────────────────────────────────────────────────
  uttarakhand: {
    stateName: 'Uttarakhand',
    discoms: ['UPCL', 'PTCUL'],
    currency: '₹',
    fixedCharge: 75,
    slabs: [
      { upTo: 100,  rate: 3.65 },
      { upTo: 200,  rate: 4.80 },
      { upTo: 400,  rate: 6.00 },
      { upTo: Infinity, rate: 6.50 },
    ],
  },

  // ── DELHI (BSES / TPDDL) ──────────────────────────────────────────────────
  delhi: {
    stateName: 'Delhi',
    discoms: ['BSES Rajdhani', 'BSES Yamuna', 'TPDDL'],
    currency: '₹',
    fixedCharge: 125,
    slabs: [
      { upTo: 200,  rate: 3.00 },
      { upTo: 400,  rate: 4.50 },
      { upTo: 800,  rate: 6.50 },
      { upTo: 1200, rate: 7.00 },
      { upTo: Infinity, rate: 8.00 },
    ],
  },

  // ── MAHARASHTRA (MSEDCL / Adani / Tata) ───────────────────────────────────
  maharashtra: {
    stateName: 'Maharashtra',
    discoms: ['MSEDCL', 'Adani Electricity', 'Tata Power'],
    currency: '₹',
    fixedCharge: 155,
    slabs: [
      { upTo: 100,  rate: 3.78 },
      { upTo: 300,  rate: 7.08 },
      { upTo: 500,  rate: 9.84 },
      { upTo: Infinity, rate: 11.22 },
    ],
  },

  // ── KARNATAKA (BESCOM / HESCOM / GESCOM / MESCOM / CESC) ──────────────────
  karnataka: {
    stateName: 'Karnataka',
    discoms: ['BESCOM', 'HESCOM', 'GESCOM', 'MESCOM', 'CESC'],
    currency: '₹',
    fixedCharge: 75,
    slabs: [
      { upTo: 30,   rate: 3.15 },
      { upTo: 100,  rate: 5.90 },
      { upTo: 200,  rate: 7.10 },
      { upTo: 500,  rate: 7.95 },
      { upTo: Infinity, rate: 8.80 },
    ],
  },

  // ── TAMIL NADU (TANGEDCO) ─────────────────────────────────────────────────
  tamil_nadu: {
    stateName: 'Tamil Nadu',
    discoms: ['TANGEDCO'],
    currency: '₹',
    fixedCharge: 50,
    slabs: [
      { upTo: 100,  rate: 0.00 },  // First 100 units free for domestic
      { upTo: 200,  rate: 1.50 },
      { upTo: 500,  rate: 3.00 },
      { upTo: Infinity, rate: 5.75 },
    ],
  },

  // ── GUJARAT (DGVCL / MGVCL / PGVCL / UGVCL) ──────────────────────────────
  gujarat: {
    stateName: 'Gujarat',
    discoms: ['DGVCL', 'MGVCL', 'PGVCL', 'UGVCL'],
    currency: '₹',
    fixedCharge: 95,
    slabs: [
      { upTo: 50,   rate: 2.85 },
      { upTo: 150,  rate: 3.95 },
      { upTo: 250,  rate: 4.95 },
      { upTo: Infinity, rate: 5.85 },
    ],
  },

  // ── RAJASTHAN (JVVNL / AVVNL / JDVVNL) ──────────────────────────────────
  rajasthan: {
    stateName: 'Rajasthan',
    discoms: ['JVVNL', 'AVVNL', 'JDVVNL'],
    currency: '₹',
    fixedCharge: 85,
    slabs: [
      { upTo: 50,   rate: 3.50 },
      { upTo: 150,  rate: 5.50 },
      { upTo: 300,  rate: 6.50 },
      { upTo: Infinity, rate: 7.25 },
    ],
  },

  // ── UTTAR PRADESH (DVVNL / MVVNL / PVVNL / PUVVNL / KESCO) ──────────────
  uttar_pradesh: {
    stateName: 'Uttar Pradesh',
    discoms: ['DVVNL', 'MVVNL', 'PVVNL', 'PUVVNL', 'KESCO'],
    currency: '₹',
    fixedCharge: 90,
    slabs: [
      { upTo: 150,  rate: 5.50 },
      { upTo: 300,  rate: 6.00 },
      { upTo: 500,  rate: 6.50 },
      { upTo: Infinity, rate: 7.00 },
    ],
  },

  // ── MADHYA PRADESH (MPEZ / MPMKVCL / MPWZ) ───────────────────────────────
  madhya_pradesh: {
    stateName: 'Madhya Pradesh',
    discoms: ['MPEZ', 'MPMKVCL', 'MPWZ'],
    currency: '₹',
    fixedCharge: 80,
    slabs: [
      { upTo: 30,   rate: 3.71 },
      { upTo: 100,  rate: 4.46 },
      { upTo: 150,  rate: 5.21 },
      { upTo: 300,  rate: 5.96 },
      { upTo: Infinity, rate: 6.71 },
    ],
  },

  // ── WEST BENGAL (WBSEDCL / CESC Kolkata) ─────────────────────────────────
  west_bengal: {
    stateName: 'West Bengal',
    discoms: ['WBSEDCL', 'CESC'],
    currency: '₹',
    fixedCharge: 60,
    slabs: [
      { upTo: 25,   rate: 4.47 },
      { upTo: 75,   rate: 5.48 },
      { upTo: 150,  rate: 6.28 },
      { upTo: 250,  rate: 6.91 },
      { upTo: Infinity, rate: 7.42 },
    ],
  },

  // ── ANDHRA PRADESH (APEPDCL / APSPDCL) ───────────────────────────────────
  andhra_pradesh: {
    stateName: 'Andhra Pradesh',
    discoms: ['APEPDCL', 'APSPDCL'],
    currency: '₹',
    fixedCharge: 70,
    slabs: [
      { upTo: 50,   rate: 1.45 },
      { upTo: 100,  rate: 2.60 },
      { upTo: 200,  rate: 3.76 },
      { upTo: 300,  rate: 5.30 },
      { upTo: 400,  rate: 6.55 },
      { upTo: 500,  rate: 7.10 },
      { upTo: Infinity, rate: 9.50 },
    ],
  },

  // ── TELANGANA (TSSPDCL / TSNPDCL) ────────────────────────────────────────
  telangana: {
    stateName: 'Telangana',
    discoms: ['TSSPDCL', 'TSNPDCL'],
    currency: '₹',
    fixedCharge: 75,
    slabs: [
      { upTo: 50,   rate: 1.45 },
      { upTo: 100,  rate: 2.60 },
      { upTo: 200,  rate: 3.76 },
      { upTo: 300,  rate: 5.30 },
      { upTo: Infinity, rate: 7.50 },
    ],
  },

  // ── KERALA (KSEB) ─────────────────────────────────────────────────────────
  kerala: {
    stateName: 'Kerala',
    discoms: ['KSEB'],
    currency: '₹',
    fixedCharge: 65,
    slabs: [
      { upTo: 40,   rate: 2.20 },
      { upTo: 80,   rate: 3.25 },
      { upTo: 140,  rate: 4.10 },
      { upTo: 200,  rate: 5.80 },
      { upTo: 250,  rate: 6.90 },
      { upTo: 350,  rate: 7.50 },
      { upTo: Infinity, rate: 7.90 },
    ],
  },

  // ── PUNJAB (PSPCL) ────────────────────────────────────────────────────────
  punjab: {
    stateName: 'Punjab',
    discoms: ['PSPCL'],
    currency: '₹',
    fixedCharge: 70,
    slabs: [
      { upTo: 100,  rate: 4.06 },
      { upTo: 300,  rate: 5.78 },
      { upTo: 500,  rate: 6.89 },
      { upTo: Infinity, rate: 7.62 },
    ],
  },

  // ── HARYANA (DHBVN / UHBVN) ──────────────────────────────────────────────
  haryana: {
    stateName: 'Haryana',
    discoms: ['DHBVN', 'UHBVN'],
    currency: '₹',
    fixedCharge: 80,
    slabs: [
      { upTo: 50,   rate: 2.50 },
      { upTo: 150,  rate: 5.25 },
      { upTo: 250,  rate: 6.30 },
      { upTo: 500,  rate: 6.85 },
      { upTo: Infinity, rate: 7.10 },
    ],
  },

  // ── HIMACHAL PRADESH (HPSEBL) ─────────────────────────────────────────────
  himachal_pradesh: {
    stateName: 'Himachal Pradesh',
    discoms: ['HPSEBL'],
    currency: '₹',
    fixedCharge: 55,
    slabs: [
      { upTo: 125,  rate: 3.80 },
      { upTo: 300,  rate: 4.90 },
      { upTo: Infinity, rate: 5.70 },
    ],
  },

  // ── JHARKHAND (JBVNL) ────────────────────────────────────────────────────
  jharkhand: {
    stateName: 'Jharkhand',
    discoms: ['JBVNL'],
    currency: '₹',
    fixedCharge: 65,
    slabs: [
      { upTo: 100,  rate: 3.65 },
      { upTo: 200,  rate: 4.55 },
      { upTo: 400,  rate: 5.35 },
      { upTo: Infinity, rate: 6.25 },
    ],
  },

  // ── ODISHA (CESU / NESCO / SOUTHCO / WESCO) ───────────────────────────────
  odisha: {
    stateName: 'Odisha',
    discoms: ['CESU', 'NESCO', 'SOUTHCO', 'WESCO'],
    currency: '₹',
    fixedCharge: 50,
    slabs: [
      { upTo: 50,   rate: 2.40 },
      { upTo: 200,  rate: 3.80 },
      { upTo: 400,  rate: 5.20 },
      { upTo: Infinity, rate: 6.00 },
    ],
  },

  // ── ASSAM (APDCL) ────────────────────────────────────────────────────────
  assam: {
    stateName: 'Assam',
    discoms: ['APDCL'],
    currency: '₹',
    fixedCharge: 55,
    slabs: [
      { upTo: 30,   rate: 3.75 },
      { upTo: 100,  rate: 5.25 },
      { upTo: 200,  rate: 6.15 },
      { upTo: Infinity, rate: 7.25 },
    ],
  },

  // ── CHHATTISGARH (CSPDCL) ────────────────────────────────────────────────
  chhattisgarh: {
    stateName: 'Chhattisgarh',
    discoms: ['CSPDCL'],
    currency: '₹',
    fixedCharge: 60,
    slabs: [
      { upTo: 30,   rate: 3.30 },
      { upTo: 60,   rate: 3.95 },
      { upTo: 90,   rate: 4.80 },
      { upTo: 200,  rate: 5.70 },
      { upTo: Infinity, rate: 6.40 },
    ],
  },

  // ── Bihar (NBPDCL / SBPDCL) ──────────────────────────────────────────────
  bihar: {
    stateName: 'Bihar',
    discoms: ['NBPDCL', 'SBPDCL'],
    currency: '₹',
    fixedCharge: 70,
    slabs: [
      { upTo: 100,  rate: 5.50 },
      { upTo: 200,  rate: 6.00 },
      { upTo: Infinity, rate: 6.50 },
    ],
  },

  // ── GOA (GED) ────────────────────────────────────────────────────────────
  goa: {
    stateName: 'Goa',
    discoms: ['GED'],
    currency: '₹',
    fixedCharge: 85,
    slabs: [
      { upTo: 100,  rate: 1.75 },
      { upTo: 200,  rate: 3.40 },
      { upTo: 300,  rate: 5.00 },
      { upTo: Infinity, rate: 5.60 },
    ],
  },

  // ── DEFAULT FALLBACK ──────────────────────────────────────────────────────
  default: {
    stateName: 'India (National Average)',
    discoms: [],
    currency: '₹',
    fixedCharge: 80,
    flatRate: 7.50,
    slabs: null,
  },
};

/**
 * Keyword map: Nominatim address component keywords → tariff DB key.
 * Nominatim returns address fields like state, county, city, town, suburb.
 * We match lowercased strings against these keywords.
 */
export const STATE_KEYWORD_MAP = [
  { key: 'uttarakhand',    keywords: ['uttarakhand', 'uttaranchal'] },
  { key: 'delhi',          keywords: ['delhi', 'new delhi', 'ncr'] },
  { key: 'maharashtra',    keywords: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'nashik'] },
  { key: 'karnataka',      keywords: ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'hubli', 'mangaluru'] },
  { key: 'tamil_nadu',     keywords: ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'madurai'] },
  { key: 'gujarat',        keywords: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot'] },
  { key: 'rajasthan',      keywords: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'kota'] },
  { key: 'uttar_pradesh',  keywords: ['uttar pradesh', 'lucknow', 'kanpur', 'agra', 'varanasi', 'noida', 'ghaziabad'] },
  { key: 'madhya_pradesh', keywords: ['madhya pradesh', 'bhopal', 'indore', 'jabalpur', 'gwalior'] },
  { key: 'west_bengal',    keywords: ['west bengal', 'kolkata', 'calcutta', 'howrah', 'siliguri'] },
  { key: 'andhra_pradesh', keywords: ['andhra pradesh', 'visakhapatnam', 'vijayawada', 'tirupati'] },
  { key: 'telangana',      keywords: ['telangana', 'hyderabad', 'warangal', 'nizamabad'] },
  { key: 'kerala',         keywords: ['kerala', 'thiruvananthapuram', 'kochi', 'kozhikode', 'thrissur'] },
  { key: 'punjab',         keywords: ['punjab', 'ludhiana', 'amritsar', 'jalandhar', 'patiala'] },
  { key: 'haryana',        keywords: ['haryana', 'gurgaon', 'gurugram', 'faridabad', 'panipat', 'ambala'] },
  { key: 'himachal_pradesh', keywords: ['himachal pradesh', 'shimla', 'dharamshala', 'manali', 'solan'] },
  { key: 'jharkhand',      keywords: ['jharkhand', 'ranchi', 'jamshedpur', 'dhanbad', 'bokaro'] },
  { key: 'odisha',         keywords: ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'rourkela'] },
  { key: 'assam',          keywords: ['assam', 'guwahati', 'dibrugarh', 'silchar'] },
  { key: 'chhattisgarh',   keywords: ['chhattisgarh', 'raipur', 'bhilai', 'bilaspur'] },
  { key: 'bihar',          keywords: ['bihar', 'patna', 'gaya', 'muzaffarpur', 'bhagalpur'] },
  { key: 'goa',            keywords: ['goa', 'panaji', 'margao', 'vasco'] },
];

/**
 * Detect state from a Nominatim reverse-geocode address object.
 * @param {object} address - address fields from Nominatim response
 * @returns {string} tariff DB key
 */
export function detectStateFromAddress(address) {
  if (!address) return 'default';

  // Concatenate all address fields into one lowercase string for matching
  const haystack = Object.values(address).join(' ').toLowerCase();

  for (const entry of STATE_KEYWORD_MAP) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      return entry.key;
    }
  }
  return 'default';
}

/**
 * Calculate the actual monthly bill using slab-based progressive tariff.
 * @param {number} monthlyKwh
 * @param {object} tariff - a TARIFF_DB entry
 * @returns {{ totalBill: number, effectiveRate: number, breakdown: array }}
 */
export function calculateSlabBill(monthlyKwh, tariff) {
  if (!tariff.slabs || tariff.flatRate) {
    const rate = tariff.flatRate || 7.50;
    return {
      totalBill: Math.round(monthlyKwh * rate + tariff.fixedCharge),
      effectiveRate: rate,
      breakdown: [{ slab: 'Flat rate', units: monthlyKwh, rate, amount: monthlyKwh * rate }],
    };
  }

  let remaining = monthlyKwh;
  let totalEnergy = 0;
  let prevLimit = 0;
  const breakdown = [];

  for (const slab of tariff.slabs) {
    if (remaining <= 0) break;
    const slabUnits = Math.min(remaining, slab.upTo - prevLimit);
    const amount = slabUnits * slab.rate;
    totalEnergy += amount;
    breakdown.push({
      slab: slab.upTo === Infinity
        ? `Above ${prevLimit} units`
        : `${prevLimit + 1}–${slab.upTo} units`,
      units: Math.round(slabUnits * 10) / 10,
      rate: slab.rate,
      amount: Math.round(amount),
    });
    remaining -= slabUnits;
    prevLimit = slab.upTo;
  }

  const totalBill = Math.round(totalEnergy + tariff.fixedCharge);
  const effectiveRate = parseFloat((totalEnergy / monthlyKwh).toFixed(2));

  return { totalBill, effectiveRate, breakdown };
}
