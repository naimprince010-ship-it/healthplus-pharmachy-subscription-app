'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
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
        const isBdPhone = /^(?:\+?880|0)1[3-9]\d{8}$/.test(val.replace(/\s+/g, ''))
        return isEmail || isBdPhone
      },
      { message: 'Enter a valid email or Bangladesh phone number' }
    ),
  password: z.string().min(1, 'Password is required'),
})

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [sessionId, setSessionId] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')
    setIsLoading(true)

    // Basic phone validation before sending
    const isBdPhone = /^(?:\+?880|0)1[3-9]\d{8}$/.test(formData.identifier.replace(/\s+/g, ''))
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
        if (formData.password.length < 6) {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
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
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full tracking-widest text-center rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-lg"
                  placeholder={isEmailAdmin ? 'Enter password' : '------'}
                  maxLength={isEmailAdmin ? 100 : 6}
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
              className="group relative flex w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
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
