import React, { useEffect, useRef, useState } from 'react';
import './SolarIQ.css';
import { useSolarPipeline } from '../hooks/useSolarPipeline';

export default function SolarIQ() {
  const { status, results, error, run, reset } = useSolarPipeline();
  const [uploadState, setUploadState] = useState('idle'); // idle, scanning, data, ready, complete
  const [pinState, setPinState] = useState('waiting'); // waiting, pinned
  const [coords, setCoords] = useState(null);
  const [simulatedData, setSimulatedData] = useState(null);
  const [activeStep, setActiveStep] = useState('01');
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [manualKwh, setManualKwh] = useState(350);
  const [manualRoofArea, setManualRoofArea] = useState('');

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
      leafletMap.current = window.L.map(mapRef.current, { zoomControl: false }).setView([30.3165, 78.0322], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OS contributors'
      }).addTo(leafletMap.current);

      leafletMap.current.on('click', function(e) {
        leafletMap.current.eachLayer(layer => { if (layer instanceof window.L.Marker) leafletMap.current.removeLayer(layer); });
        window.L.marker(e.latlng).addTo(leafletMap.current);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setPinState('pinned');
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

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
      leafletMap.current.setView([lat, lng], 14);
      leafletMap.current.eachLayer(layer => { if (layer instanceof window.L.Marker) leafletMap.current.removeLayer(layer); });
      window.L.marker([lat, lng]).addTo(leafletMap.current);
    }
  };

  const handleDrop = () => {
    setUploadState('scanning');
    
    const pBar = document.getElementById('progressBarFill');
    const sStatus = document.getElementById('scanStatus');
    
    setTimeout(() => { if(pBar) pBar.style.width = '30%'; if(sStatus) sStatus.innerText = 'Extracting load requirements...'; }, 100);
    setTimeout(() => { if(pBar) pBar.style.width = '70%'; if(sStatus) sStatus.innerText = 'Identifying DISCOM tariffs...'; }, 300);
    setTimeout(() => { if(pBar) pBar.style.width = '100%'; if(sStatus) sStatus.innerText = 'Finalizing...'; }, 500);
    
    setTimeout(() => {
      setUploadState('data');
      setSimulatedData({ monthlyKwh: 350, sanctionedLoad: 4, provider: 'UPCL DISCOM', period: 'Last 12 Months' });
      
      const sData = document.getElementById('scannedData');
      if (sData) sData.style.display = 'block';
      const rows = sData?.querySelectorAll('.scanned-row') || [];
      rows.forEach((r, i) => {
        setTimeout(() => {
          r.style.opacity = '1';
          r.style.transform = 'translateY(0)';
        }, i * 50 + 50);
      });
      
      setTimeout(() => {
        setUploadState('ready');
      }, rows.length * 50 + 100);
    }, 600);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (activeTab === 'manual') {
      if (manualKwh && pinState === 'pinned') {
        run({
          monthlyKwh: parseInt(manualKwh, 10),
          location: coords,
          roofAreaSqFt: parseInt(manualRoofArea, 10) || 800
        });
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      if (uploadState === 'ready' && pinState === 'pinned') {
        run({
          monthlyKwh: simulatedData.monthlyKwh,
          location: coords,
          roofAreaSqFt: 800 // default mock space for demo
        });
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Dashboard reveal and charts
  useEffect(() => {
    if (status === 'success' && results) {
      setUploadState('complete');
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
    const yearlyCosts = res.financials.yearlyData.map(() => res.financials.installCost);
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

  const handleDownloadPDF = (e) => {
    e.preventDefault();
    if (!window.html2pdf) {
      alert("PDF generating library is not loaded yet.");
      return;
    }
    
    const element = document.getElementById('dashboard');
    const OriginalOverflow = element.style.overflow;
    
    const opt = {
      margin:       0.2,
      filename:     'SolarMind_Engineering_Blueprint.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1200 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        if(element) element.style.overflow = OriginalOverflow;
    });
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={`solariq-theme ${theme === 'light' ? 'light-mode' : ''}`}>
      <div className="scroll-progress" id="progressBar"></div>

      <nav>
          <div className="logo">Solar<strong>Mind</strong></div>
          <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
              <a href="#how" style={{color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase'}}>How It Works</a>
              <a href="#demo" style={{color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase'}}>Demo</a>
              <button onClick={toggleTheme} className="btn-icon" style={{background: 'none', border:'none', cursor:'pointer', color:'inherit', display:'flex', alignItems:'center'}}>
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>
              <a href="#dashboard" className="btn btn-outline" style={{padding: '0.6rem 1.2rem', fontSize: '0.8rem'}}>Impact &rarr;</a>
          </div>
      </nav>

      {/* SCREEN 1: HERO */}
      <section className="hero" id="hero">
          <div className="hero-text" style={{maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
              <h1 className="serif hero-title-anim" style={{marginBottom: '1.5rem'}}>
                Solar clarity <br/> for every Indian homeowner.
              </h1>
              <p className="subline" style={{marginBottom: '2.5rem'}}>AI-powered feasibility analysis for Indian homeowners based on actual DISCOM data. Precision engineering without the visual noise.</p>
              <div className="hero-cta"><a href="#demo" className="btn btn-filled">Analyze My Home &rarr;</a></div>
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
                  <p>Drop your recent electricity bill. Our AI instantly securely reads your consumption data.</p>
              </div>
              <div className="step-item step-trigger" data-step="02">
                  <h3>OCR Extraction</h3>
                  <p>We extract your sanctioned load, monthly units, tariff rates, and DISCOM provider silently in seconds.</p>
              </div>
              <div className="step-item step-trigger" data-step="03">
                  <h3>Pin Location</h3>
                  <p>Drop a pin on your roof. We analyze local solar irradiance and weather patterns.</p>
              </div>
              <div className="step-item step-trigger" data-step="04">
                  <h3>AI Analysis</h3>
                  <p>Cross-referencing your consumption with your geometry to calculate the optimal panel layout.</p>
              </div>
              <div className="step-item step-trigger" data-step="05">
                  <h3>System Sizing</h3>
                  <p>Generating the precise kW requirement to offset your bills and maximize ROI.</p>
              </div>
              <div className="step-item step-trigger" data-step="06">
                  <h3>Your Report</h3>
                  <p>Receive a comprehensive, beautifully detailed blueprint for your solar transition.</p>
              </div>
          </div>
      </section>

      {/* SCREEN 3: DEMO */}
      <section className="upload-section" id="demo">
          <div className="upload-title reveal">
              <span className="process-tag" style={{color:'var(--green)', letterSpacing: '3px', fontWeight:600}}>LIVE DEMO</span>
              <h2 className="serif" style={{fontSize: '4rem', marginTop: '1rem', marginBottom: '0.5rem'}}>Generate Your Analysis</h2>
              <p style={{opacity: 0.6, fontSize: '1.1rem'}}>Try the simulator using context for Dehradun, Uttarakhand.</p>
          </div>

          <div className="interactive-card reveal">
              <div className="tab-menu" style={{display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', gap: '1.5rem', padding: '0 1.5rem'}}>
                  <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')} style={{background:'none', border:'none', padding:'1rem 0', color: activeTab==='upload'?'var(--amber)':'inherit', borderBottom: activeTab==='upload'?'2px solid var(--amber)':'none', cursor:'pointer', fontWeight: 600}}>Upload Bill</button>
                  <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')} style={{background:'none', border:'none', padding:'1rem 0', color: activeTab==='manual'?'var(--amber)':'inherit', borderBottom: activeTab==='manual'?'2px solid var(--amber)':'none', cursor:'pointer', fontWeight: 600}}>Manual Entry</button>
              </div>

              <div className="interactive-main">
                  <div className="upload-zone">
                      {activeTab === 'upload' ? (
                          <>
                              {uploadState === 'idle' && (
                                <div className="drop-area" id="dropArea" onClick={handleDrop}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:'1rem', opacity:0.5}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}} className="serif">Drop Electricity Bill</h3>
                                    <p style={{fontSize: '0.9rem', opacity: 0.6}}>Click anywhere in this zone to simulate upload</p>
                                </div>
                              )}
                              
                              {uploadState === 'scanning' && (
                                <div className="scan-loader" id="scanLoader" style={{display:'block'}}>
                                    <h4 style={{color:'var(--amber)'}} className="serif">Scanning Document...</h4>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" id="progressBarFill"></div>
                                    </div>
                                    <p style={{fontSize: '0.8rem', opacity: 0.5}} id="scanStatus">Reading text contents...</p>
                                </div>
                              )}

                              {(uploadState === 'data' || uploadState === 'ready' || uploadState === 'complete') && (
                                <div className="scanned-data" id="scannedData">
                                    <div className="scanned-row"><span>Monthly Units</span> <strong>350 kWh</strong></div>
                                    <div className="scanned-row"><span>Sanctioned Load</span> <strong>4 kW</strong></div>
                                    <div className="scanned-row"><span>Provider</span> <strong>UPCL DISCOM</strong></div>
                                    <div className="scanned-row"><span>Bill Period</span> <strong>Last 12 Months</strong></div>
                                    <div style={{marginTop: '1.5rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap:'0.5rem', justifyContent: 'center', fontSize:'0.9rem'}}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Extraction Complete
                                    </div>
                                </div>
                              )}
                          </>
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
                      <div id="map" ref={mapRef}></div>
                  </div>
              </div>

              <div className="cta-container">
                  <div className="status-text" id="coordsText" style={{color: error ? 'red' : (pinState==='pinned'?'var(--green)':'inherit')}}>
                    {error && `Error: ${error}`}
                    {!error && pinState === 'waiting' && 'Waiting for Location Pin...'}
                    {!error && pinState === 'pinned' && `Location Pinned: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
                    {!error && pinState === 'pinned' && (activeTab === 'manual' || uploadState === 'ready') && ' — Ready to Generate'}
                    {!error && status === 'loading' && ' — Generating Models...'}
                  </div>
                  <a href="#dashboard" className={`btn btn-filled ${((activeTab === 'manual' && manualKwh) || uploadState === 'ready' || uploadState === 'complete') && pinState === 'pinned' ? 'ready' : ''}`} id="generateBtn" onClick={handleGenerate}>
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
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🌍</div>
                        <div className="env-val text-green">{results.environmental.lifetimeCO2Tons}</div>
                        <div className="env-label">tons</div>
                        <div className="env-sub">Lifetime CO₂ Offset</div>
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🌳</div>
                        <div className="env-val text-green">{results.environmental.treesEquivalent.toLocaleString('en-IN')}</div>
                        <div className="env-label">trees</div>
                        <div className="env-sub">Trees Equivalent</div>
                    </div>
                    <div className="env-card">
                        <div className="env-icon">🚗</div>
                        <div className="env-val text-green">{results.environmental.carsOffset}</div>
                        <div className="env-label">cars/yr</div>
                        <div className="env-sub">Cars Off Road</div>
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
                        <div className="comp-val text-red">₹{(results.inputData.monthlyKwh * 8).toLocaleString('en-IN')}</div>
                        <div className="comp-sub">per month</div>
                        
                        <div className="comp-bottom">
                            <div>Annual bill: <strong>₹{(results.inputData.monthlyKwh * 8 * 12).toLocaleString('en-IN')}</strong></div>
                            <div className="text-red">25-year total: <strong>₹{(results.inputData.monthlyKwh * 8 * 12 * 25).toLocaleString('en-IN')}</strong></div>
                        </div>
                    </div>
                    <div className="comp-card">
                        <div className="comp-label text-green">WITH SOLAR <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" stroke="none"><circle cx="12" cy="12" r="10"></circle></svg></div>
                        <div className="comp-val text-green">₹{Math.max(0, (results.inputData.monthlyKwh * 8) - results.financials.monthlySavings).toLocaleString('en-IN')}</div>
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
                        <div style={{fontSize:'0.8rem', opacity:0.6}}>SolarMind Intelligence • Phase 6</div>
                    </div>
                </div>
                <div className="advisor-body">
                    <p>Based on your <strong>{results.inputData.monthlyKwh} kWh/month</strong> usage in <strong className="text-amber">{searchQuery || "your area"}</strong>, a <span className="text-amber">{results.sizing.systemSizeKW} kW</span> solar system with <strong>{results.sizing.panelCount} panels</strong> will cover <strong>{results.sizing.coveragePercent}%</strong> of your energy needs.</p>
                    <p>With the MNRE 40% residential subsidy, your net investment is <span className="text-amber">₹{results.financials.installCost.toLocaleString('en-IN')}</span>, which you'll recover in just <span className="text-amber">{results.financials.paybackYears} years</span>. Over 25 years, you'll earn a net return of <strong className="text-green">₹{results.financials.lifetimeSavings.toLocaleString('en-IN')}</strong>.</p>
                    <p>💡 <strong>Next Steps:</strong> Apply for PM Surya Ghar subsidy on pmsuryaghar.gov.in, contact MNRE-approved installers, and consult your DISCOM for net metering registration.</p>
                </div>
                <div className="advisor-footer">ⓘ AI-enhanced recommendations powered by Google Gemini will be available in Phase 6.</div>
            </div>
            
            <div style={{textAlign: 'center', marginTop: '3rem'}}>
              <a href="#" className="btn btn-filled" onClick={handleDownloadPDF} style={{padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '40px', background: 'var(--amber)', color: '#111', fontWeight: 600, textDecoration: 'none', display: 'inline-block'}}>Download Full PDF Report</a>
            </div>
        </section>
      )}

      <footer style={{borderTop: '1px solid var(--glass-border)', marginTop: '2rem'}}>
          <div className="logo">Solar<strong>Mind</strong></div>
          <p>Solar clarity for every Indian homeowner.</p>
          <div style={{opacity: 0.3, fontSize: '0.8rem'}}>Prototype developed for feasibility demonstration. Not real data.</div>
      </footer>
    </div>
  );
}
