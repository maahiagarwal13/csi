import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend,
} from 'recharts'
import {
  FiSun, FiZap, FiDollarSign, FiTrendingUp,
  FiWind, FiRefreshCw, FiDownload, FiInfo,
} from 'react-icons/fi'

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = 0) {
  const [value, setValue] = useState(start)
  useEffect(() => {
    if (target === 0) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return value
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, unit, sub, color = 'text-primary', delay = 0 }) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  const animated = useCountUp(isNaN(num) ? 0 : num, 1600)

  return (
    <motion.div
      className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 flex flex-col gap-3 relative overflow-hidden group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
      <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${color}`}>
        <Icon className="text-xl" />
      </div>
      <div>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>
          {isNaN(num) ? value : animated.toLocaleString('en-IN')}
          <span className="text-lg font-normal text-on-surface-variant ml-1">{unit}</span>
        </p>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ─── Section Heading ────────────────────────────────────────────────────────
function SectionHeading({ children, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-on-surface">{children}</h2>
      {sub && <p className="text-on-surface-variant text-sm mt-1">{sub}</p>}
    </div>
  )
}

// ─── Custom Chart Tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="font-bold text-on-surface mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {prefix}{Number(p.value).toLocaleString('en-IN')}{suffix}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function ResultsDashboard({ results, onReset }) {
  const { sizing, financials, environmental, solarData, inputData } = results

  const monthlyBill = Math.round((inputData.monthlyKwh * 8))
  const postSolarBill = Math.max(0, monthlyBill - financials.monthlySavings)

  const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen solar-glow pb-32 pt-8 px-4">
      <div className="max-w-5xl mx-auto w-full">

        {/* ── Top Bar ─────────────────────────────────────── */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
          {...fadeInUp} transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-on-surface">
              Your <span className="solar-gradient-text">Solar Report</span>
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {inputData.locationName || 'Your location'} · {inputData.monthlyKwh} kWh/month · {inputData.roofAreaSqFt} sq ft roof
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low text-sm font-semibold transition-all active:scale-95"
            >
              <FiRefreshCw className="text-base" /> Recalculate
            </button>
          </div>
        </motion.div>

        {/* ── Section 1: Hero Metrics ──────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <MetricCard delay={0.05} icon={FiSun} label="System Size" value={sizing.systemSizeKW} unit="kW" sub="Optimal for your usage" />
          <MetricCard delay={0.1} icon={FiZap} label="Solar Panels" value={sizing.panelCount} unit="panels" sub="400W each, 18 sq ft each" />
          <MetricCard delay={0.15} icon={FiTrendingUp} label="Payback Period" value={financing(financials.paybackYears)} unit="yrs" sub="With MNRE 40% subsidy" />
          <MetricCard delay={0.2} icon={FiDollarSign} label="Lifetime Savings" value={financials.lifetimeSavings} unit="₹" sub="Over 25 years (net)" color="text-emerald-400" />
        </div>

        {/* ── Section 2: Coverage & Feasibility ───────────── */}
        <motion.div
          className="bg-surface-container-low rounded-2xl p-6 mb-8 border border-outline-variant/10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-1">Energy Coverage</p>
              <p className="text-2xl font-bold text-on-surface">
                <span className="solar-gradient-text">{sizing.coveragePercent}%</span> of your monthly usage covered
              </p>
            </div>
            {!sizing.roofFeasible && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300 max-w-sm">
                <FiInfo className="shrink-0 mt-0.5" />
                <span>Your roof area limits coverage to {sizing.coveragePercent}%. Consider ground-mount for full capacity.</span>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${sizing.coveragePercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </motion.div>

        {/* ── Section 3: Monthly Generation Chart ─────────── */}
        <motion.div
          className="bg-surface-container-low rounded-2xl p-6 mb-8 border border-outline-variant/10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <SectionHeading sub="Estimated solar generation per month based on NASA irradiance data">
            Monthly Generation (kWh)
          </SectionHeading>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sizing.monthlyGenData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix=" kWh" />} />
              <Bar dataKey="generation" name="Generation" fill="url(#solarGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── Section 4: 25-Year Savings Timeline ─────────── */}
        <motion.div
          className="bg-surface-container-low rounded-2xl p-6 mb-8 border border-outline-variant/10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          <SectionHeading sub="Cumulative electricity savings vs total investment cost over 25 years">
            25-Year Cost vs. Savings (₹)
          </SectionHeading>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={financials.yearlyData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Year', position: 'insideBottom', fill: '#9ca3af', fontSize: 11, offset: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="cumulativeSavings" name="Cumulative Savings" stroke="#10b981" fill="url(#savingsGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cumulativeCost" name="Total Investment" stroke="#f59e0b" fill="url(#costGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: 'Install Cost (after subsidy)', val: `₹${financials.installCost.toLocaleString('en-IN')}`, color: 'text-amber-400' },
              { label: 'Subsidy Saved', val: `₹${financials.subsidyAmount.toLocaleString('en-IN')}`, color: 'text-primary' },
              { label: 'Break Even', val: `Year ${financials.paybackYears}`, color: 'text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-container rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${item.color}`}>{item.val}</p>
                <p className="text-xs text-on-surface-variant">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Section 5: Environmental Impact ─────────────── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <SectionHeading sub="Your lifetime environmental contribution">
            🌿 Environmental Impact
          </SectionHeading>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '💨', label: 'Annual CO₂ Offset', value: environmental.annualCO2Tons, unit: 'tons/yr' },
              { emoji: '🌍', label: 'Lifetime CO₂ Offset', value: environmental.lifetimeCO2Tons, unit: 'tons' },
              { emoji: '🌳', label: 'Trees Equivalent', value: environmental.treesEquivalent, unit: 'trees' },
              { emoji: '🚗', label: 'Cars Off Road', value: environmental.carsOffset, unit: 'cars/yr' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.07 }}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-2xl font-bold text-emerald-400">
                  {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
                </p>
                <p className="text-xs text-on-surface-variant">{item.unit}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Section 6: With vs Without Solar ────────────── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        >
          <SectionHeading sub="Monthly electricity bill comparison">
            ⚡ With vs. Without Solar
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Without Solar */}
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-4">Without Solar</p>
              <p className="text-4xl font-bold text-red-400">₹{monthlyBill.toLocaleString('en-IN')}</p>
              <p className="text-sm text-on-surface-variant mt-1">per month</p>
              <div className="mt-4 pt-4 border-t border-outline-variant/10 text-sm text-on-surface-variant">
                <p>Annual bill: <strong className="text-on-surface">₹{(monthlyBill * 12).toLocaleString('en-IN')}</strong></p>
                <p className="mt-1">25-year total: <strong className="text-red-400">₹{(monthlyBill * 12 * 25).toLocaleString('en-IN')}</strong></p>
              </div>
            </div>
            {/* With Solar */}
            <div className="bg-surface-container-low border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <p className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-4">With Solar ☀️</p>
              <p className="text-4xl font-bold text-emerald-400">₹{postSolarBill.toLocaleString('en-IN')}</p>
              <p className="text-sm text-on-surface-variant mt-1">per month (est.)</p>
              <div className="mt-4 pt-4 border-t border-outline-variant/10 text-sm text-on-surface-variant">
                <p>Monthly savings: <strong className="text-emerald-400">₹{financials.monthlySavings.toLocaleString('en-IN')}</strong></p>
                <p className="mt-1">Annual savings: <strong className="text-emerald-400">₹{financials.annualSavings.toLocaleString('en-IN')}</strong></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Section 7: AI Insights Panel (Phase 6 placeholder) ── */}
        <motion.div
          className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">AI Solar Advisor</p>
              <p className="text-xs text-on-surface-variant">SolarMind Intelligence · Phase 6</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl p-5 text-sm text-on-surface leading-relaxed">
            <p>
              Based on your <strong className="text-primary">{inputData.monthlyKwh} kWh/month</strong> usage
              {inputData.locationName ? ` in <strong className="text-primary">${inputData.locationName}</strong>` : ''}, 
              a <strong className="text-primary">{sizing.systemSizeKW} kW</strong> solar system with{' '}
              <strong className="text-primary">{sizing.panelCount} panels</strong> will cover{' '}
              <strong className="text-primary">{sizing.coveragePercent}%</strong> of your energy needs.
            </p>
            <p className="mt-3">
              With the MNRE 40% residential subsidy, your net investment is{' '}
              <strong className="text-primary">₹{financials.installCost.toLocaleString('en-IN')}</strong>, 
              which you&apos;ll recover in just{' '}
              <strong className="text-primary">{financials.paybackYears} years</strong>.
              Over 25 years, you&apos;ll earn a net return of{' '}
              <strong className="text-emerald-400">₹{financials.lifetimeSavings.toLocaleString('en-IN')}</strong>.
            </p>
            {!sizing.roofFeasible && (
              <p className="mt-3 text-amber-300">
                ⚠️ <strong>Note:</strong> Your roof space ({inputData.roofAreaSqFt} sq ft) is slightly limited for full capacity. 
                Consider a ground-mounted system or bifacial panels to maximize generation.
              </p>
            )}
            <p className="mt-3 text-on-surface-variant">
              💡 <strong>Next Steps:</strong> Apply for PM Surya Ghar subsidy on pmsuryaghar.gov.in, 
              contact MNRE-approved installers, and consult your DISCOM for net metering registration.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant/50">
            <FiInfo className="text-xs" />
            <span>AI-enhanced recommendations powered by Gemini will be available in Phase 6.</span>
          </div>
        </motion.div>

        {/* ── Technical Details ────────────────────────────── */}
        <motion.details
          className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        >
          <summary className="cursor-pointer text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            Show Technical Details
          </summary>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-on-surface-variant">
            {[
              ['Avg Daily Irradiance', `${solarData.avgIrradiance} kWh/m²/day`],
              ['Peak Sun Hours', `${solarData.peakSunHours} hrs`],
              ['Daily Generation', `${sizing.generation.daily} kWh`],
              ['Performance Ratio', '78%'],
              ['Panel Wattage', '400W'],
              ['Data Source', 'NASA POWER API'],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface-container rounded-lg px-3 py-2">
                <p className="font-semibold text-on-surface-variant">{k}</p>
                <p className="text-primary font-mono mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </motion.details>

      </div>
    </div>
  )
}

// helper: format floats nicely
function financing(val) {
  return parseFloat(val)
}
