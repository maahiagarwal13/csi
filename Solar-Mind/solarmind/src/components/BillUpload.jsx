import { useState, useRef, useCallback } from 'react'
import { FiUploadCloud, FiFile, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { BsLightningCharge } from 'react-icons/bs'

export default function BillUpload({ formData, updateFormData, hideControls = false }) {
  const [activeTab, setActiveTab] = useState(hideControls ? 'upload' : (formData.inputMethod || 'upload'))
  const [file, setFile] = useState(null)
  const [ocrStatus, setOcrStatus] = useState('idle') // idle | processing | done | error
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrConfidence, setOcrConfidence] = useState('')
  const [ocrNotes, setOcrNotes] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const processBillWithAI = async (imageFile) => {
    setOcrStatus('processing')
    setOcrProgress(30)

    try {
      // Convert image to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(imageFile)
      })

      setOcrProgress(60)

      // Determine media type
      const mediaTypeMap = {
        'image/jpeg': 'image/jpeg',
        'image/jpg': 'image/jpeg',
        'image/png': 'image/png',
        'image/webp': 'image/webp',
      }
      const mediaType = mediaTypeMap[imageFile.type] || 'image/jpeg'

      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64Data },
                },
                {
                  type: 'text',
                  text: `This is an Indian electricity bill. Extract the monthly electricity consumption in kWh (kilowatt-hours).

Look for fields labelled: "Units Consumed", "Total Units", "Net Units", "Energy Consumed", "kWh", "Units", "Consumption" or similar. On bi-monthly bills, divide the total by 2 to get the monthly figure.

Respond in this exact JSON format and nothing else:
{
  "monthlyKwh": <number or null>,
  "billingPeriod": "<monthly|bimonthly|unknown>",
  "confidence": "<high|medium|low>",
  "rawValue": "<the exact text you found on the bill>",
  "notes": "<any relevant observations, or empty string>"
}

If you cannot find a consumption value, set monthlyKwh to null.`,
                },
              ],
            },
          ],
        }),
      })

      setOcrProgress(90)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')

      // Strip markdown fences if present
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      setOcrProgress(100)

      if (parsed.monthlyKwh && parsed.monthlyKwh > 0) {
        const kwh = Math.round(parsed.monthlyKwh)
        updateFormData({
          monthlyKwh: kwh.toString(),
          billingPeriod: parsed.billingPeriod || 'monthly',
          inputMethod: 'upload',
        })
        setOcrStatus('done')
        setOcrConfidence(parsed.confidence || 'high')
        setOcrNotes(parsed.notes || '')
      } else {
        setOcrStatus('error')
        if (!hideControls) setActiveTab('manual')
        updateFormData({ inputMethod: 'manual' })
      }
    } catch (err) {
      console.error('AI bill parsing failed:', err)
      setOcrStatus('error')
      if (!hideControls) setActiveTab('manual')
      updateFormData({ inputMethod: 'manual' })
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowed.includes(selectedFile.type)) {
      alert('Please upload an image (PNG, JPG, WebP) or PDF.')
      return
    }
    setFile(selectedFile)
    if (selectedFile.type === 'application/pdf') {
      // PDFs: ask user to switch to manual entry or re-upload as image
      setOcrStatus('error')
      if (!hideControls) setActiveTab('manual')
      updateFormData({ inputMethod: 'manual' })
      alert('PDF detected. For best results, please take a photo or screenshot of your bill and upload that instead, or use Manual Entry.')
      return
    }
    processBillWithAI(selectedFile)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFileSelect(dropped)
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const removeFile = () => {
    setFile(null)
    setOcrStatus('idle')
    setOcrProgress(0)
    setOcrConfidence('')
    setOcrNotes('')
    updateFormData({ monthlyKwh: '', inputMethod: 'manual' })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const confidenceColor = ocrConfidence === 'high' ? '#2ECC7A' : ocrConfidence === 'medium' ? '#F5A623' : '#FF5252'

  return (
    <div className={hideControls ? '' : 'animate-fadeInUp'}>
      {!hideControls && (
        <>
          <div className="flex items-center gap-3 mb-10">
            <BsLightningCharge className="text-primary text-2xl" />
            <h2 className="text-on-surface-variant tracking-wide uppercase text-sm font-bold">Monthly Electricity Consumption</h2>
          </div>

          {/* Mode Toggle Tabs */}
          <div className="flex bg-surface-container-highest p-1.5 rounded-full w-fit mb-8">
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-primary text-on-primary shadow-lg animate-fadeInUp'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Bill
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-primary text-on-primary shadow-lg animate-fadeInUp'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => {
                setActiveTab('manual')
                updateFormData({ inputMethod: 'manual' })
              }}
            >
              Manual Entry
            </button>
          </div>
        </>
      )}

      {activeTab === 'upload' ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {/* Dropzone */}
          {!file && (
            <div
              style={{
                border: `2px dashed ${dragOver ? '#F5A623' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '12px',
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(245,166,35,0.05)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.3s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div style={{width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'}}>
                <FiUploadCloud style={{fontSize: '1.8rem', color: '#F5A623'}} />
              </div>
              <p style={{fontWeight: 600, marginBottom: '0.25rem'}}>Drop your electricity bill here</p>
              <p style={{fontSize: '0.8rem', opacity: 0.5}}>Supports JPG, PNG, WebP (Max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                style={{display: 'none'}}
              />
            </div>
          )}

          {/* File Preview */}
          {file && (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{width: '3rem', height: '3rem', background: 'rgba(245,166,35,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <FiFile style={{fontSize: '1.2rem', color: '#F5A623'}} />
                </div>
                <div>
                  <div style={{fontWeight: 600, fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{file.name}</div>
                  <div style={{fontSize: '0.75rem', opacity: 0.5}}>{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                style={{padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, borderRadius: '50%'}} 
                onClick={removeFile}
              >
                <FiX style={{fontSize: '1.2rem'}} />
              </button>
            </div>
          )}

          {/* Processing Status */}
          {ocrStatus === 'processing' && (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'}}>
              <div style={{width: '1.5rem', height: '1.5rem', border: '2px solid #F5A623', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0}}></div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '0.9rem', opacity: 0.8, fontWeight: 500}}>Reading bill with AI...</div>
                <div style={{marginTop: '0.5rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'}}>
                  <div style={{height: '100%', background: '#F5A623', borderRadius: '3px', transition: 'width 0.5s ease', width: `${ocrProgress}%`}} />
                </div>
              </div>
            </div>
          )}

          {/* Success Status */}
          {ocrStatus === 'done' && formData.monthlyKwh && (
            <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', background: 'rgba(46,204,122,0.1)', border: '1px solid rgba(46,204,122,0.3)', borderRadius: '12px'}}>
              <div style={{width: '2.5rem', height: '2.5rem', background: 'rgba(46,204,122,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <FiCheck style={{fontSize: '1.2rem', color: '#2ECC7A'}} />
              </div>
              <div>
                <div style={{fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.6, marginBottom: '0.25rem'}}>
                  Detected Monthly Consumption
                  {ocrConfidence && (
                    <span style={{marginLeft: '0.5rem', textTransform: 'none', fontWeight: 400, color: confidenceColor}}>
                      · {ocrConfidence} confidence
                    </span>
                  )}
                </div>
                <div style={{fontSize: '1.3rem', fontWeight: 700, color: '#2ECC7A'}}>{formData.monthlyKwh} kWh</div>
                {ocrNotes && (
                  <div style={{fontSize: '0.75rem', opacity: 0.6, marginTop: '0.35rem', fontStyle: 'italic'}}>{ocrNotes}</div>
                )}
                <div style={{fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem'}}>
                  Not right?{' '}
                  <button
                    style={{background: 'none', border: 'none', color: '#F5A623', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}
                    onClick={() => {
                      if (!hideControls) setActiveTab('manual')
                      updateFormData({ inputMethod: 'manual' })
                    }}
                  >
                    Edit manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Status */}
          {ocrStatus === 'error' && (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', borderRadius: '12px'}}>
              <div style={{width: '2.5rem', height: '2.5rem', background: 'rgba(255,82,82,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <FiAlertTriangle style={{fontSize: '1.2rem', color: '#FF5252'}} />
              </div>
              <div style={{fontSize: '0.9rem', opacity: 0.8}}>
                Couldn't automatically read the consumption from this bill. Please enter it manually using the <strong>Manual Entry</strong> tab — it only takes a second.
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Entry Form */
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-on-surface-variant text-[10px] uppercase tracking-widest font-bold px-1">Average Monthly Usage (kWh)</label>
            <div className="relative group">
              <input
                type="number"
                className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary transition-all appearance-none outline-none"
                placeholder="e.g. 450"
                value={formData.monthlyKwh}
                onChange={(e) => updateFormData({ monthlyKwh: e.target.value })}
                min="0"
                max="50000"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm pointer-events-none">kWh</div>
            </div>
          </div>

          <div className="space-y-2 hidden">
            <label className="block text-on-surface-variant text-[10px] uppercase tracking-widest font-bold px-1">Average Monthly Bill Amount (optional)</label>
            <div className="relative group">
              <input
                type="number"
                className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 pl-12 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary transition-all appearance-none outline-none"
                placeholder="e.g. 3800"
                min="0"
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm pointer-events-none">₹</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-on-surface-variant text-[10px] uppercase tracking-widest font-bold px-1">Billing Period</label>
            <div className="relative">
              <select
                className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none appearance-none"
                value={formData.billingPeriod}
                onChange={(e) => updateFormData({ billingPeriod: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="bimonthly">Bi-Monthly</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                ▼
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
