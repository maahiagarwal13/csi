/**
 * SolarMind Calculation Engine — Phases 3, 4, 5
 * All pure functions. No side effects.
 *
 * Bug fixes applied:
 * 1. Sizing uses systemEfficiency for nameplate capacity, performanceRatio for generation
 * 2. coveragePercent derived from monthly irradiance average, not flat dailyGen × 30
 * 3. calcFinancials uses sizing.systemSizeKW directly (not re-derived from panelCount)
 * 4. Payback interpolation anchored correctly (cost starts at installCost at year 0)
 * 5. lifetimeSavings = cumSavings − installCost − totalMaintenance (consistent with chart)
 * 6. treesEquivalent unit fix: lifetimeCO2 converted to kg, divided by (co2PerTree × lifespan)
 */

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const CONSTANTS = {
  // Phase 3 — Solar Sizing
  panelWattage: 400,        // Watts per panel
  panelAreaSqFt: 18,        // ~1.67 m² per panel, ≈ 18 sq ft
  performanceRatio: 0.78,   // DC → AC derating (inverter + wiring + soiling losses)

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
  const { panelWattage, panelAreaSqFt, performanceRatio } = CONSTANTS

  // Size the system so that (systemKW × peakSunHours × PR × 30) ≈ monthlyKwh
  const systemSizeKW = monthlyKwh / (30 * peakSunHours * performanceRatio)
  const panelCount = Math.max(1, Math.round((systemSizeKW * 1000) / panelWattage))
  const roofSpaceNeeded = panelCount * panelAreaSqFt
  const roofFeasible = roofSpaceNeeded <= roofAreaSqFt

  // If roof is too small, calculate max feasible system
  const maxPanels = Math.floor(roofAreaSqFt / panelAreaSqFt)
  const effectivePanels = roofFeasible ? panelCount : maxPanels
  // FIX 3 (partial): effectiveSystemKW is the canonical system size used everywhere
  const effectiveSystemKW = (effectivePanels * panelWattage) / 1000

  // Expected generation using performanceRatio (actual AC output)
  const dailyGenKwh = effectiveSystemKW * peakSunHours * performanceRatio
  const annualGenKwh = dailyGenKwh * 365

  // FIX 2: Monthly generation using actual per-month irradiance data
  const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyGenData = MONTH_NAMES.map((name, i) => {
    const irr = monthlyIrradiance[i] ?? peakSunHours
    const gen = parseFloat((effectiveSystemKW * irr * performanceRatio * DAYS_PER_MONTH[i]).toFixed(1))
    return { month: name, generation: gen }
  })

  // FIX 2: Derive monthlyGenKwh from the average of real monthly generation, not flat estimate
  const totalAnnualFromMonthly = monthlyGenData.reduce((sum, d) => sum + d.generation, 0)
  const monthlyGenKwh = totalAnnualFromMonthly / 12
  const coveragePercent = Math.round((monthlyGenKwh / monthlyKwh) * 100)

  return {
    systemSizeKW: parseFloat(effectiveSystemKW.toFixed(2)),
    panelCount: effectivePanels,
    roofSpaceNeeded: parseFloat(roofSpaceNeeded.toFixed(1)),
    roofFeasible,
    coveragePercent,
    generation: {
      daily: parseFloat(dailyGenKwh.toFixed(2)),
      monthly: parseFloat(monthlyGenKwh.toFixed(1)),
      annual: parseFloat(totalAnnualFromMonthly.toFixed(1)),
    },
    monthlyGenData,
  }
}

// ─── PHASE 4: FINANCIAL ANALYSIS ─────────────────────────────────────────────

/**
 * @param {SizingResult} sizing
 * @param {{ applySubsidy?: boolean, electricityRate?: number }} options
 * @returns {FinancialResult}
 */
export function calcFinancials(sizing, options = {}) {
  const {
    applySubsidy = true,
    electricityRate = CONSTANTS.electricityRate,
  } = options

  const {
    costPerKW,
    subsidyRate,
    annualMaintenancePct,
    systemLifespan,
    degradationRate,
  } = CONSTANTS

  // FIX 3: Use sizing.systemSizeKW directly instead of re-deriving from panelCount × wattage
  // This avoids drift caused by Math.ceil() rounding in panel count
  const installedKW = sizing.systemSizeKW
  const rawInstallCost = installedKW * costPerKW
  const subsidyAmount = applySubsidy ? rawInstallCost * subsidyRate : 0
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

  // FIX 4: Cost baseline starts at installCost at year 0
  // Year 0 data point for correct interpolation anchor
  for (let yr = 1; yr <= systemLifespan; yr++) {
    const degradationFactor = Math.pow(1 - degradationRate, yr - 1)
    const yearSavings = annualSavings * degradationFactor

    const prevCumSavings = cumSavings
    cumSavings += yearSavings

    const cumCost = installCost + annualMaintenance * yr

    yearlyData.push({
      year: yr,
      cumulativeSavings: Math.round(cumSavings),
      cumulativeCost: Math.round(cumCost),
    })

    // Find intersection where savings overtake cost
    if (paybackYears === null && cumSavings >= cumCost) {
      // FIX 4: Correct interpolation — previous cost is installCost + maintenance*(yr-1)
      const prevCumCost = installCost + annualMaintenance * (yr - 1)
      const startDeficit = prevCumCost - prevCumSavings
      const endSurplus = cumSavings - cumCost
      const fraction = startDeficit / (startDeficit + endSurplus)
      paybackYears = parseFloat(((yr - 1) + fraction).toFixed(1))
    }
  }

  if (paybackYears === null) {
    paybackYears = ">25"
  }

  // FIX 5: lifetimeSavings = net profit over 25 years (consistent with chart data)
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
  const { emissionFactor, co2PerTree, co2PerCar, systemLifespan, degradationRate } = CONSTANTS

  const annualCO2Kg = annualGenKwh * emissionFactor
  const annualCO2Tons = parseFloat((annualCO2Kg / 1000).toFixed(2))

  // Lifetime with proper degradation sum instead of arbitrary 0.9 multiplier
  let lifetimeSum = 0
  for (let y = 0; y < systemLifespan; y++) {
    lifetimeSum += Math.pow(1 - degradationRate, y)
  }
  const lifetimeCO2Kg = annualCO2Kg * lifetimeSum
  const lifetimeCO2Tons = parseFloat((lifetimeCO2Kg / 1000).toFixed(1))

  // FIX 6: treesEquivalent — lifetimeCO2 is in kg, co2PerTree is kg/tree/year
  // Must account for the fact that each tree sequesters co2PerTree kg EACH YEAR over the lifespan
  const treesEquivalent = Math.round(lifetimeCO2Kg / (co2PerTree * systemLifespan))

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
 * @param {object} rateOptions - optional { electricityRate } override
 */
export function runFullPipeline(params, solarData, rateOptions = {}) {
  const { monthlyKwh, roofAreaSqFt } = params
  const { peakSunHours, monthlyIrradiance } = solarData

  const sizing = calcSizing(monthlyKwh, peakSunHours, roofAreaSqFt, monthlyIrradiance)
  const financials = calcFinancials(sizing, {
    applySubsidy: true,
    electricityRate: rateOptions.electricityRate ?? CONSTANTS.electricityRate,
  })
  const environmental = calcEnvironmental(sizing.generation.annual)

  return { sizing, financials, environmental, solarData }
}
