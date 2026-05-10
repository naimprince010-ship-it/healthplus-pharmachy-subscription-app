'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { LoginSettings, DEFAULT_LOGIN_SETTINGS, fetchSettings } from '@/lib/admin/settings'

const signinSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required')
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        const isBdPhone = /^(?:\+?8801|01|1)[3-9]\d{8}$/.test(val.replace(/[\s-]/g, ''))
        return isEmail || isBdPhone
      },
      { message: 'Enter a valid email or Bangladesh phone number' }
    ),
  password: z.string().min(1, 'Password is required'),
})

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    const callbackUrl = searchParams.get('callbackUrl')
    const isValidCallback = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
    const destination =
      isValidCallback && callbackUrl !== '/'
        ? callbackUrl
        : session.user.role === 'ADMIN'
          ? '/admin'
          : '/dashboard'

    router.replace(destination)
    router.refresh()
  }, [router, searchParams, session, status])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')
    setIsLoading(true)

    // Basic phone validation before sending
    const isBdPhone = /^(?:\+?8801|01|1)[3-9]\d{8}$/.test(formData.identifier.replace(/[\s-]/g, ''))
    // Also allow email for admin fallback
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)

    if (!isBdPhone && !isEmail) {
      setErrors({ identifier: 'Enter a valid Bangladesh phone number' })
      setIsLoading(false)
      return
    }

    try {
      // Admin password fallback trigger (if they enter an email, we just show the password field)
      if (isEmail) {
        setStep(2) // We will treat step 2 slightly differently if it's an email
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.identifier }),
      })

      const data = await response.json()

      if (!response.ok) {
        setServerError(data.error || 'Failed to send OTP')
        setIsLoading(false)
        return
      }

      setSessionId(data.sessionId)
      setStep(2)
    } catch (error) {
      console.error('Send OTP error:', error)
      setServerError('An error occurred while sending OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')
    setIsLoading(true)

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)

    try {
      let result

      if (isEmail) {
        // Admin password login
        result = await signIn('credentials', {
          identifier: formData.identifier,
          password: formData.password,
          redirect: false,
        })
      } else {
        // Normal user OTP login
        if (!/^\d{6}$/.test(formData.password)) {
          setErrors({ password: 'OTP must be 6 digits' })
          setIsLoading(false)
          return
        }

        result = await signIn('credentials', {
          sessionId,
          otp: formData.password, // we're reusing the password field in state for the OTP
          redirect: false,
        })
      }

      if (result?.error) {
        setServerError(isEmail ? 'Invalid admin credentials' : 'Invalid or expired OTP')
        setIsLoading(false)
        return
      }

      const callbackUrl = searchParams.get('callbackUrl')
      const isValidCallback = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')

      if (isValidCallback && callbackUrl !== '/') {
        router.push(callbackUrl)
        router.refresh()
        return
      }

      let session = await getSession()
      let retries = 0
      while (!session?.user && retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 300))
        session = await getSession()
        retries++
      }

      if (session?.user?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (error) {
      console.error('Sign in error:', error)
      setServerError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const isEmailAdmin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-yellow-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white relative z-10">
        <div>
          <div className="flex justify-center">
            <div className="rounded-2xl bg-teal-50 p-3 shadow-inner border border-teal-100">
               <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
               </svg>
            </div>
          </div>
          <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to access your Halalzi account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}>
          {serverError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{serverError}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {step === 1 ? (
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="tel"
                  autoComplete="username"
                  required
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm transition-all"
                  placeholder="01XXXXXXXXX"
                />
                {errors.identifier && (
                  <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                  <label htmlFor="password">
                    {isEmailAdmin ? 'Admin Password' : 'Enter 6-digit Verification Code (OTP)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-teal-600 hover:underline text-xs"
                  >
                    Change {isEmailAdmin ? 'Email' : 'Number'}
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type={isEmailAdmin ? 'password' : 'text'}
                  autoComplete={isEmailAdmin ? 'current-password' : 'one-time-code'}
                  required
                  value={formData.password}
                  onChange={(e) => {
                    const value = isEmailAdmin
                      ? e.target.value
                      : e.target.value.replace(/\D/g, '').slice(0, 6)
                    setFormData({ ...formData, password: value })
                  }}
                  className="mt-2 block w-full tracking-widest text-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-lg transition-all"
                  placeholder={isEmailAdmin ? 'Enter password' : '------'}
                  maxLength={isEmailAdmin ? 100 : 6}
                  inputMode={isEmailAdmin ? undefined : 'numeric'}
                />
                {!isEmailAdmin && (
                  <p className="mt-2 text-xs text-center text-gray-500">
                    Sent to {formData.identifier}
                  </p>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-cta px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-cta-dark hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Verify & Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
