/**
 * Phase 2 — Solar Irradiance Fetch
 * Calls NASA POWER Climatology API to get average daily irradiance
 * for the user's lat/lng location.
 *
 * API Docs: https://power.larc.nasa.gov/api/temporal/climatology/point
 * Parameter: ALLSKY_SFC_SW_DWN = All-Sky Insolation Incident on a Horizontal Surface (kWh/m²/day)
 */

const NASA_POWER_BASE = 'https://power.larc.nasa.gov/api/temporal/climatology/point'

/**
 * Fetches solar irradiance data for a given lat/lng.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{ avgIrradiance: number, peakSunHours: number, monthlyIrradiance: number[], locationMeta: object }>}
 */
export async function fetchSolarIrradiance(lat, lng) {
  try {
    const params = new URLSearchParams({
      parameters: 'ALLSKY_SFC_SW_DWN',
      community: 'RE',
      longitude: lng.toFixed(4),
      latitude: lat.toFixed(4),
      format: 'JSON',
    })

    const url = `${NASA_POWER_BASE}?${params.toString()}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()

    // Extract ALLSKY_SFC_SW_DWN monthly + annual values
    const data = json?.properties?.parameter?.ALLSKY_SFC_SW_DWN
    if (!data) {
      throw new Error('Unexpected NASA API response format — irradiance data missing.')
    }

    // Months: JAN, FEB, ... DEC; ANN = annual average
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const monthlyIrradiance = MONTHS.map((m) => parseFloat(data[m]?.toFixed(2) ?? '0'))
    const avgIrradiance = parseFloat((data['ANN'] ?? monthlyIrradiance.reduce((a, b) => a + b, 0) / 12).toFixed(2))

    // Peak sun hours ≈ average daily irradiance (kWh/m²/day == hours at 1kW/m²)
    const peakSunHours = avgIrradiance

    return {
      avgIrradiance,
      peakSunHours,
      monthlyIrradiance, // [jan, feb, ..., dec] — kWh/m²/day
      locationMeta: {
        lat,
        lng,
        source: 'NASA POWER Climatology API',
      },
    }
  } catch (error) {
    console.warn('NASA POWER API unavailable — using regional average irradiance data.', error);
    // Mock simulation data tailored for Dehradun area roughly
    return {
      avgIrradiance: 5.2,
      peakSunHours: 5.2,
      monthlyIrradiance: [3.8, 4.5, 5.8, 6.7, 7.2, 5.9, 4.8, 4.5, 5.2, 5.1, 4.5, 3.9],
      locationMeta: {
        lat,
        lng,
        source: 'Simulated Solar Data (Fallback)',
      },
    }
  }
}

/**
 * Fetch structured address from Nominatim for tariff detection.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object>} Nominatim address object
 */
export async function fetchAddressFromCoords(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.address || {};
  } catch {
    return {};
  }
}
