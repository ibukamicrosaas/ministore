'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { PinInput } from '@/components/ui/PinInput'
import { signIn } from '@/lib/actions/auth'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { TRIAL_DAYS } from '@/constants'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  // Afrique
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',          dial: '+221', placeholder: '77 000 00 00' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",    dial: '+225', placeholder: '07 00 00 00 00' },
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin',            dial: '+229', placeholder: '97 00 00 00' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso',     dial: '+226', placeholder: '70 00 00 00' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',             dial: '+223', placeholder: '70 00 00 00' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo',             dial: '+228', placeholder: '90 00 00 00' },
  // Europe & Canada
  { code: 'FR', flag: '🇫🇷', name: 'France',           dial: '+33',  placeholder: '6 00 00 00 00' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique',         dial: '+32',  placeholder: '470 00 00 00' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourg',       dial: '+352', placeholder: '621 000 000' },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse',           dial: '+41',  placeholder: '76 000 00 00' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',           dial: '+1',   placeholder: '514 000 0000' },
]

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [dialCode, setDialCode] = useState<string>(COUNTRIES[0].dial)
  const [localNumber, setLocalNumber] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]

  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    // pointerdown couvre souris + tactile avec le bon target sur iOS/iPadOS
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!localNumber.trim()) {
      setError('Entre ton numéro de téléphone.')
      return
    }
    setLoading(true)

    const formData = new FormData()
    formData.set('phone', `${dialCode}${localNumber.replace(/\s/g, '')}`)
    formData.set('pin', pin)

    try {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      // redirect() throws internally in Next.js on success — ignore it
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      {/* Onglets — la création de compte passe exclusivement par /start */}
      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-200 p-1">
          <div className="flex-1 rounded-md py-2 text-sm font-medium text-center bg-[var(--color-primary)] text-white shadow-sm">
            Connexion
          </div>
          <Link
            href="/start"
            className="flex-1 rounded-md py-2 text-sm font-medium text-center text-gray-600 hover:text-gray-900 transition-all"
          >
            Créer un compte
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Numéro de téléphone avec sélecteur de pays */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Numéro WhatsApp
          </label>
          <div className="flex rounded-xl border border-gray-200 overflow-visible focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
            {/* Sélecteur pays */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCountryOpen(o => !o)}
                className="flex h-full items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-l-xl"
              >
                <span className="text-base">{currentCountry.flag}</span>
                <span className="font-medium">{currentCountry.dial}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
              </button>

              {countryOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                  {COUNTRIES.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setDialCode(country.dial)
                        setLocalNumber('')
                        setCountryOpen(false)
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                        dialCode === country.dial ? 'text-[var(--color-primary)] font-medium bg-sky-50' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-base">{country.flag}</span>
                      <span className="flex-1 text-left">{country.name}</span>
                      <span className="text-gray-400">{country.dial}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Champ numéro */}
            <input
              type="tel"
              inputMode="tel"
              value={localNumber}
              onChange={e => setLocalNumber(e.target.value)}
              placeholder={currentCountry.placeholder}
              className="flex-1 px-3 py-3 text-sm text-gray-900 outline-none bg-white placeholder:text-gray-400"
              autoComplete="tel-local"
              required
            />
          </div>
        </div>

        {/* Code PIN */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Code PIN
            </label>
            <Link href="/login/reset-pin" className="text-xs text-[var(--color-primary)] hover:underline">
              PIN oublié ?
            </Link>
          </div>
          <PinInput name="pin" length={6} onChange={setPin} />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || pin.length < 6}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
        >
          {loading ? 'Chargement...' : 'Se connecter'}
        </button>
      </form>
    </Card>
  )
}
