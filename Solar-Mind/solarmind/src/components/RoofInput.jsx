import { FiHome, FiGrid, FiBook, FiBriefcase, FiBox, FiHelpCircle, FiZap } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const BUILDING_TYPES = [
  { id: 'house', icon: <FiHome />, name: 'House', defaultArea: 500 },
  { id: 'apartment', icon: <FiGrid />, name: 'Apartment', defaultArea: 200 },
  { id: 'school', icon: <FiBook />, name: 'School / College', defaultArea: 2000 },
  { id: 'office', icon: <FiBriefcase />, name: 'Office', defaultArea: 1000 },
  { id: 'factory', icon: <FiBox />, name: 'Factory / Warehouse', defaultArea: 5000 },
  { id: 'other', icon: <FiHelpCircle />, name: 'Other', defaultArea: '' },
]

export default function RoofInput({ formData, updateFormData }) {
  const handleBuildingSelect = (type) => {
    updateFormData({
      buildingType: type.id,
      roofAreaSqFt: type.defaultArea.toString(),
    })
  }

  const panels = Math.floor(Number(formData.roofAreaSqFt) / 18)
  const systemSize = ((panels * 400) / 1000).toFixed(1) // 400W per panel

  return (
    <div className="animate-fadeInUp space-y-8">
      <div className="flex items-center gap-3">
        <FiGrid className="text-primary text-2xl" />
        <h2 className="text-on-surface-variant tracking-wide uppercase text-sm font-bold">Roof / Available Area</h2>
      </div>

      <p className="text-on-surface-variant/70 text-sm leading-relaxed mb-8">
        Select your building type to apply an estimated footprint, or enter the precise square footage available for solar panels.
      </p>

      {/* Building Type Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {BUILDING_TYPES.map((type) => (
          <button
            key={type.id}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 group ${
              formData.buildingType === type.id
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-surface-container border-outline-variant/10 hover:border-primary/40 hover:bg-surface-container-high'
            }`}
            onClick={() => handleBuildingSelect(type)}
          >
            <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
              formData.buildingType === type.id ? 'text-primary' : 'text-on-surface-variant/50'
            }`}>
              {type.icon}
            </div>
            <div className={`text-xs font-bold tracking-tight text-center ${
              formData.buildingType === type.id ? 'text-on-surface' : 'text-on-surface-variant'
            }`}>
              {type.name}
            </div>
            {type.defaultArea && (
              <div className="text-[10px] text-on-surface-variant/50 font-mono italic">
                ~{type.defaultArea} sq ft
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Manual Area Input Area */}
      <div className="space-y-4">
        <label className="block text-on-surface-variant text-[10px] uppercase tracking-widest font-bold px-1">
          Total Available Area (sq ft)
        </label>
        <div className="relative group max-w-md">
          <input
            type="number"
            className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary transition-all appearance-none outline-none"
            placeholder="e.g. 500"
            value={formData.roofAreaSqFt}
            onChange={(e) => updateFormData({ roofAreaSqFt: e.target.value })}
            min="50"
            max="100000"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm pointer-events-none">
            sq ft
          </div>
        </div>
      </div>

      {/* Capacity Estimation Summary Card */}
      <AnimatePresence>
        {formData.roofAreaSqFt > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="p-6 bg-gradient-to-br from-[#1abdff]/10 to-[#8fd5ff]/5 border border-[#1abdff]/20 rounded-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-tertiary/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10 grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="text-on-tertiary-container/60 text-[10px] font-bold uppercase tracking-widest">
                  Panel Capacity
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-tertiary text-3xl font-black">{panels}</span>
                  <span className="text-on-surface-variant text-xs font-medium">standard panels</span>
                </div>
              </div>
              
              <div className="space-y-1 border-l border-outline-variant/20 pl-8">
                <div className="text-on-tertiary-container/60 text-[10px] font-bold uppercase tracking-widest">
                  Est. System Size
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-primary text-3xl font-black tracking-tighter">{systemSize}</span>
                  <span className="text-on-surface-variant text-xs font-medium uppercase font-bold">kWp</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <p className="text-[10px] text-on-surface-variant/70 italic">
                *Estimates based on standard 400W monocrystalline PERC panels.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
