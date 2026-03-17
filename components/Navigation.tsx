'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import AuthModal from './AuthModal'

export default function Navigation() {
  const { user, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [showUserMenu, setShowUserMenu] = useState(false)

  function openLogin() {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  function openSignUp() {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  return (
    <>
      <nav className="bg-cream-50 border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="font-serif text-xl tracking-wide text-stone-900">
                Wanderlist
              </a>
              <div className="hidden md:flex items-center gap-6">
                <a href="/" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                  Search
                </a>
                <a href="/discover" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                  Discover
                </a>
                {user && (
                  <a href="/trips" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                    My Trips
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-20 h-9 bg-cream-200 rounded-md animate-pulse"></div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-stone-900 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-900 text-cream-50 flex items-center justify-center text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-cream-300 rounded-lg shadow-lg z-20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-cream-200">
                          <p className="text-xs text-stone-500">Signed in as</p>
                          <p className="text-sm text-stone-900 truncate">{user.email}</p>
                        </div>
                        <a 
                          href="/trips"
                          className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-100 transition-colors"
                        >
                          <i className="fa-solid fa-suitcase mr-2 text-stone-400"></i>
                          My Trips
                        </a>
                        <button
                          onClick={() => {
                            signOut()
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-100 transition-colors"
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket mr-2 text-stone-400"></i>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <button 
                    onClick={openLogin}
                    className="btn-outline px-4 py-2 text-sm rounded-md"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={openSignUp}
                    className="btn-primary px-4 py-2 text-sm rounded-md"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  )
}
