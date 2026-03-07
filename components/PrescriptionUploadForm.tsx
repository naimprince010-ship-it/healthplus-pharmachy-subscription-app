import { useState, useRef } from 'react'
import { Upload, FileText, Image as ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { trackPrescriptionUpload } from '@/lib/trackEvent'

interface PrescriptionUploadFormProps {
  hideHeader?: boolean
  compact?: boolean
}

export default function PrescriptionUploadForm({ hideHeader = false, compact = false }: PrescriptionUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fileError, setFileError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File | null): boolean {
    setFileError('')

    if (!file) return true

    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    if (file.size > maxSize) {
      setFileError('ফাইলের সাইজ ৫MB এর কম হতে হবে')
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      setFileError('শুধুমাত্র JPG, JPEG, PNG, এবং PDF ফাইল গ্রহণযোগ্য')
      return false
    }

    return true
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (validateFile(file)) {
      setSelectedFile(file)
    } else {
      e.target.value = ''
      setSelectedFile(null)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      setFileError('দয়া করে আপনার প্রেসক্রিপশন ফাইলটি সিলেক্ট করুন')
      return
    }

    const form = e.currentTarget
    setLoading(true)
    setError('')
    setFileError('')
    setSuccess(false)

    const formData = new FormData(form)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে')
      }

      trackPrescriptionUpload(data.prescription?.id)
      form.reset()
      setSelectedFile(null)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'আপলোড ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${compact ? '' : 'rounded-2xl bg-white p-6 shadow-xl lg:p-5'} pb-2`}>
      {!hideHeader && (
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-sm">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">প্রেসক্রিপশন আপলোড করুন</h2>
            <p className="text-sm text-gray-500">আমরা ১০ মিনিটের মধ্যে ব্যবস্থা নেব</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-800 border border-green-100">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            <strong>সফল!</strong> আপনার প্রেসক্রিপশন জমা হয়েছে। আমরা শীঘ্রই আপনাকে কল করব।
          </p>
        </div>
      )}

      {(error || fileError) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error || fileError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700">
              পুরো নাম
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              placeholder="আপনার নাম লিখুন"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-gray-700">
              ফোন নম্বর
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              pattern="^(\+?88)?01[3-9]\d{8}$"
              title="সঠিক ফোন নম্বর দিন"
              className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              placeholder="017XXXXXXXX"
            />
          </div>
        </div>

        <div>
          <label htmlFor="zoneId" className="mb-1.5 block text-sm font-semibold text-gray-700">
            ডেলিভারি জোন
          </label>
          <select
            id="zoneId"
            name="zoneId"
            required
            className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
          >
            <option value="">আপনার জোন নির্বাচন করুন</option>
            <option value="1">ঢাকা সেন্ট্রাল</option>
            <option value="2">ঢাকা উত্তর</option>
            <option value="3">ঢাকা দক্ষিণ</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            প্রেসক্রিপশন ফাইল
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${selectedFile
                ? 'border-teal-500 bg-teal-50/30'
                : 'border-gray-200 bg-gray-50/50 hover:border-teal-400 hover:bg-gray-50'
              }`}
          >
            <input
              type="file"
              id="file"
              name="file"
              ref={fileInputRef}
              required
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    {selectedFile.type === 'application/pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-bold text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                  <Upload className="h-6 w-6 text-teal-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">ফাইল আপলোড করতে এখানে ক্লিক করুন</p>
                <p className="mt-1 text-xs text-gray-500">JPG, PNG অথবা PDF (সর্বোচ্চ ৫MB)</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-teal-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-teal-700 active:scale-[0.98] disabled:bg-gray-400"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>আপলোড হচ্ছে...</span>
            </div>
          ) : (
            <span>প্রেসক্রিপশন জমা দিন</span>
          )}
        </button>
      </form>
    </div>
  )
}
