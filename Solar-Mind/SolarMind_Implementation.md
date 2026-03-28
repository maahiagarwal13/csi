# SolarMind: AI Solar Advisor — Implementation Plan

## Goal
The goal of SolarMind is to democratize solar energy adoption by providing building owners with an instant, data-driven solar feasibility and planning system. By simply uploading an electricity bill or entering location data, users get a complete solar installation plan, including system size, financial payback, and environmental impact.

## Proposed Changes

### Core Functionality
- **Bill Upload & OCR:** Implement a mechanism to extract monthly kWh consumption from uploaded bill images or PDFs.
- **Solar Sizing Engine:** Develop an algorithm to calculate optimal system size (kW), panel count, and roof space requirements based on consumption and location-specific solar irradiance.
- **Financial Dashboard:** Create interactive visualizations for installation costs, monthly savings, payback periods, and lifetime financial benefits.
- **Environmental Impact:** Include a "CO₂ offset" counter to show the environmental benefits (e.g., equivalent trees planted).

### User Experience (UX)
- **Interactive Results:** Use animated counters and charts to provide a premium, "wow" experience when results load.
- **Location Picker:** Integrate a map to allow users to verify or pin their building location for precise irradiance data.

## Verification Plan
- **Calculation Validation:** Cross-reference calculations with standard solar calculators (like PVWatts) for known inputs.
- **OCR Accuracy:** Test with multiple electricity bill samples from various regions (specifically Uttarakhand).
- **Responsive Design:** Ensure the dashboard is fully functional and visually appealing on mobile devices.

## Tech Stack Required
- **Frontend:** React + Vite, Shadcn/UI, Recharts
- **Backend:** Node.js + Express
- **Database:** Supabase (optional for data persistence)
- **AI/ML/APIs:** 
  - Google Gemini API or OpenAI GPT-4o (for bill parsing and insights)
  - NASA POWER API or NREL PVWatts API (for solar irradiance data)
  - Tesseract.js or Google Vision API (for OCR)
- **Hosting:** Vercel (Frontend), Railway (Backend)
