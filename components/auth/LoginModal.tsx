'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { useAuthModal } from '@/contexts/AuthModalContext'
import Image from 'next/image'

export function LoginModal() {
    const { isOpen, closeModal } = useAuthModal()
    const router = useRouter()
    const pathname = usePathname()

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const [step, setStep] = useState<1 | 2>(1)
    const [sessionId, setSessionId] = useState('')

    if (!isOpen) return null

    const handleClose = () => {
        setFormData({ identifier: '', password: '' })
        setErrors({})
        setServerError('')
        setStep(1)
        closeModal()
    }

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
            if (isEmail) {
                setStep(2)
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
                    otp: formData.password,
                    redirect: false,
                })
            }

            if (result?.error) {
                setServerError(isEmail ? 'Invalid admin credentials' : 'Invalid or expired OTP')
                setIsLoading(false)
                return
            }

            // Check session
            let session = await getSession()
            let retries = 0
            while (!session?.user && retries < 3) {
                await new Promise(resolve => setTimeout(resolve, 300))
                session = await getSession()
                retries++
            }

            // Login Successful! Close modal and refresh to update navbar
            handleClose()
            router.refresh()

            // Navigate if they are on a guest-only page (like the old /auth/signin, though we shouldn't be there anymore)
            if (pathname.includes('/auth/')) {
                if (session?.user?.role === 'ADMIN') {
                    router.push('/admin')
                } else {
                    router.push('/dashboard')
                }
            }

        } catch (error) {
            console.error('Sign in error:', error)
            setServerError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const isEmailAdmin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative z-50 flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all sm:flex-row flex-col max-h-[90vh]">

                {/* Left Side: Promo Image (Hidden on small screens) */}
                <div className="relative hidden w-1/2 bg-teal-50 sm:flex sm:flex-col sm:items-center sm:justify-center p-8 border-r border-teal-100">
                    <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
                    <div className="relative z-10 text-center space-y-6">
                        <h2 className="text-3xl font-bold text-teal-900 leading-tight">
                            Welcome to <br />
                            <span className="text-cta">Halalzi</span>
                        </h2>
                        <h3 className="text-teal-700 italic font-medium">
                            "Bangladesh's Premium E-commerce & Pharmacy"
                        </h3>
                        <div className="bg-white/60 p-6 rounded-xl backdrop-blur-sm shadow-sm space-y-4">
                            <div className="flex items-center space-x-3 text-sm text-teal-800 font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-cta">✓</span>
                                <span>Genuine Medicines & Products</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-teal-800 font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-cta">✓</span>
                                <span>Fast Home Delivery</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-teal-800 font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-cta">✓</span>
                                <span>Easy Monthly Subscriptions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex w-full flex-col justify-center p-8 sm:w-1/2 xs:p-12 relative overflow-y-auto">
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cta sm:hidden">
                                <span className="text-xl font-bold text-white">H</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                Sign in to your account
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Log in to place orders, access your history, special offers and more!
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}>
                            {serverError && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                    <p className="text-sm font-medium text-red-800">{serverError}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {step === 1 ? (
                                    <div>
                                        <label htmlFor="modal-identifier" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Phone Number
                                        </label>
                                        <div className="relative rounded-lg shadow-sm">
                                            <div className="absolute inset-y-0 left-0 flex items-center">
                                                <span className="text-gray-500 sm:text-sm pl-3 pr-2 border-r border-gray-300 pointer-events-none">
                                                    +880
                                                </span>
                                            </div>
                                            <input
                                                id="modal-identifier"
                                                name="identifier"
                                                type="tel"
                                                autoComplete="username"
                                                required
                                                value={formData.identifier}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, identifier: e.target.value })
                                                }
                                                className="block w-full rounded-lg border-0 py-2.5 pl-16 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 transition-all"
                                                placeholder="1XXXXXXXXX"
                                            />
                                        </div>
                                        {errors.identifier && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                                <span className="mr-1">⚠</span> {errors.identifier}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1.5">
                                            <label htmlFor="modal-password">
                                                {isEmailAdmin ? 'Admin Password' : 'Enter 6-digit OTP'}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="text-cta hover:text-cta-dark hover:underline transition-all"
                                            >
                                                Change {isEmailAdmin ? 'Email' : 'Number'}
                                            </button>
                                        </div>
                                        <input
                                            id="modal-password"
                                            name="password"
                                            type={isEmailAdmin ? 'password' : 'text'}
                                            autoComplete={isEmailAdmin ? 'current-password' : 'one-time-code'}
                                            required
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            className="block w-full rounded-lg border-0 py-2.5 text-center text-lg tracking-widest text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:leading-6 transition-all"
                                            placeholder={isEmailAdmin ? 'Enter password' : '------'}
                                            maxLength={isEmailAdmin ? 100 : 6}
                                            autoFocus
                                        />
                                        {!isEmailAdmin && (
                                            <p className="mt-3 text-sm text-center text-gray-500 bg-gray-50 py-2 rounded-md">
                                                Sent to {formData.identifier}
                                            </p>
                                        )}
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative flex w-full justify-center rounded-lg bg-cta px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-cta-dark hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Please wait...
                                        </span>
                                    ) : step === 1 ? (
                                        'Send OTP'
                                    ) : (
                                        'Verify & Sign In'
                                    )}
                                </button>
                            </div>

                            {step === 1 && (
                                <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
                                    By continuing, you agree to our <br />
                                    <a href="#" className="font-medium text-cta hover:underline">Terms & Conditions</a>, <a href="#" className="font-medium text-cta hover:underline">Privacy Policy</a> & <a href="#" className="font-medium text-cta hover:underline">Refund-Return Policy</a>
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
