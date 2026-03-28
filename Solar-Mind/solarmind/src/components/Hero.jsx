export default function Hero({ onGetStarted }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center p-6 text-center solar-glow">
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Animated Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm animate-fade-in">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          AI-Powered Solar Feasibility
        </div>

        {/* Headlines */}
        <h1 className="h1-mega mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Analyze your rooftop's <span className="solar-gradient-text">solar potential</span> in seconds.
        </h1>
        
        <p className="text-body-large max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          SolarMind combines NASA climate data, real-time irradiance models, and MNRE subsidy figures to build a hyper-accurate financial roadmap for your transition to clean energy.
        </p>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="group relative px-8 py-4 rounded-full bg-primary text-on-primary font-bold text-lg overflow-hidden animate-slide-up hover:shadow-[0_0_40px_rgba(217,119,6,0.3)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative flex items-center gap-2">
            Check My Address
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>

        {/* Feature row */}
        <div className="mt-16 pt-8 border-t border-outline-variant/30 flex flex-wrap justify-center gap-8 text-on-surface-variant text-sm font-medium animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            NASA POWER API
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            MNRE Subsidy Logic
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ROI Projections
          </div>
        </div>
      </div>
    </div>
  )
}
