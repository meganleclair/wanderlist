'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called when the user closes via backdrop or X (not after a successful login). */
  onDismiss?: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, onDismiss, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, resetPasswordForEmail } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'signup' ? 'signup' : 'login')
      setError('')
      setSuccess('')
    }
  }, [isOpen, initialMode])

  function handleDismiss() {
    onDismiss?.()
    onClose()
  }

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'forgot') {
      const { error } = await resetPasswordForEmail(email.trim())
      if (error) {
        setError(error.message)
      } else {
        setSuccess(
          'If an account exists for that email, you will receive a link to reset your password shortly.'
        )
      }
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        onClose()
        resetForm()
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for a confirmation link!')
      }
    }

    setLoading(false)
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
  }

  function switchMode() {
    setMode(mode === 'signup' ? 'login' : 'signup')
    setError('')
    setSuccess('')
  }

  function goToForgot() {
    setMode('forgot')
    setError('')
    setSuccess('')
  }

  function backToLogin() {
    setMode('login')
    setError('')
    setSuccess('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      ></div>
      
      <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-serif text-stone-900 mb-2">
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'signup'
                ? 'Create an account'
                : 'Forgot password'}
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            {mode === 'login'
              ? 'Sign in to save places and create itineraries'
              : mode === 'signup'
                ? 'Join Wanderlist to start planning your adventures'
                : 'Enter your email and we will send you a link to choose a new password.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full px-4 py-3 rounded-md"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full px-4 py-3 rounded-md"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={goToForgot}
                  className="mt-2 text-sm text-stone-600 hover:text-stone-900 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-md font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  {mode === 'forgot'
                    ? 'Sending…'
                    : mode === 'login'
                      ? 'Signing in...'
                      : 'Creating account...'}
                </span>
              ) : mode === 'forgot' ? (
                'Send reset link'
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {mode === 'forgot' ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={backToLogin}
                className="text-sm text-stone-600 hover:text-stone-900 hover:underline"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i>
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-stone-500 text-sm">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1 text-stone-900 font-medium hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
