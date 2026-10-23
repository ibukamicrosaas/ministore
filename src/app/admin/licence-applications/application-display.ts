/** Older rows predate the financing question and contain only acquisition_plan. */
export function applicationPlanAndFinancingText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
