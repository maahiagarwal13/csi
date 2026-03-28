# SolarMind: Phase-Wise Breakdown
### Intelligent Solar Feasibility and Planning System for Buildings

---

## Phase 1 — Data Acquisition & Input Layer
> **Goal:** Collect the user's energy consumption, location, and building data.

| Step | What Happens | Tech Used |
|------|-------------|-----------|
| 1.1 | User uploads electricity bill (image/PDF) | Tesseract.js / Google Vision API |
| 1.2 | OCR engine extracts monthly kWh consumption & billing period | OCR + regex parsing |
| 1.3 | Fallback: manual entry form (monthly kWh, billing period) | React form (Shadcn/UI) |
| 1.4 | User enters or confirms location (browser geolocation or map pin) | Leaflet.js + OpenStreetMap |
| 1.5 | User enters approximate roof/land area (sq ft) or selects building type for default estimate | Input field with presets |

**Output of Phase 1:** `{ monthlyKwh, location: {lat, lng}, roofAreaSqFt }`

---

## Phase 2 — Solar Irradiance & Environmental Data Fetch
> **Goal:** Get real solar radiation data for the user's exact location.

| Step | What Happens | Tech Used |
|------|-------------|-----------|
| 2.1 | Send lat/lng to solar data API | NASA POWER API or NREL PVWatts API |
| 2.2 | Retrieve average daily/monthly solar irradiance (kWh/m²/day) | REST API call |
| 2.3 | Retrieve peak sun hours for the location | Derived from irradiance data |
| 2.4 | (Optional) Fetch local weather/cloud cover data for accuracy adjustment | OpenWeatherMap API |

**Output of Phase 2:** `{ avgIrradiance, peakSunHours, locationMeta }`

---

## Phase 3 — Solar Sizing & Engineering Calculation Engine
> **Goal:** Compute the optimal solar system design for the building.

| Step | What Happens | Formula / Logic |
|------|-------------|-----------------|
| 3.1 | Calculate required system size (kW) | `systemSizeKW = monthlyKwh / (30 × peakSunHours × systemEfficiency)` |
| 3.2 | Determine number of panels needed | `panelCount = ceil(systemSizeKW / panelWattage × 1000)` |
| 3.3 | Estimate roof space required (sq ft) | `roofSpace = panelCount × panelAreaSqFt` |
| 3.4 | Validate against user's available roof area | Check `roofSpace ≤ roofAreaSqFt` |
| 3.5 | Compute expected daily/monthly/annual generation (kWh) | `generation = systemSizeKW × peakSunHours × performanceRatio` |

**Assumed Constants (configurable):**
- Panel wattage: 400W
- Panel area: ~18 sq ft
- System efficiency: 80%
- Performance ratio: 0.75–0.80

**Output of Phase 3:** `{ systemSizeKW, panelCount, roofSpaceNeeded, expectedGeneration: { daily, monthly, annual } }`

---

## Phase 4 — Financial Analysis Engine
> **Goal:** Calculate all costs, savings, and ROI metrics.

| Step | What Happens | Formula / Logic |
|------|-------------|-----------------|
| 4.1 | Estimate installation cost | `installCost = systemSizeKW × costPerKW` (₹45,000/kW default) |
| 4.2 | Calculate monthly electricity savings | `monthlySavings = expectedMonthlyGen × electricityRate` (₹8/kWh default) |
| 4.3 | Calculate annual savings | `annualSavings = monthlySavings × 12` |
| 4.4 | Compute simple payback period | `paybackYears = installCost / annualSavings` |
| 4.5 | Compute lifetime savings (25-year lifespan) | `lifetimeSavings = (annualSavings × 25) − installCost − maintenanceCost` |
| 4.6 | (Optional) Factor in panel degradation (~0.5%/year) | Adjust annual generation year-over-year |
| 4.7 | (Optional) Factor in government subsidies (MNRE 40% residential) | Reduce `installCost` by subsidy % |

**Output of Phase 4:** `{ installCost, monthlySavings, annualSavings, paybackYears, lifetimeSavings }`

---

## Phase 5 — Environmental Impact Calculation
> **Goal:** Quantify the green/sustainability benefits.

| Step | What Happens | Formula / Logic |
|------|-------------|-----------------|
| 5.1 | Calculate annual CO₂ offset | `co2OffsetTons = annualGenKwh × emissionFactor` (0.82 kg CO₂/kWh for India) |
| 5.2 | Lifetime CO₂ offset (25 years) | `lifetimeCO2 = co2OffsetTons × 25` (with degradation) |
| 5.3 | Equivalent trees planted | `treesEquivalent = lifetimeCO2 / 0.022` (1 tree ≈ 22 kg CO₂/year) |
| 5.4 | Equivalent cars taken off road | `carsOffset = annualCO2 / 4.6` (avg car ≈ 4.6 tons CO₂/year) |

**Output of Phase 5:** `{ annualCO2Offset, lifetimeCO2Offset, treesEquivalent, carsOffset }`

---

## Phase 6 — AI Insights & Recommendations Layer
> **Goal:** Generate human-readable, personalized advice using AI.

| Step | What Happens | Tech Used |
|------|-------------|-----------|
| 6.1 | Package all Phase 3–5 outputs into a structured prompt | JSON → prompt template |
| 6.2 | Send to LLM (Gemini / GPT-4o) for natural language summary | Google Gemini API |
| 6.3 | AI generates personalized recommendation text | e.g., "Based on your 480 kWh/month usage in Dehradun, a 5.2 kW system will cover 87% of your needs…" |
| 6.4 | AI generates actionable next steps | e.g., "Contact MNRE-approved installers", "Apply for 40% subsidy" |
| 6.5 | (Optional) AI flags risks or caveats | e.g., "Your roof area may be slightly insufficient — consider ground-mount" |

**Output of Phase 6:** `{ summaryText, recommendations[], caveats[] }`

---

## Phase 7 — Interactive Dashboard & Visualization (Frontend)
> **Goal:** Present all results in a stunning, animated dashboard.

| Component | What It Shows | Tech Used |
|-----------|--------------|-----------|
| 7.1 **Hero Metrics Cards** | System size, panel count, payback period — with animated counters | React + Framer Motion |
| 7.2 **Financial Savings Odometer** | Lifetime savings counting up from ₹0 → ₹12,00,000+ | CSS counter animation |
| 7.3 **Monthly Generation Chart** | Bar/area chart — expected kWh generation per month | Recharts |
| 7.4 **Cost vs. Savings Timeline** | Line chart — cumulative cost vs. cumulative savings over 25 years | Recharts |
| 7.5 **CO₂ Impact Visualizer** | Animated tree counter + CO₂ tons offset | Custom SVG + animation |
| 7.6 **With vs. Without Solar** | Side-by-side comparison — current bill vs. post-solar bill | Shadcn/UI cards |
| 7.7 **Map View** | Leaflet map with building pin + solar irradiance overlay | Leaflet.js |
| 7.8 **AI Insights Panel** | Natural language recommendation from Phase 6 | Text card with typing effect |

---

## Phase 8 — Report Generation & Export
> **Goal:** Let users download/share their solar plan.

| Step | What Happens | Tech Used |
|------|-------------|-----------|
| 8.1 | Generate PDF report with all dashboard data | jsPDF / React-PDF |
| 8.2 | Include charts, metrics, AI summary, and next steps | HTML-to-canvas → PDF |
| 8.3 | Add branding (SolarMind logo, disclaimer, date) | Template layout |
| 8.4 | Download button on dashboard | Blob download |

---

## Phase Summary — Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│  Electricity Bill (OCR) / Manual kWh + Location + Roof Area      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │  Phase 1: Data      │
            │  Acquisition        │
            └────────┬────────────┘
                     │ { monthlyKwh, lat/lng, roofArea }
                     ▼
            ┌─────────────────────┐
            │  Phase 2: Solar     │
            │  Irradiance Fetch   │
            └────────┬────────────┘
                     │ { irradiance, peakSunHours }
                     ▼
            ┌─────────────────────┐
            │  Phase 3: Solar     │
            │  Sizing Engine      │
            └────────┬────────────┘
                     │ { systemSize, panelCount, generation }
                     ▼
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ Phase 4:         │  │ Phase 5:         │
│ Financial Engine │  │ Environmental    │
│                  │  │ Impact           │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
          ┌──────────────────┐
          │ Phase 6: AI      │
          │ Insights Layer   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Phase 7:         │
          │ Dashboard & Viz  │──────► Phase 8: PDF Export
          └──────────────────┘
```

---

## Quick Reference — Tech Stack per Phase

| Phase | Primary Tech |
|-------|-------------|
| 1 — Data Acquisition | Tesseract.js, Leaflet.js, React |
| 2 — Irradiance Fetch | NASA POWER API / PVWatts API |
| 3 — Sizing Engine | Node.js (custom algorithm) |
| 4 — Financial Engine | Node.js (custom algorithm) |
| 5 — Environmental | Node.js (formula-based) |
| 6 — AI Insights | Google Gemini API / GPT-4o |
| 7 — Dashboard | React, Recharts, Shadcn/UI, Framer Motion |
| 8 — PDF Export | jsPDF / React-PDF |
