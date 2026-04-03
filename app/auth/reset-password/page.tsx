'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

function hasRecoveryHash(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hash
  return h.includes('type=recovery') || h.includes('access_token')
}

export default function ResetPasswordPage() {
  const [canReset, setCanReset] = useState(false)
  const [waited, setWaited] = useState(false)
  const [hasRecoveryUrl, setHasRecoveryUrl] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setHasRecoveryUrl(hasRecoveryHash())

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash
      if (session && (hash.includes('type=recovery') || hash.includes('access_token'))) {
        setCanReset(true)
      }
    })

    const t = window.setTimeout(() => setWaited(true), hasRecoveryHash() ? 10000 : 2500)

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(t)
    }
  }, [])

  const showInvalid = waited && !canReset && !success && !hasRecoveryUrl
  const showLinkFailed = waited && !canReset && !success && hasRecoveryUrl

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSuccess(true)
  }

  return (
    <main className="min-h-screen bg-cream-100">
      <Navigation />
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-serif text-stone-900 mb-2">Set a new password</h1>

        {success ? (
          <div className="bg-white border border-cream-300 rounded-xl p-6 mt-6">
            <p className="text-stone-600 mb-4">
              Your password has been updated. You can sign in with your new password.
            </p>
            <Link
              href="/"
              className="btn-primary inline-block px-5 py-2.5 rounded-md text-sm font-medium"
            >
              Back to Wanderlist
            </Link>
          </div>
        ) : showInvalid || showLinkFailed ? (
          <div className="bg-white border border-cream-300 rounded-xl p-6 mt-6">
            <p className="text-stone-600 mb-4">
              {showLinkFailed
                ? 'We could not verify this reset link. It may have expired. Request a new link from the sign-in window.'
                : 'Open this page from the password reset link in your email, or request a new link from the sign-in window.'}
            </p>
            <Link href="/" className="text-stone-900 font-medium text-sm hover:underline">
              ← Home
            </Link>
          </div>
        ) : !canReset ? (
          <p className="text-stone-500 text-sm mt-4 flex items-center gap-2">
            <i className="fa-solid fa-circle-notch animate-spin"></i>
            Verifying your reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-cream-300 rounded-xl p-6 mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-stone-700 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full px-4 py-3 rounded-md"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field w-full px-4 py-3 rounded-md"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 rounded-md font-medium disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Updating…
                </span>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
