import React, { useEffect, useRef, useState } from 'react';
import './SolarIQ.css';
import { useSolarPipeline } from '../hooks/useSolarPipeline';
import BillUpload from './BillUpload';

export default function SolarIQ() {
  const { status, results, error, run, reset } = useSolarPipeline();
  const [pinState, setPinState] = useState('waiting'); // waiting, pinned
  const [coords, setCoords] = useState(null);
  const [activeStep, setActiveStep] = useState('01');
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [manualKwh, setManualKwh] = useState(350);
  const [manualRoofArea, setManualRoofArea] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // BillUpload form data state
  const [formData, setFormData] = useState({
    monthlyKwh: '',
    billingPeriod: 'monthly',
    inputMethod: 'manual',
  });
  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Search logic states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const cursorRef = useRef(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const barChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // 1. Progress & Parallax logic
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / docHeight) * 100;
      const pBar = document.getElementById('progressBar');
      if (pBar) pBar.style.width = scrollPercent + '%';
    };

    const parallaxEls = document.querySelectorAll('.parallax');
    const handleMouseMove = (e) => {
      if (parallaxEls.length > 0 && window.innerWidth > 768) {
        requestAnimationFrame(() => {
          const mouseX = e.clientX, mouseY = e.clientY;
          parallaxEls.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed') || '0');
            const x = (window.innerWidth / 2 - mouseX) * speed;
            const y = (window.innerHeight / 2 - mouseY) * speed;
            el.style.transform = `translate(${x}px, ${y}px)`;
          });
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 2. Intersection Observers
  useEffect(() => {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.id === 'installers') {
            const items = entry.target.querySelectorAll('.load-stagger');
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('visible'), i * 150);
            });
          }
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    const stepItems = document.querySelectorAll('.step-trigger');
    const stepObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stepItems.forEach(el => el.classList.remove('active'));
          entry.target.classList.add('active');
          setActiveStep(entry.target.getAttribute('data-step'));
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    stepItems.forEach(el => stepObs.observe(el));

    return () => {
      revealObs.disconnect();
      stepObs.disconnect();
    };
  }, []);

  // Set up Map
  useEffect(() => {
    if (window.L && mapRef.current && !leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current, { zoomControl: false }).setView([30.3165, 78.0322], 15);

      // Start with satellite: Google Satellite (full India coverage) + Esri labels
      window.L.tileLayer(
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        { attribution: '© Google', maxZoom: 20 }
      ).addTo(leafletMap.current);
      window.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { attribution: '', maxZoom: 19, opacity: 0.8 }
      ).addTo(leafletMap.current);

      // Helper: remove only marker layers, not tile layers
      const clearMarkers = (map) => {
        map.eachLayer(layer => {
          if (layer instanceof window.L.Marker) map.removeLayer(layer);
        });
      };

      leafletMap.current.on('click', function(e) {
        clearMarkers(leafletMap.current);
        window.L.marker(e.latlng).addTo(leafletMap.current);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setPinState('pinned');
        // Clamp zoom to avoid missing tiles
        leafletMap.current.setView([e.latlng.lat, e.latlng.lng], Math.min(leafletMap.current.getZoom(), 16));
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    setCoords({ lat, lng });
    setPinState('pinned');
    setSearchResults([]);
    setSearchQuery(item.display_name.split(',')[0]); // Use short name for display

    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], 15);
      leafletMap.current.eachLayer(layer => { if (layer instanceof window.L.Marker) leafletMap.current.removeLayer(layer); });
      window.L.marker([lat, lng]).addTo(leafletMap.current);
    }
  };

  const getEffectiveKwh = () => {
    if (activeTab === 'manual') return parseInt(manualKwh, 10) || 0;
    return parseInt(formData.monthlyKwh, 10) || 0;
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const kwh = getEffectiveKwh();
    if (kwh > 0 && pinState === 'pinned') {
      run({
        monthlyKwh: kwh,
        location: coords,
        roofAreaSqFt: parseInt(manualRoofArea, 10) || 800
      });
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dashboard reveal and charts
  useEffect(() => {
    if (status === 'success' && results) {
      setTimeout(() => {
        renderCharts(results);
      }, 100);
      
      // Animate counters
      document.querySelectorAll('.counter').forEach((el) => {
        let target = parseFloat(el.getAttribute('data-target'));
        let c = 0;
        const inc = target / 40;
        const int = setInterval(() => {
            c += inc;
            if(c >= target) {
                el.innerText = target % 1 === 0 ? target : target.toFixed(1);
                clearInterval(int);
            } else {
                el.innerText = c % 1 === 0 ? Math.ceil(c) : c.toFixed(1);
            }
        }, 30);
      });

      // Animate Trees
      document.querySelectorAll('.tree-svg').forEach((el, i) => {
          setTimeout(() => el.classList.add('grown'), i * 150);
      });
    }
  }, [status, results]);

  const renderCharts = (res) => {
    if (!window.Chart) return;
    window.Chart.defaults.font.family = 'Inter';
    window.Chart.defaults.color = '#666';

    [barChartRef, lineChartRef].forEach(ref => {
      if (ref.current && ref.current.chartInstance) {
        ref.current.chartInstance.destroy();
      }
    });

    const monthlyGen = res.sizing.monthlyGenData.map(d => d.generation);

    if (barChartRef.current) {
      barChartRef.current.chartInstance = new window.Chart(barChartRef.current, {
        type: 'bar',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                data: monthlyGen,
                backgroundColor: '#F5A623',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: {duration: 1500}, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: {display: false} }, x: { grid: { display: false }, border: {display: false} } } }
      });
    }

    const yearlySavings = res.financials.yearlyData.map(d => d.cumulativeSavings);
    const yearlyCosts = res.financials.yearlyData.map(d => d.cumulativeCost);
    const years = res.financials.yearlyData.map(d => d.year);

    if (lineChartRef.current) {
      lineChartRef.current.chartInstance = new window.Chart(lineChartRef.current, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Cumulative Savings',
                data: yearlySavings,
                borderColor: '#2ECC7A',
                backgroundColor: 'rgba(46, 204, 122, 0.15)',
                fill: true,
                tension: 0
            }, {
                label: 'Total Investment',
                data: yearlyCosts,
                borderColor: '#F5A623',
                borderDash: [0, 0],
                tension: 0,
                pointRadius: 0,
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: {duration: 2000, delay: 500}, plugins: { legend: { position: 'bottom', labels: {usePointStyle: true, boxWidth: 8} } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: {display: false}, ticks: { callback: function(value) { return '₹'+(value/100000)+'L' } } }, x: { grid: { display: false }, border: {display: false} } } }
      });
    }
  };

  const handleDownloadPDF = async (e) => {
    e.preventDefault();
    if (!window.html2pdf) {
      alert('PDF library not loaded yet. Please wait a moment and try again.');
      return;
    }

    const source = document.getElementById('dashboard');
    if (!source) return;

    // Direct DOM manipulation for loading feedback (React can't repaint while html2canvas blocks the thread)
    const btn = e.currentTarget;
    if (btn.dataset.busy === 'true') return;
    btn.dataset.busy = 'true';
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span style="width:1.2rem;height:1.2rem;border:2px solid #333;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;display:inline-block"></span> Generating PDF...';
    btn.style.background = '#999';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';

    // Yield TWO frames to guarantee the browser paints the loading state
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))));

    // Force Chart.js instances to re-draw their canvas pixels before capture
    if (barChartRef.current?.chartInstance) barChartRef.current.chartInstance.update();
    if (lineChartRef.current?.chartInstance) lineChartRef.current.chartInstance.update();

    // Clone the node so we can safely mutate styles without affecting the live UI
    const clone = source.cloneNode(true);
    clone.style.position = 'relative';
    clone.style.overflow = 'visible';
    clone.style.width = '1100px';
    clone.style.background = '#FCFBF8';
    clone.style.color = '#2c2c2c';
    clone.style.padding = '40px';
    clone.style.fontFamily = 'Inter, sans-serif';

    // Remove the download button from the clone so it doesn't appear in the PDF
    const btnInClone = clone.querySelector('[data-pdf-hide]');
    if (btnInClone) btnInClone.remove();

    // Copy the live canvas pixel content into the cloned canvas elements
    const liveCanvases = source.querySelectorAll('canvas');
    const cloneCanvases = clone.querySelectorAll('canvas');
    liveCanvases.forEach((liveCanvas, i) => {
      const cloneCanvas = cloneCanvases[i];
      if (cloneCanvas) {
        cloneCanvas.width = liveCanvas.width;
        cloneCanvas.height = liveCanvas.height;
        cloneCanvas.getContext('2d').drawImage(liveCanvas, 0, 0);
      }
    });

    // Attach the clone off-screen so html2canvas can measure it
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'SolarMind_Solar_Report.pdf',
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FCFBF8',
        logging: false,
        windowWidth: 1100,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await window.html2pdf().set(opt).from(clone).save();
    } finally {
      document.body.removeChild(clone);
      btn.innerHTML = originalText;
      btn.style.background = 'var(--amber)';
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      btn.dataset.busy = 'false';
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={`solariq-theme ${theme === 'light' ? 'light-mode' : ''}`}>
      <div className="scroll-progress" id="progressBar"></div>

      <nav>
          <div className="logo">Solar<strong>Mind</strong></div>
          <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
              <a href="#how" style={{color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase'}}>How It Works</a>
              <a href="#analyze" style={{color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase'}}>Analyze</a>
              <button onClick={toggleTheme} className="btn-icon" style={{background: 'none', border:'none', cursor:'pointer', color:'inherit', display:'flex', alignItems:'center'}}>
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>
              <a href="#analyze" className="btn btn-outline" style={{padding: '0.6rem 1.2rem', fontSize: '0.8rem'}}>Get Started &rarr;</a>
          </div>
      </nav>

      {/* SCREEN 1: HERO */}
      <section className="hero" id="hero">
          <div className="hero-text" style={{maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
              <h1 className="serif hero-title-anim" style={{marginBottom: '1.5rem'}}>
                Know your roof's solar potential. <br/> In under a minute.
              </h1>
              <p className="subline" style={{marginBottom: '2.5rem'}}>Upload your electricity bill. Drop a pin. SolarMind runs the numbers — real NASA irradiance data, MNRE subsidy logic, and a 25-year ROI model — so you don't have to guess.</p>
              <div className="hero-cta"><a href="#analyze" className="btn btn-filled">Analyze My Home &rarr;</a></div>
              <div style={{opacity: 0, animation: 'sublineReveal 1s 2.5s forwards', fontSize: '0.8rem', letterSpacing: '1.5px', marginTop: '2.5rem', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap'}}>
                <span>☀️ NASA POWER Data</span>
                <span>·</span>
                <span>🏛️ MNRE Subsidy Logic</span>
                <span>·</span>
                <span>📊 25-Year ROI Model</span>
              </div>
          </div>

          <div className="scroll-indicator">
              <div className="chevron"></div>
              Scroll
          </div>
      </section>

      {/* SCREEN 2: HOW */}
      <section className="process-section" id="how" data-theme="light">
          <div className="process-left">
              <div className="process-tag">THE PROCESS</div>
              <div className="step-number" id="stepIndicator">{activeStep}</div>
          </div>
          <div className="process-right">
              <div className="step-item active step-trigger" data-step="01">
                  <h3>Upload Bill</h3>
                  <p>Drop your recent electricity bill PDF or image. Our OCR engine reads your monthly kWh consumption, sanctioned load, and billing period — no manual entry needed.</p>
                  <div className="step-detail">Supports UPCL, TPDDL, MSEDCL, BESCOM and most Indian DISCOM bill formats</div>
              </div>
              <div className="step-item step-trigger" data-step="02">
                  <h3>OCR Extraction</h3>
                  <p>Powered by Tesseract.js, we extract four key fields: monthly units consumed, sanctioned load in kW, applicable tariff slab, and your DISCOM provider — all in under 3 seconds.</p>
                  <div className="step-detail">No data is stored or transmitted. All processing happens in your browser.</div>
              </div>
              <div className="step-item step-trigger" data-step="03">
                  <h3>Pin Location</h3>
                  <p>Drop a pin anywhere on the map — your rooftop, your neighbourhood, your city. We query NASA's POWER Climatology API to retrieve 22 years of solar irradiance averages for that exact coordinate.</p>
                  <div className="step-detail">Solar irradiance varies by up to 35% across India — location precision directly affects accuracy</div>
              </div>
              <div className="step-item step-trigger" data-step="04">
                  <h3>AI Analysis</h3>
                  <p>Your monthly consumption pattern is cross-referenced against the irradiance profile for your location. We account for panel performance ratio, inverter losses, and seasonal generation variation month by month.</p>
                  <div className="step-detail">Uses a 0.78 performance ratio and NASA ALLSKY_SFC_SW_DWN parameter for each month</div>
              </div>
              <div className="step-item step-trigger" data-step="05">
                  <h3>System Sizing</h3>
                  <p>The engine outputs your optimal system capacity in kW, the exact number of 400W panels needed, the roof space required, and your monthly energy coverage percentage — constrained by your available area.</p>
                  <div className="step-detail">Output: system kW · panel count · roof sq ft · % coverage · daily/monthly/annual generation</div>
              </div>
              <div className="step-item step-trigger" data-step="06">
                  <h3>Your Report</h3>
                  <p>A complete solar blueprint: 25-year savings projection with panel degradation, MNRE 40% subsidy applied, payback period, CO₂ offset, and an AI-written plain-language recommendation. Downloadable as a PDF.</p>
                  <div className="step-detail">Includes PM Surya Ghar subsidy guidance and DISCOM net metering next steps</div>
              </div>
          </div>
      </section>

      {/* SCREEN 3: ANALYZE */}
      <section className="upload-section" id="analyze">
          <div className="upload-title reveal">
              <span className="process-tag" style={{color:'var(--green)', letterSpacing: '3px', fontWeight:600}}>GET STARTED</span>
              <h2 className="serif" style={{fontSize: '4rem', marginTop: '1rem', marginBottom: '0.5rem'}}>Generate Your Analysis</h2>
              <p style={{opacity: 0.6, fontSize: '1.1rem'}}>Enter your electricity consumption and location to get started.</p>
          </div>

          <div className="interactive-card reveal">
              <div className="tab-menu" style={{display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', gap: '1.5rem', padding: '0 1.5rem'}}>
                  <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')} style={{background:'none', border:'none', padding:'1rem 0', color: activeTab==='upload'?'var(--amber)':'inherit', borderBottom: activeTab==='upload'?'2px solid var(--amber)':'none', cursor:'pointer', fontWeight: 600}}>Upload Bill</button>
                  <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')} style={{background:'none', border:'none', padding:'1rem 0', color: activeTab==='manual'?'var(--amber)':'inherit', borderBottom: activeTab==='manual'?'2px solid var(--amber)':'none', cursor:'pointer', fontWeight: 600}}>Manual Entry</button>
              </div>

              <div className="interactive-main">
                  <div className="upload-zone">
                      {activeTab === 'upload' ? (
                          <div style={{padding: '1.5rem', textAlign: 'left', color: theme === 'light' ? 'var(--text-on-light)' : 'var(--text-on-dark)'}}>
                              <BillUpload formData={formData} updateFormData={updateFormData} hideControls />
                          </div>
                      ) : (
                          <div className="manual-entry-form" style={{padding: '1.5rem', textAlign: 'left', color: theme === 'light' ? 'var(--text-on-light)' : 'var(--text-on-dark)'}}>
                              <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                  <label style={{display: 'block', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600}}>Average Monthly Consumption (kWh)</label>
                                  <input type="number" min="0" value={manualKwh} onChange={(e) => setManualKwh(e.target.value)} style={{width: '100%', padding: '1rem', background: theme === 'light' ? '#fff' : '#222', border: '1px solid var(--amber)', color: 'inherit', borderRadius: '4px', fontSize: '1.2rem', fontFamily: 'inherit'}} />
                              </div>
                              <div className="form-group" style={{marginBottom: '2rem'}}>
                                  <label style={{display: 'block', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600}}>Available Roof Area (sq. ft.) <span style={{fontWeight: 400, opacity: 0.6, fontSize: '0.9rem'}}>(Optional)</span></label>
                                  <input type="number" min="0" placeholder="e.g. 800" value={manualRoofArea} onChange={(e) => setManualRoofArea(e.target.value)} style={{width: '100%', padding: '1rem', background: theme === 'light' ? '#fff' : '#222', border: '1px solid var(--amber)', color: 'inherit', borderRadius: '4px', fontSize: '1.2rem', fontFamily: 'inherit'}} />
                              </div>
                              <div className="info-box" style={{background: 'rgba(245, 166, 35, 0.15)', padding: '1.5rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start', border: '1px solid var(--amber)'}}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0, marginTop: '2px'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                  <p style={{margin: 0, fontSize: '1rem', opacity: 1, lineHeight: 1.5}}><strong>Action Required:</strong> Please click on the map to drop a pin on your neighborhood. We use this exact coordinate to pull live climate data.</p>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="map-zone">
                      <div className="search-container">
                          <form onSubmit={handleSearch} style={{display: 'flex', gap: '0.5rem'}}>
                              <input 
                                  type="text" 
                                  className="search-input" 
                                  placeholder="Search for your city or address..." 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                              />
                              <button type="submit" className="search-btn">
                                  {isSearching ? '...' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
                              </button>
                          </form>
                          {searchResults.length > 0 && (
                              <ul className="search-results">
                                  {searchResults.map((item, idx) => (
                                      <li key={idx} onClick={() => selectAddress(item)}>{item.display_name}</li>
                                  ))}
                              </ul>
                          )}
                      </div>
                      <div id="map" ref={mapRef} style={{position: 'relative'}}>
                        <button
                          id="mapToggleBtn"
                          onClick={() => {
                            const map = leafletMap.current;
                            if (!map) return;
                            const btn = document.getElementById('mapToggleBtn');
                            const isSatellite = btn.getAttribute('data-mode') === 'satellite';
                            if (isSatellite) {
                              map.eachLayer(l => { if (!(l instanceof window.L.Marker)) map.removeLayer(l); });
                              window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 }).addTo(map);
                              btn.setAttribute('data-mode', 'street');
                              btn.innerText = '🛰 Satellite';
                            } else {
                              map.eachLayer(l => { if (!(l instanceof window.L.Marker)) map.removeLayer(l); });
                              // Google Satellite + Esri labels
                              window.L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { attribution: '© Google', maxZoom: 20 }).addTo(map);
                              window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { attribution: '', maxZoom: 19, opacity: 0.8 }).addTo(map);
                              // Re-add marker if coords exist
                              if (coords) window.L.marker([coords.lat, coords.lng]).addTo(map);
                              btn.setAttribute('data-mode', 'satellite');
                              btn.innerText = '🗺 Street';
                            }
                          }}
                          data-mode="satellite"
                          style={{
                            position: 'absolute',
                            bottom: '1.5rem',
                            right: '1.5rem',
                            zIndex: 1000,
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            backdropFilter: 'blur(6px)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          🗺 Street
                        </button>
                      </div>
                  </div>
              </div>

              <div className="cta-container">
                  <div className="status-text" id="coordsText" style={{color: error ? 'red' : (pinState==='pinned'?'var(--green)':'inherit')}}>
                    {error && `Error: ${error}`}
                    {!error && pinState === 'waiting' && 'Waiting for Location Pin...'}
                    {!error && pinState === 'pinned' && `Location Pinned: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
                    {!error && pinState === 'pinned' && getEffectiveKwh() > 0 && ' — Ready to Generate'}
                    {!error && status === 'loading' && ' — Generating Models...'}
                  </div>
                  <a href="#dashboard" className={`btn btn-filled ${getEffectiveKwh() > 0 && pinState === 'pinned' ? 'ready' : ''}`} id="generateBtn" onClick={handleGenerate}>
                    {status === 'loading' ? 'Processing...' : (error ? 'Retry Generation \u2192' : 'Generate My Solar Report \u2192')}
                  </a>
              </div>
          </div>
      </section>

      {/* SCREEN 4: DASHBOARD (YOUR SOLAR REPORT) */}
      {status === 'success' && results && (
        <section className="report-container" id="dashboard">
            <div className="report-header">
                <div>
                    <h2 className="report-title">Your Solar Report</h2>
                    <p className="report-subtitle">
                        {searchQuery || "Pinned Location"} • {results.inputData.monthlyKwh} kWh/month • {results.inputData.roofAreaSqFt} sq ft roof
                    </p>
                </div>
                <button className="btn-recalculate" onClick={() => { document.getElementById('hero').scrollIntoView({behavior: 'smooth'}) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
                    Recalculate
                </button>
            </div>

            <div className="tariff-info-card" style={{
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.25)',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
              fontSize: '0.9rem',
            }}>
              <div>
                <span style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Detected State</span>
                <div style={{ fontWeight: 700, color: 'var(--amber)' }}>{results.tariff.stateName}</div>
              </div>
              <div>
                <span style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Effective Rate</span>
                <div style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{results.tariff.effectiveRate}/kWh</div>
              </div>
              <div>
                <span style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Monthly Bill</span>
                <div style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{results.tariff.currentMonthlyBill.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.5, maxWidth: '220px', textAlign: 'right' }}>
                Tariff based on {results.tariff.stateName} SERC slab rates. Actual bill may vary by DISCOM zone.
              </div>
            </div>

            <details style={{ marginBottom: '1.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--amber)', fontWeight: 600 }}>
                View tariff slab breakdown for {results.inputData.monthlyKwh} kWh
              </summary>
              <table style={{ width: '100%', marginTop: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem' }}>Slab</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.75rem' }}>Units</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.75rem' }}>Rate (₹/kWh)</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.75rem' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.tariff.slabBreakdown.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '0.4rem 0.75rem' }}>{row.slab}</td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>{row.units}</td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>₹{row.rate}</td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>₹{row.amount}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.15)', fontWeight: 700 }}>
                    <td style={{ padding: '0.4rem 0.75rem' }}>Fixed Charge</td>
                    <td colSpan={2}></td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>₹{results.tariff.fixedCharge}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    <td style={{ padding: '0.4rem 0.75rem' }}>Total</td>
                    <td colSpan={2}></td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>₹{results.tariff.currentMonthlyBill.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </details>

            <div className="report-kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon text-amber"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg></div>
                    <div className="kpi-label">SYSTEM SIZE</div>
                    <div className="kpi-value text-amber"><span className="counter" data-target={results.sizing.systemSizeKW}>{results.sizing.systemSizeKW}</span> <span className="unit">kW</span></div>
                    <div className="kpi-sub">Optimal for your usage</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon text-amber"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
                    <div className="kpi-label">SOLAR PANELS</div>
                    <div className="kpi-value text-amber"><span className="counter" data-target={results.sizing.panelCount}>{results.sizing.panelCount}</span> <span className="unit">panels</span></div>
                    <div className="kpi-sub">400W each, 18 sq ft each</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon text-amber"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
                    <div className="kpi-label">PAYBACK PERIOD</div>
                    <div className="kpi-value text-amber"><span className="counter" data-target={results.financials.paybackYears}>{results.financials.paybackYears}</span> <span className="unit">yrs</span></div>
                    <div className="kpi-sub">With MNRE 40% subsidy</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon text-green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                    <div className="kpi-label">LIFETIME SAVINGS</div>
                    <div className="kpi-value text-green"><span className="counter" data-target={results.financials.lifetimeSavings}>{results.financials.lifetimeSavings.toLocaleString('en-IN')}</span> <span className="unit">₹</span></div>
                    <div className="kpi-sub">Over 25 years (net)</div>
                </div>
            </div>

            <div className="coverage-card">
                <div className="kpi-label">ENERGY COVERAGE</div>
                <div className="coverage-title">{results.sizing.coveragePercent}% of your monthly usage covered</div>
                <div className="progress-track">
                    <div className="progress-fill" style={{width: `${Math.min(100, results.sizing.coveragePercent)}%`}}></div>
                </div>
            </div>

            <div className="chart-container">
                <div className="chart-header">
                    <h3>Monthly Generation (kWh)</h3>
                    <p>Estimated solar generation per month based on NASA irradiance data</p>
                </div>
                <div className="chart-wrap"><canvas id="barChart" ref={barChartRef}></canvas></div>
            </div>

            <div className="chart-container">
                <div className="chart-header">
                    <h3>25-Year Cost vs. Savings (₹)</h3>
                    <p>Cumulative electricity savings vs total investment cost over 25 years</p>
                </div>
                <div className="chart-wrap"><canvas id="lineChart" ref={lineChartRef}></canvas></div>
                <div className="pill-grid">
                    <div className="pill-card">
                        <div className="pill-val text-amber">₹{results.financials.installCost.toLocaleString('en-IN')}</div>
                        <div className="pill-label">Install Cost (after subsidy)</div>
                    </div>
                    <div className="pill-card">
                        <div className="pill-val text-amber">₹{results.financials.subsidyAmount.toLocaleString('en-IN')}</div>
                        <div className="pill-label">Subsidy Saved</div>
                    </div>
                    <div className="pill-card">
                        <div className="pill-val text-green">Year {results.financials.paybackYears}</div>
                        <div className="pill-label">Break Even</div>
                    </div>
                </div>
            </div>

            <div className="environmental-section">
                <div className="chart-header">
                    <h3 style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><span style={{fontSize:'1.5rem'}}>🌿</span> Environmental Impact</h3>
                    <p>Your lifetime environmental contribution</p>
                </div>
                <div className="env-grid">
                    <div className="env-card">
                        <div className="env-icon">💨</div>
                        <div className="env-val text-green">{results.environmental.annualCO2Tons}</div>
                        <div className="env-label">tons/yr</div>
                        <div className="env-sub">Annual CO₂ Offset</div>
                        <div className="env-context">Same as taking 1 petrol car off the road each year</div>
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🌍</div>
                        <div className="env-val text-green">{results.environmental.lifetimeCO2Tons}</div>
                        <div className="env-label">tons</div>
                        <div className="env-sub">Lifetime CO₂ Offset</div>
                        <div className="env-context">Weight equivalent to {Math.max(1, Math.round(results.environmental.lifetimeCO2Tons / 6))} African elephants in avoided emissions</div>
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🌳</div>
                        <div className="env-val text-green">{results.environmental.treesEquivalent.toLocaleString('en-IN')}</div>
                        <div className="env-label">trees</div>
                        <div className="env-sub">Trees Equivalent</div>
                        <div className="env-context">Planted and grown over the 25-year system life</div>
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🚗</div>
                        <div className="env-val text-green">{results.environmental.carsOffset}</div>
                        <div className="env-label">cars/yr</div>
                        <div className="env-sub">Cars Off Road</div>
                        <div className="env-context">Based on avg Indian car emitting 4.6 tons CO₂/year</div>
                    </div>
                </div>
            </div>

            <div className="comparison-section">
                <div className="chart-header">
                    <h3 style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><svg className="text-amber" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> With vs. Without Solar</h3>
                    <p>Monthly electricity bill comparison</p>
                </div>
                <div className="comp-grid">
                    <div className="comp-card">
                        <div className="comp-label">WITHOUT SOLAR</div>
                        <div className="comp-val text-red">₹{results.tariff.currentMonthlyBill.toLocaleString('en-IN')}</div>
                        <div className="comp-sub">per month</div>
                        
                        <div className="comp-bottom">
                            <div>Annual bill: <strong>₹{(results.tariff.currentMonthlyBill * 12).toLocaleString('en-IN')}</strong></div>
                            <div className="text-red">25-year total: <strong>₹{(results.tariff.currentMonthlyBill * 12 * 25).toLocaleString('en-IN')}</strong></div>
                        </div>
                    </div>
                    <div className="comp-card">
                        <div className="comp-label text-green">WITH SOLAR <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" stroke="none"><circle cx="12" cy="12" r="10"></circle></svg></div>
                        <div className="comp-val text-green">₹{Math.max(0, results.tariff.currentMonthlyBill - results.financials.monthlySavings).toLocaleString('en-IN')}</div>
                        <div className="comp-sub">per month (est.)</div>
                        
                        <div className="comp-bottom">
                            <div className="text-green">Monthly savings: ₹{results.financials.monthlySavings.toLocaleString('en-IN')}</div>
                            <div className="text-green">Annual savings: ₹{results.financials.annualSavings.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="advisor-card">
                <div className="advisor-header">
                    <div className="adv-icon">🤖</div>
                    <div>
                        <strong>AI Solar Advisor</strong>
                        <div style={{fontSize:'0.8rem', opacity:0.6}}>SolarMind Intelligence</div>
                    </div>
                </div>
                <div className="advisor-body">
                    <p>Based on your <strong>{results.inputData.monthlyKwh} kWh/month</strong> usage in <strong className="text-amber">{searchQuery || "your area"}</strong>, a <span className="text-amber">{results.sizing.systemSizeKW} kW</span> solar system with <strong>{results.sizing.panelCount} panels</strong> will cover <strong>{results.sizing.coveragePercent}%</strong> of your energy needs.</p>
                    <p>With the MNRE 40% residential subsidy, your net investment is <span className="text-amber">₹{results.financials.installCost.toLocaleString('en-IN')}</span>, which you'll recover in just <span className="text-amber">{results.financials.paybackYears} years</span>. Over 25 years, you'll earn a net return of <strong className="text-green">₹{results.financials.lifetimeSavings.toLocaleString('en-IN')}</strong>.</p>
                    <p>💡 <strong>Next Steps:</strong> Contact an MNRE-approved installer for a site survey, apply for the 40% PM Surya Ghar residential subsidy, and register for net metering with your local DISCOM.</p>
                </div>
                <div className="advisor-footer">ⓘ Recommendations are based on NASA POWER climate data, MNRE subsidy guidelines, and standard solar engineering constants.</div>
            </div>
            
            <div style={{textAlign: 'center', marginTop: '3rem'}}>
              <a href="#" data-pdf-hide className="btn btn-filled" onClick={handleDownloadPDF} style={{padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '40px', background: 'var(--amber)', color: '#111', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s ease', cursor: 'pointer'}}>Download Full PDF Report</a>
            </div>
        </section>
      )}

      <footer style={{borderTop: '1px solid var(--glass-border)', marginTop: '2rem'}}>
          <div className="logo">Solar<strong>Mind</strong></div>
          <p>Solar clarity for every Indian homeowner.</p>
          <div style={{opacity: 0.3, fontSize: '0.8rem'}}>Calculations are based on NASA POWER climate data and standard solar engineering formulas.</div>
      </footer>
    </div>
  );
}
