import { useState, useRef, useCallback } from 'react'
import { FiUploadCloud, FiFile, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { BsLightningCharge } from 'react-icons/bs'
import Tesseract from 'tesseract.js'

export default function BillUpload({ formData, updateFormData }) {
  const [activeTab, setActiveTab] = useState(formData.inputMethod || 'upload')
  const [file, setFile] = useState(null)
  const [ocrStatus, setOcrStatus] = useState('idle') // idle | processing | done | error
  const [ocrProgress, setOcrProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const extractKwhFromText = (text) => {
    // Try common patterns on Indian electricity bills
    const patterns = [
      /(\d{2,5})\s*kwh/i,
      /(\d{2,5})\s*kWh/,
      /units?\s*consumed[:\s]*(\d{2,5})/i,
      /consumption[:\s]*(\d{2,5})/i,
      /total\s*units?[:\s]*(\d{2,5})/i,
      /(\d{2,5})\s*units/i,
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const val = parseInt(match[1])
        if (val >= 50 && val <= 50000) return val
      }
    }
    return null
  }

  const processOCR = async (imageFile) => {
    setOcrStatus('processing')
    setOcrProgress(0)

    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        },
      })

      const text = result.data.text
      const kwh = extractKwhFromText(text)

      if (kwh) {
        updateFormData({ monthlyKwh: kwh.toString(), inputMethod: 'upload' })
        setOcrStatus('done')
      } else {
        setOcrStatus('error')
        // Fall back to manual entry
        setActiveTab('manual')
        updateFormData({ inputMethod: 'manual' })
      }
    } catch (err) {
      console.error('OCR failed:', err)
      setOcrStatus('error')
      setActiveTab('manual')
      updateFormData({ inputMethod: 'manual' })
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowed.includes(selectedFile.type)) {
      alert('Please upload an image (PNG, JPG, WebP) or PDF file.')
      return
    }
    setFile(selectedFile)
    if (selectedFile.type.startsWith('image/')) {
      processOCR(selectedFile)
    }
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
    updateFormData({ monthlyKwh: '', inputMethod: 'manual' })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <div className="animate-fadeInUp">
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

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          {/* Dropzone */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all group/upload cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-primary/10 transition-all duration-300">
                <FiUploadCloud className="text-primary text-3xl" />
              </div>
              <p className="text-on-surface font-semibold mb-1">Drop your electricity bill here</p>
              <p className="text-on-surface-variant text-xs">Supports PDF, JPG, PNG (Max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {/* File Preview */}
          {file && (
            <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiFile className="text-primary text-xl" />
                </div>
                <div>
                  <div className="text-on-surface font-semibold text-sm truncate max-w-[200px] md:max-w-[400px]">
                    {file.name}
                  </div>
                  <div className="text-on-surface-variant text-xs">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error/10 rounded-full" 
                onClick={removeFile}
              >
                <FiX className="text-xl" />
              </button>
            </div>
          )}

          {/* OCR Status Messages */}
          {ocrStatus === 'processing' && (
            <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-on-surface-variant text-sm font-medium">Scanning bill... {ocrProgress}%</div>
            </div>
          )}

          {ocrStatus === 'done' && formData.monthlyKwh && (
            <div className="flex items-center gap-4 p-5 bg-[#004966]/20 border border-[#004966]/50 rounded-xl">
              <div className="w-10 h-10 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center">
                <FiCheck className="text-xl" />
              </div>
              <div>
                <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Detected Monthly Consumption</div>
                <div className="text-tertiary text-xl font-bold">{formData.monthlyKwh} kWh</div>
              </div>
            </div>
          )}

          {ocrStatus === 'error' && (
            <div className="flex items-center gap-4 p-5 bg-error-container/20 border border-error-container/50 rounded-xl">
              <div className="w-10 h-10 bg-error-container text-on-error-container rounded-full flex items-center justify-center">
                <FiAlertTriangle className="text-xl" />
              </div>
              <div className="text-on-surface-variant text-sm">
                Couldn't automatically read consumption from the bill. Please enter it manually in the <strong>Manual Entry</strong> tab.
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
