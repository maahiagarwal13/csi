import { motion } from 'framer-motion'
import { FiWifi, FiCpu, FiCheckCircle } from 'react-icons/fi'

const STEPS = [
  { icon: FiWifi, label: 'Fetching solar irradiance data', sub: 'NASA POWER API · Your location' },
  { icon: FiCpu, label: 'Running solar sizing engine', sub: 'Phases 3–5 · Financial & environmental models' },
  { icon: FiCheckCircle, label: 'Preparing your solar report', sub: 'Generating visualizations' },
]

export default function LoadingPipeline({ loadingStep = 1 }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center solar-glow px-4 py-24">
      {/* Pulsing Sun */}
      <motion.div
        className="relative mb-16"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Outer rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute inset-0 rounded-full border border-primary/20"
            style={{ margin: `-${ring * 20}px` }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: ring * 0.3 }}
          />
        ))}
        {/* Core sun */}
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.5)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <span className="text-4xl select-none">☀️</span>
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.h2
        className="text-2xl md:text-3xl font-bold text-on-surface text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Analyzing Your Solar Potential
      </motion.h2>
      <motion.p
        className="text-on-surface-variant text-center mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        This takes just a moment…
      </motion.p>

      {/* Step Progress */}
      <div className="w-full max-w-md flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const stepNum = i + 1
          const isDone = loadingStep > stepNum
          const isActive = loadingStep === stepNum
          const isPending = loadingStep < stepNum
          const Icon = step.icon

          return (
            <motion.div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                isDone
                  ? 'bg-primary/10 border-primary/30'
                  : isActive
                  ? 'bg-surface-container border-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  : 'bg-surface-container-low border-outline-variant/10 opacity-40'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              {/* Icon / Spinner */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-primary/20'
                    : isActive
                    ? 'bg-primary/10'
                    : 'bg-surface-container-highest'
                }`}
              >
                {isDone ? (
                  <FiCheckCircle className="text-primary text-xl" />
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="text-primary text-xl" />
                  </motion.div>
                ) : (
                  <Icon className="text-on-surface-variant text-xl" />
                )}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isActive || isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-on-surface-variant truncate">{step.sub}</p>
              </div>

              {/* Badge */}
              {isDone && (
                <span className="text-xs font-bold text-primary shrink-0">Done</span>
              )}
              {isActive && (
                <motion.span
                  className="text-xs font-bold text-primary shrink-0"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  Running…
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
