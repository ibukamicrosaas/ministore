'use client'

import { useState, useTransition } from 'react'
import { User, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignStaffToBooking } from '@/lib/actions/bookings'
import { useRouter } from 'next/navigation'

interface StaffOption {
  id: string
  first_name: string
  last_name: string | null
}

interface Props {
  bookingId: string
  currentStaffId: string | null
  staffList: StaffOption[]
}

export function StaffAssignSelector({ bookingId, currentStaffId, staffList }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(currentStaffId)

  const selected = staffList.find(s => s.id === selectedId)

  const handleSelect = (staffId: string | null) => {
    setOpen(false)
    if (staffId === selectedId) return
    startTransition(async () => {
      const result = await assignStaffToBooking(bookingId, staffId)
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur')
      } else {
        setSelectedId(staffId)
        toast.success(staffId ? 'Employée assignée' : 'Assignation retirée')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <User className="h-4 w-4 text-gray-400 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">Employée</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            disabled={isPending}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            <span>
              {isPending
                ? 'Enregistrement…'
                : selected
                ? `${selected.first_name} ${selected.last_name ?? ''}`.trim()
                : 'Non assignée'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                    selectedId === null ? 'text-orange-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  Non assignée
                </button>
                {staffList.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                      selectedId === s.id ? 'text-orange-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {s.first_name} {s.last_name ?? ''}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
