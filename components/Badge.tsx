import { cn, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700', className)}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
