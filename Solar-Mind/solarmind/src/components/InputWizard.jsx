import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiArrowRight } from 'react-icons/fi'
import BillUpload from './BillUpload'
import LocationPicker from './LocationPicker'
import RoofInput from './RoofInput'

const STEPS = [
  { id: 1, label: 'Energy' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Roof' },
]

export default function InputWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    monthlyKwh: '',
    billingPeriod: '',
    inputMethod: 'manual',
    location: null,
    locationName: '',
    buildingType: '',
    roofAreaSqFt: '',
  })

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.monthlyKwh > 0
      case 2:
        return formData.location !== null
      case 3:
        return formData.roofAreaSqFt > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete({
        monthlyKwh: Number(formData.monthlyKwh),
        billingPeriod: formData.billingPeriod || 'monthly',
        location: formData.location,
        locationName: formData.locationName,
        buildingType: formData.buildingType,
        roofAreaSqFt: Number(formData.roofAreaSqFt),
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  }

  return (
    <main className="flex-grow pt-24 pb-32 px-4 solar-glow relative z-10 w-full min-h-screen flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full">
        
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-12 px-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
              <div className={`flex flex-col items-center gap-3 ${currentStep < step.id ? 'opacity-40' : ''}`}>
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.id 
                      ? 'bg-gradient-to-br from-primary to-primary-container shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                      : currentStep > step.id
                      ? 'bg-surface-container-high border-2 border-primary'
                      : 'border-2 border-outline-variant'
                  }`}
                >
                  {currentStep > step.id ? (
                    <FiCheck className="text-primary text-xl" />
                  ) : (
                    <span className={currentStep === step.id ? 'text-on-primary font-bold' : 'text-on-surface-variant font-bold'}>
                      {step.id}
                    </span>
                  )}
                </div>
                <span className={`${currentStep >= step.id ? 'text-primary' : 'text-on-surface-variant'} text-[10px] uppercase tracking-widest font-bold`}>
                  {step.label}
                </span>
              </div>
              
              {i < STEPS.length - 1 && (
                <div 
                  className={`flex-grow h-[2px] mx-4 mb-6 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-surface-container-low rounded-2xl p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden group border border-outline-variant/5">
          {/* Decorative Subtle Light Leak */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-8 text-on-surface">
              Build Your <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">Solar Plan</span>
            </h1>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && (
                  <BillUpload formData={formData} updateFormData={updateFormData} />
                )}
                {currentStep === 2 && (
                  <LocationPicker formData={formData} updateFormData={updateFormData} />
                )}
                {currentStep === 3 && (
                  <RoofInput formData={formData} updateFormData={updateFormData} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button 
            className={`px-8 py-3 rounded-full font-bold border border-outline-variant/30 transition-all active:scale-95 ${
              currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-primary-fixed-dim hover:bg-surface-container-low opacity-100'
            }`}
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            ← Back
          </button>
          
          <button 
            className={`px-10 py-3 rounded-full font-bold flex items-center gap-2 transition-all duration-300 ${
              canGoNext() 
                ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:opacity-90 hover:scale-105 active:scale-95 group' 
                : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
            }`}
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            {currentStep === 3 ? 'Generate Solar Plan ☀️' : 'Continue'}
            {currentStep !== 3 && (
              <FiArrowRight className={`transition-transform ${canGoNext() ? 'group-hover:translate-x-1' : ''}`} />
            )}
          </button>
        </div>
        
      </div>
      
      {/* Side Decoration (Editorial Asymmetry) */}
      <div className="fixed left-12 bottom-12 hidden xl:block pointer-events-none opacity-20 transition-all duration-500">
        <div className="text-[120px] font-bold text-outline-variant/10 select-none leading-none tracking-tighter">
          0{currentStep}
        </div>
        <div className="h-1 w-24 bg-primary mt-4"></div>
        <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs mt-4">
          System Configuration Phase
        </p>
      </div>
      
    </main>
  )
}
