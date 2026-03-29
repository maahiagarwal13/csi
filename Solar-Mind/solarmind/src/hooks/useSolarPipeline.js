import { useState, useCallback } from 'react'
import { fetchSolarIrradiance, fetchAddressFromCoords } from '../services/solarApi'
import { runFullPipeline } from '../services/solarCalculations'
import { TARIFF_DB, detectStateFromAddress, calculateSlabBill } from '../data/electricityTariffs'

/**
 * Orchestrates the full Phase 2→5 pipeline.
 * Usage:
 *   const { status, results, error, run } = useSolarPipeline()
 *   run(phase1Data) // triggers async pipeline
 */
export function useSolarPipeline() {
  const [status, setStatus] = useState('idle')   // 'idle' | 'loading' | 'success' | 'error'
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const run = useCallback(async (phase1Data) => {
    const { monthlyKwh, location, roofAreaSqFt } = phase1Data

    if (!location?.lat || !location?.lng) {
      setError('Location data is missing. Please go back and pin your location.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)
    setLoadingStep(1) // Fetching irradiance

    try {
      // Phase 2 — Fetch solar irradiance from NASA POWER API
      const solarData = await fetchSolarIrradiance(location.lat, location.lng)

      setLoadingStep(2) // Detecting local electricity tariff

      // Detect state and tariff from location
      const addressObj = await fetchAddressFromCoords(location.lat, location.lng)
      const stateKey = detectStateFromAddress(addressObj)
      const tariff = TARIFF_DB[stateKey] || TARIFF_DB.default
      const { totalBill, effectiveRate, breakdown } = calculateSlabBill(monthlyKwh, tariff)

      setLoadingStep(3) // Running calculations

      // Phases 3–5 — Run full calculation pipeline with location-aware rate
      const pipelineResults = runFullPipeline(
        { monthlyKwh, roofAreaSqFt },
        solarData,
        { electricityRate: effectiveRate }
      )

      setLoadingStep(4) // Done

      setResults({
        ...pipelineResults,
        tariff: {
          ...tariff,
          stateKey,
          effectiveRate,
          currentMonthlyBill: totalBill,
          slabBreakdown: breakdown,
        },
        inputData: phase1Data,
      })
      setStatus('success')
    } catch (err) {
      console.error('SolarMind pipeline error:', err)
      setError(err.message || 'Failed to fetch solar data. Please check your connection and try again.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResults(null)
    setError(null)
    setLoadingStep(0)
  }, [])

  return { status, results, error, loadingStep, run, reset }
}
