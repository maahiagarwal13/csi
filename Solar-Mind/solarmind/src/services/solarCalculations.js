/**
 * SolarMind Calculation Engine — Phases 3, 4, 5
 * All pure functions. No side effects.
 */

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const CONSTANTS = {
  // Phase 3 — Solar Sizing
  panelWattage: 400,        // Watts per panel
  panelAreaSqFt: 18,        // ~1.67 m² per panel, ≈ 18 sq ft
  systemEfficiency: 0.80,   // Inverter + wiring losses
  performanceRatio: 0.78,   // DC → AC derating

  // Phase 4 — Financial
  costPerKW: 45000,         // ₹ per kW installed (India avg)
  electricityRate: 8,       // ₹ per kWh (India avg retail)
  subsidyRate: 0.40,        // MNRE 40% subsidy for residential
  annualMaintenancePct: 0.01, // 1% of install cost per year
  systemLifespan: 25,       // Years
  degradationRate: 0.005,   // 0.5% panel degradation per year

  // Phase 5 — Environmental (India)
  emissionFactor: 0.82,     // kg CO₂ per kWh (CEA India grid)
  co2PerTree: 22,           // kg CO₂ sequestered per tree per year
  co2PerCar: 4600,          // kg CO₂ per average car per year
}

// ─── PHASE 3: SOLAR SIZING ────────────────────────────────────────────────────

/**
 * @param {number} monthlyKwh   - User's monthly electricity usage
 * @param {number} peakSunHours - Average peak sun hours at location
 * @param {number} roofAreaSqFt - Available roof area
 * @param {number[]} monthlyIrradiance - Monthly irradiance array [jan..dec]
 * @returns {SizingResult}
 */
export function calcSizing(monthlyKwh, peakSunHours, roofAreaSqFt, monthlyIrradiance = []) {
  const { panelWattage, panelAreaSqFt, systemEfficiency, performanceRatio } = CONSTANTS

  // Required system size to cover 100% of usage based on actual performance ratio
  const systemSizeKW = monthlyKwh / (30 * peakSunHours * performanceRatio)
  const panelCount = Math.ceil((systemSizeKW * 1000) / panelWattage)
  const roofSpaceNeeded = panelCount * panelAreaSqFt
  const roofFeasible = roofSpaceNeeded <= roofAreaSqFt

  // If roof is too small, calculate max feasible system
  const maxPanels = Math.floor(roofAreaSqFt / panelAreaSqFt)
  const effectivePanels = roofFeasible ? panelCount : maxPanels
  const effectiveSystemKW = (effectivePanels * panelWattage) / 1000

  // Expected generation
  const dailyGenKwh = effectiveSystemKW * peakSunHours * performanceRatio
  const monthlyGenKwh = dailyGenKwh * 30
  const annualGenKwh = dailyGenKwh * 365
  const coveragePercent = Math.round((monthlyGenKwh / monthlyKwh) * 100)

  // Monthly generation per month using actual irradiance
  const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyGenData = MONTH_NAMES.map((name, i) => {
    const irr = monthlyIrradiance[i] ?? peakSunHours
    const gen = parseFloat((effectiveSystemKW * irr * performanceRatio * DAYS_PER_MONTH[i]).toFixed(1))
    return { month: name, generation: gen }
  })

  return {
    systemSizeKW: parseFloat(effectiveSystemKW.toFixed(2)),
    panelCount: effectivePanels,
    roofSpaceNeeded: parseFloat(roofSpaceNeeded.toFixed(1)),
    roofFeasible,
    coveragePercent,
    generation: {
      daily: parseFloat(dailyGenKwh.toFixed(2)),
      monthly: parseFloat(monthlyGenKwh.toFixed(1)),
      annual: parseFloat(annualGenKwh.toFixed(1)),
    },
    monthlyGenData,
  }
}

// ─── PHASE 4: FINANCIAL ANALYSIS ─────────────────────────────────────────────

/**
 * @param {SizingResult} sizing
 * @param {{ applySubsidy?: boolean }} options
 * @returns {FinancialResult}
 */
export function calcFinancials(sizing, options = { applySubsidy: true }) {
  const {
    costPerKW,
    electricityRate,
    subsidyRate,
    annualMaintenancePct,
    systemLifespan,
    degradationRate,
  } = CONSTANTS

  const installedKW = (sizing.panelCount * CONSTANTS.panelWattage) / 1000
  const rawInstallCost = installedKW * costPerKW
  const subsidyAmount = options.applySubsidy ? rawInstallCost * subsidyRate : 0
  const installCost = rawInstallCost - subsidyAmount

  const annualMaintenance = rawInstallCost * annualMaintenancePct
  const totalMaintenance = annualMaintenance * systemLifespan

  // Monthly savings = generation × rate
  const monthlySavings = parseFloat((sizing.generation.monthly * electricityRate).toFixed(0))
  const annualSavings = monthlySavings * 12
  // 25-year cumulative savings with 0.5%/year degradation
  let cumSavings = 0
  let paybackYears = null
  const yearlyData = []
  
  for (let yr = 1; yr <= systemLifespan; yr++) {
    const degradationFactor = Math.pow(1 - degradationRate, yr - 1)
    const yearSavings = annualSavings * degradationFactor
    
    const prevCumSavings = cumSavings
    cumSavings += yearSavings
    
    const cumCost = installCost + annualMaintenance * yr
    const prevCumCost = installCost + annualMaintenance * (yr - 1)

    yearlyData.push({
      year: yr,
      cumulativeSavings: Math.round(cumSavings),
      cumulativeCost: Math.round(cumCost),
    })
    
    // Find intersection where savings overtake cost
    if (paybackYears === null && cumSavings >= cumCost) {
      const startDeficit = prevCumCost - prevCumSavings
      const endSurplus = cumSavings - cumCost
      const fraction = startDeficit / (startDeficit + endSurplus)
      paybackYears = parseFloat(((yr - 1) + fraction).toFixed(1))
    }
  }
  
  if (paybackYears === null) {
      paybackYears = ">25"
  }

  const lifetimeSavings = Math.round(cumSavings - installCost - totalMaintenance)

  return {
    rawInstallCost: Math.round(rawInstallCost),
    subsidyAmount: Math.round(subsidyAmount),
    installCost: Math.round(installCost),
    annualMaintenance: Math.round(annualMaintenance),
    monthlySavings,
    annualSavings,
    paybackYears,
    lifetimeSavings,
    yearlyData, // for chart
  }
}

// ─── PHASE 5: ENVIRONMENTAL IMPACT ───────────────────────────────────────────

/**
 * @param {number} annualGenKwh
 * @returns {EnvironmentalResult}
 */
export function calcEnvironmental(annualGenKwh) {
  const { emissionFactor, co2PerTree, co2PerCar, systemLifespan } = CONSTANTS

  const annualCO2Kg = annualGenKwh * emissionFactor
  const annualCO2Tons = parseFloat((annualCO2Kg / 1000).toFixed(2))

  // Lifetime with 0.5% degradation — approximate
  const lifetimeCO2Tons = parseFloat((annualCO2Tons * systemLifespan * 0.9).toFixed(1))

  const treesEquivalent = Math.round((lifetimeCO2Tons * 1000) / co2PerTree)
  const carsOffset = parseFloat((annualCO2Kg / co2PerCar).toFixed(1))

  return {
    annualCO2Tons,
    lifetimeCO2Tons,
    treesEquivalent,
    carsOffset,
  }
}

// ─── COMBINED RUNNER ─────────────────────────────────────────────────────────

/**
 * Run the full Phase 3→5 pipeline.
 * @param {object} params
 * @param {number} params.monthlyKwh
 * @param {number} params.roofAreaSqFt
 * @param {object} solarData - output of fetchSolarIrradiance
 */
export function runFullPipeline(params, solarData) {
  const { monthlyKwh, roofAreaSqFt } = params
  const { peakSunHours, monthlyIrradiance } = solarData

  const sizing = calcSizing(monthlyKwh, peakSunHours, roofAreaSqFt, monthlyIrradiance)
  const financials = calcFinancials(sizing)
  const environmental = calcEnvironmental(sizing.generation.annual)

  return { sizing, financials, environmental, solarData }
}
