'use client'

interface Step {
  label: string
  active: boolean
  done: boolean
}

interface Props {
  steps: Step[]
}

export function BookingSteps({ steps }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step.done
                  ? 'bg-[var(--color-primary)] text-white'
                  : step.active
                  ? 'border-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-2 border-gray-200 text-gray-400'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <span className={`mt-1 text-[10px] font-medium ${step.active || step.done ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mb-4 h-0.5 w-8 mx-1 ${step.done ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
