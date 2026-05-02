'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { markCommissionsPaid } from '@/lib/actions/commissions'

interface Props {
  staffId: string
  weekNumber: number
  year: number
  amount: number
}

export function MarkPaidButton({ staffId, weekNumber, year, amount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    const result = await markCommissionsPaid(staffId, weekNumber, year)
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success(`${amount.toLocaleString('fr-FR')} FCFA marqués comme payés`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="rounded-lg bg-[#E85D04] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60 transition-opacity"
    >
      {loading ? '...' : 'Payer'}
    </button>
  )
}
