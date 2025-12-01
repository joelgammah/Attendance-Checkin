// src/components/EventList.tsx

import SoloEventCard from './SoloEventCard'
import RecurringGroupCard from './RecurringGroupCard'
import type { DashboardItem } from '../types'

export default function EventList({
  items,
  showCsv = false,
  onCsv
}: {
  items: DashboardItem[]
  showCsv?: boolean
  onCsv?: (id: number, name: string) => (e: React.MouseEvent) => void
}) {

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events</h3>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {items.map(item =>
        item.type === 'solo' ? (
          <SoloEventCard
            key={item.event.id}
            event={item.event}
            showCsv={showCsv}
            onCsv={onCsv}
          />
        ) : (
          <RecurringGroupCard
            key={item.group.parent.id}
            group={item.group}
          />
        )
      )}
    </div>
  )
}
